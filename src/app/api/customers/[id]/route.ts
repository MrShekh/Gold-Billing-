import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import CustomerModel from "@/models/Customer";
import CustomerBalanceModel from "@/models/CustomerBalance";
import BillModel from "@/models/Bill";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await context.params;
        const c = await CustomerModel.findById(id).lean();
        if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json({ id: c._id.toString(), name: c.name, phone: c.phone, address: c.address ?? "", createdAt: c.createdAt });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await context.params;
        const { name, phone, address } = await req.json();
        const c = await CustomerModel.findByIdAndUpdate(id, { name, phone, address }, { new: true }).lean();
        if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json({ id: c._id.toString(), name: c.name, phone: c.phone, address: c.address ?? "", createdAt: c.createdAt });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await context.params;

        // Delete the customer
        await CustomerModel.findByIdAndDelete(id);

        // Delete all their bills
        await BillModel.deleteMany({ customerId: id });

        // Delete their jama balance record
        await CustomerBalanceModel.deleteOne({ customerId: id });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
