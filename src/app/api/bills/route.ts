import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import BillModel from "@/models/Bill";
import CustomerBalanceModel from "@/models/CustomerBalance";
import { getAuthUserId } from "@/lib/authHelper";

function mapBill(b: Record<string, unknown>) {
    return {
        id: (b._id as { toString(): string }).toString(),
        customerId: b.customerId,
        customerName: b.customerName,
        voucherNo: b.voucherNo,
        date: b.date,
        time: b.time,
        createdAt: b.createdAt,
        paidCash: b.paidCash,
        receiptCash: b.receiptCash,
        previousBalance: b.previousBalance,
        closingBalance: b.closingBalance,
        drNaam: b.drNaam,
        issueTotalGross: b.issueTotalGross, issueTotalLess: b.issueTotalLess,
        issueTotalNet: b.issueTotalNet, issueTotalFine: b.issueTotalFine,
        recvTotalGross: b.recvTotalGross, recvTotalLess: b.recvTotalLess,
        recvTotalNet: b.recvTotalNet, recvTotalFine: b.recvTotalFine,
        billTotalGross: b.billTotalGross, billTotalLess: b.billTotalLess,
        billTotalNet: b.billTotalNet, billTotalFine: b.billTotalFine,
        prevFineGold: b.prevFineGold, closingFineGold: b.closingFineGold,
        items: ((b.items as Array<Record<string, unknown>>) ?? []).map((i) => ({
            id: (i._id as { toString(): string }).toString(),
            type: i.type,
            sno: i.sno,
            itemName: i.itemName,
            pcs: i.pcs,
            grossWeight: i.grossWeight,
            adWeight: i.adWeight,
            lessWeight: i.lessWeight,
            description: i.description,
            netWeight: i.netWeight,
            tunch: i.tunch,
            rate: i.rate,
            fineGold: i.fineGold,
            amount: i.amount,
        })),
        payments: ((b.payments as Array<Record<string, unknown>>) ?? []).map((p) => ({
            id: (p._id as { toString(): string }).toString(),
            amount: p.amount,
            label: p.label,
            type: p.type,
            voucherNo: p.voucherNo,
            date: p.date,
        })),
    };
}

export async function GET(req: NextRequest) {
    const userId = getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        await connectDB();
        const customerId = req.nextUrl.searchParams.get("customerId");
        const query: Record<string, unknown> = { userId };
        if (customerId) query.customerId = customerId;
        const bills = await BillModel.find(query).sort({ createdAt: -1 }).lean();
        return NextResponse.json(bills.map(b => mapBill(b as unknown as Record<string, unknown>)));
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to fetch bills" }, { status: 500 });
    }
}

import { recalculateCustomerLedger } from "@/lib/recalcLedger";

export async function POST(req: NextRequest) {
    const userId = getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        await connectDB();
        const data = await req.json();

        const bill = await BillModel.create({
            ...data,
            userId,
        });

        // Recalculate full ledger chronologically
        await recalculateCustomerLedger(userId, data.customerId);

        const fresh = await BillModel.findById(bill._id).lean();
        return NextResponse.json(mapBill(fresh as unknown as Record<string, unknown>), { status: 201 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to create bill" }, { status: 500 });
    }
}
