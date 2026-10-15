import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import CashPersonModel from "@/models/CashPerson";
import CashEntryModel from "@/models/CashEntry";
import { getAuthUserId } from "@/lib/authHelper";

// Balance > 0  => person owes the client. Balance < 0 => client owes the person.
export async function GET(req: NextRequest) {
    const userId = getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        await connectDB();
        const [people, entries] = await Promise.all([
            CashPersonModel.find({ userId }).sort({ createdAt: -1 }).lean(),
            CashEntryModel.find({ userId }).lean(),
        ]);
        const balances: Record<string, number> = {};
        for (const e of entries) {
            balances[e.personId] = (balances[e.personId] ?? 0) + (e.type === "GIVEN" ? e.amount : -e.amount);
        }
        return NextResponse.json(people.map(p => ({
            id: p._id.toString(),
            name: p.name,
            phone: p.phone ?? "",
            balance: Math.round((balances[p._id.toString()] ?? 0) * 100) / 100,
            createdAt: p.createdAt,
        })));
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const userId = getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        await connectDB();
        const { name, phone } = await req.json();
        if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
        const p = await CashPersonModel.create({ userId, name, phone: phone ?? "" });
        return NextResponse.json({ id: p._id.toString(), name: p.name, phone: p.phone, balance: 0, createdAt: p.createdAt }, { status: 201 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to create" }, { status: 500 });
    }
}
