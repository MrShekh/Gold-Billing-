import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import CustomerBalanceModel from "@/models/CustomerBalance";

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const customerId = searchParams.get("customerId");

        if (customerId) {
            const bal = await CustomerBalanceModel.findOne({ customerId }).lean();
            if (!bal) return NextResponse.json(null);
            return NextResponse.json({
                id: (bal._id as { toString(): string }).toString(),
                customer_id: bal.customerId,
                fine_gold_balance: bal.fineGoldBalance,
                cash_balance: bal.cashBalance,
                updated_at: bal.updatedAt,
            });
        }

        const all = await CustomerBalanceModel.find({}).lean();
        return NextResponse.json(all.map(b => ({
            id: (b._id as { toString(): string }).toString(),
            customer_id: b.customerId,
            fine_gold_balance: b.fineGoldBalance,
            cash_balance: b.cashBalance,
            updated_at: b.updatedAt,
        })));
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { customerId, paidFineGold, paidCash } = await req.json();
        const prev = await CustomerBalanceModel.findOne({ customerId });
        const newFineGold = Math.max(0, (prev?.fineGoldBalance ?? 0) - (paidFineGold || 0));
        const newCash = Math.max(0, (prev?.cashBalance ?? 0) - (paidCash || 0));

        await CustomerBalanceModel.findOneAndUpdate(
            { customerId },
            { fineGoldBalance: newFineGold, cashBalance: newCash },
            { upsert: true, new: true }
        );
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
