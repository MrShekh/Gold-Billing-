import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import BillModel from "@/models/Bill";
import CustomerBalanceModel from "@/models/CustomerBalance";
import { getAuthUserId } from "@/lib/authHelper";

function mapBill(b: Record<string, unknown>) {
    return {
        id: (b._id as { toString(): string }).toString(),
        customerId: b.customerId, customerName: b.customerName,
        voucherNo: b.voucherNo, date: b.date, time: b.time, createdAt: b.createdAt,
        paidCash: b.paidCash, receiptCash: b.receiptCash,
        previousBalance: b.previousBalance, closingBalance: b.closingBalance,
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
            type: i.type, sno: i.sno, itemName: i.itemName, pcs: i.pcs,
            grossWeight: i.grossWeight, adWeight: i.adWeight, lessWeight: i.lessWeight,
            description: i.description, netWeight: i.netWeight, tunch: i.tunch,
            rate: i.rate, fineGold: i.fineGold, amount: i.amount,
        })),
        payments: ((b.payments as Array<Record<string, unknown>>) ?? []).map((p) => ({
            id: (p._id as { toString(): string }).toString(),
            amount: p.amount, label: p.label, type: p.type, voucherNo: p.voucherNo, date: p.date,
        })),
    };
}

function billNetTotals(items: any[]) {
    let fineGold = 0;
    let cash = 0;
    for (const item of items ?? []) {
        const itemFine = parseFloat(item.fineGold ?? "0") || 0;
        const itemAmount = parseFloat(item.amount ?? "0") || 0;
        if (item.type === "ISSUE") {
            fineGold += itemFine;
            cash += itemAmount;
        } else {
            fineGold -= itemFine;
            cash -= itemAmount;
        }
    }
    return { fineGold, cash };
}

import { recalculateCustomerLedger } from "@/lib/recalcLedger";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const userId = getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        await connectDB();
        const { id } = await context.params;
        const bill = await BillModel.findOne({ _id: id, userId }).lean();
        if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(mapBill(bill as unknown as Record<string, unknown>));
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
        const data = await req.json();

        const existing = await BillModel.findOne({ _id: id, userId }).lean() as any;
        if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
        const oldCustomerId = existing.customerId as string;

        // Update bill data with userId
        await BillModel.findByIdAndUpdate(id, { ...data, userId }, { new: true });

        // Recalculate chronological ledger for this customer
        await recalculateCustomerLedger(userId, data.customerId || oldCustomerId);

        // If customer was changed, recalculate old customer's ledger as well
        if (oldCustomerId && oldCustomerId !== data.customerId) {
            await recalculateCustomerLedger(userId, oldCustomerId);
        }

        const fresh = await BillModel.findById(id).lean();
        return NextResponse.json(mapBill(fresh as unknown as Record<string, unknown>));
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

        const bill = await BillModel.findOne({ _id: id, userId }).lean() as any;
        if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const customerId = bill.customerId as string;
        await BillModel.findByIdAndDelete(id);

        // Recalculate remaining bills for this customer
        await recalculateCustomerLedger(userId, customerId);

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
