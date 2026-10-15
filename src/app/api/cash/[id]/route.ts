import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import CashPersonModel from "@/models/CashPerson";
import CashEntryModel from "@/models/CashEntry";
import { getAuthUserId } from "@/lib/authHelper";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: Ctx) {
    const userId = getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        await connectDB();
        const { id } = await context.params;
        const p = await CashPersonModel.findOne({ _id: id, userId }).lean();
        if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
        const entries = await CashEntryModel.find({ personId: id, userId }).sort({ date: -1, createdAt: -1 }).lean();
        const balance = entries.reduce((s, e) => s + (e.type === "GIVEN" ? e.amount : -e.amount), 0);
        return NextResponse.json({
            id: p._id.toString(),
            name: p.name,
            phone: p.phone ?? "",
            balance: Math.round(balance * 100) / 100,
            entries: entries.map(e => ({
                id: e._id.toString(),
                type: e.type,
                amount: e.amount,
                note: e.note ?? "",
                isSettlement: !!e.isSettlement,
                date: e.date,
            })),
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

// Add a transaction, or settle (body: { settle: true, amount? })
export async function POST(req: NextRequest, context: Ctx) {
    const userId = getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        await connectDB();
        const { id } = await context.params;
        const p = await CashPersonModel.findOne({ _id: id, userId }).lean();
        if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
        const body = await req.json();

        if (body.settle) {
            const entries = await CashEntryModel.find({ personId: id, userId }).lean();
            const balance = entries.reduce((s, e) => s + (e.type === "GIVEN" ? e.amount : -e.amount), 0);
            const abs = Math.abs(balance);
            if (abs < 0.01) return NextResponse.json({ error: "Nothing to settle" }, { status: 400 });
            const requested = body.amount ? Number(body.amount) : abs;
            const amount = Math.min(requested, abs);
            if (!(amount > 0)) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
            // Person owes client -> they pay back (RECEIVED). Client owes person -> client pays (GIVEN).
            await CashEntryModel.create({
                userId, personId: id, amount,
                type: balance > 0 ? "RECEIVED" : "GIVEN",
                isSettlement: true,
                note: body.note || "Settlement",
                date: new Date(),
            });
            return NextResponse.json({ success: true }, { status: 201 });
        }

        const amount = Number(body.amount);
        if (!(amount > 0)) return NextResponse.json({ error: "Enter a valid amount" }, { status: 400 });
        if (body.type !== "GIVEN" && body.type !== "RECEIVED") return NextResponse.json({ error: "Invalid type" }, { status: 400 });
        await CashEntryModel.create({
            userId, personId: id, amount, type: body.type,
            note: body.note ?? "",
            date: body.date ? new Date(body.date) : new Date(),
        });
        return NextResponse.json({ success: true }, { status: 201 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

// Edit name / number
export async function PUT(req: NextRequest, context: Ctx) {
    const userId = getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        await connectDB();
        const { id } = await context.params;
        const { name, phone } = await req.json();
        if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
        const p = await CashPersonModel.findOneAndUpdate(
            { _id: id, userId },
            { name: name.trim(), phone: (phone ?? "").trim() },
            { new: true }
        ).lean();
        if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json({ id: p._id.toString(), name: p.name, phone: p.phone ?? "" });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

// Delete a person (all entries) or a single entry via ?entryId=
export async function DELETE(req: NextRequest, context: Ctx) {
    const userId = getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        await connectDB();
        const { id } = await context.params;
        const entryId = req.nextUrl.searchParams.get("entryId");
        if (entryId) {
            await CashEntryModel.deleteOne({ _id: entryId, personId: id, userId });
            return NextResponse.json({ success: true });
        }
        const p = await CashPersonModel.findOne({ _id: id, userId }).lean();
        if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
        await CashPersonModel.deleteOne({ _id: id, userId });
        await CashEntryModel.deleteMany({ personId: id, userId });
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
