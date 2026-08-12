import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import BillModel from "@/models/Bill";
import CustomerBalanceModel from "@/models/CustomerBalance";

function mapBill(b: Record<string, unknown>) {
    return {
        id: (b._id as { toString(): string }).toString(),
        customerId: b.customerId, customerName: b.customerName,
        voucherNo: b.voucherNo, date: b.date, createdAt: b.createdAt,
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

// ── Helper: recalculate customer balance from all their remaining bills ────────
async function recalcCustomerBalance(customerId: string) {
    const remainingBills = await BillModel.find({ customerId }).lean() as any[];

    let totalFineGold = 0;
    let totalCash = 0;

    for (const bill of remainingBills) {
        const items = (bill.items ?? []) as any[];
        for (const item of items) {
            const fineGold = parseFloat(item.fineGold ?? "0") || 0;
            const amount = parseFloat(item.amount ?? "0") || 0;
            if (item.type === "ISSUE") {
                totalFineGold += fineGold;
                totalCash += amount;
            } else {
                totalFineGold -= fineGold;
                totalCash -= amount;
            }
        }
    }

    if (remainingBills.length === 0) {
        // No bills left — remove balance record entirely
        await CustomerBalanceModel.deleteOne({ customerId });
    } else {
        await CustomerBalanceModel.findOneAndUpdate(
            { customerId },
            { fineGoldBalance: totalFineGold, cashBalance: totalCash },
            { upsert: true, new: true }
        );
    }
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await context.params;
        const bill = await BillModel.findById(id).lean();
        if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(mapBill(bill as unknown as Record<string, unknown>));
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await context.params;
        const data = await req.json();
        const bill = await BillModel.findByIdAndUpdate(id, data, { new: true }).lean();
        if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(mapBill(bill as unknown as Record<string, unknown>));
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await context.params;

        // Find bill first so we know which customer to update
        const bill = await BillModel.findById(id).lean() as any;
        if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const customerId = bill.customerId as string;

        // Delete the bill
        await BillModel.findByIdAndDelete(id);

        // Recalculate customer balance from remaining bills
        await recalcCustomerBalance(customerId);

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
