import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import CustomerModel from "@/models/Customer";

export async function GET() {
    try {
        await connectDB();
        const customers = await CustomerModel.find({}).sort({ createdAt: -1 }).lean();
        return NextResponse.json(customers.map(c => ({
            id: c._id.toString(),
            name: c.name,
            phone: c.phone,
            address: c.address ?? "",
            createdAt: c.createdAt,
        })));
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { name, phone, address } = await req.json();
        const customer = await CustomerModel.create({ name, phone, address });
        return NextResponse.json({
            id: customer._id.toString(),
            name: customer.name,
            phone: customer.phone,
            address: customer.address ?? "",
            createdAt: customer.createdAt,
        }, { status: 201 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
    }
}
