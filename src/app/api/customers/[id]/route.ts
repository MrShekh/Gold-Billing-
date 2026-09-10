import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import CustomerModel from "@/models/Customer";
import CustomerBalanceModel from "@/models/CustomerBalance";
import BillModel from "@/models/Bill";
import { getAuthUserId } from "@/lib/authHelper";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const userId = getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        await connectDB();
        const { id } = await context.params;
        const c = await CustomerModel.findOne({ _id: id, userId }).lean();
        if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json({ id: c._id.toString(), name: c.name, phone: c.phone, address: c.address ?? "", createdAt: c.createdAt });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const userId = getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        await connectDB();
        const { id } = await context.params;
        const { name, phone, address } = await req.json();
        const c = await CustomerModel.findOneAndUpdate(
            { _id: id, userId },
            { name, phone, address },
            { new: true }
        ).lean();
        if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json({ id: c._id.toString(), name: c.name, phone: c.phone, address: c.address ?? "", createdAt: c.createdAt });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const userId = getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        await connectDB();
        const { id } = await context.params;

        // Verify ownership before deleting
        const customer = await CustomerModel.findOne({ _id: id, userId }).lean();
        if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

        await CustomerModel.findByIdAndDelete(id);
        await BillModel.deleteMany({ customerId: id, userId });
        await CustomerBalanceModel.deleteOne({ customerId: id, userId });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
