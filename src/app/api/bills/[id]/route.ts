import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import BillModel from "@/models/Bill";
import CustomerBalanceModel from "@/models/CustomerBalance";

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

// ── Helper: recalculate customer balance from all their remaining bills ────────
// Returns the recomputed totals so callers (e.g. PUT) can also refresh the
// per-bill prevFineGold/closingFineGold snapshot fields.
async function recalcCustomerBalance(customerId: string) {
    const remainingBills = await BillModel.find({ customerId }).lean() as any[];

    let totalFineGold = 0;
    let totalCash = 0;
    for (const bill of remainingBills) {
        const { fineGold, cash } = billNetTotals(bill.items ?? []);
        totalFineGold += fineGold;
        totalCash += cash;
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

    return { totalFineGold, totalCash };
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

        const existing = await BillModel.findById(id).lean() as any;
        if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
        const oldCustomerId = existing.customerId as string;

        let bill = await BillModel.findByIdAndUpdate(id, data, { new: true }).lean() as any;
        if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // Jama balance is derived from item totals, so any edit (e.g. adding/changing
        // ISSUE or RECEIVE rows) must recompute it — otherwise it keeps the stale
        // pre-edit value.
        const { totalFineGold } = await recalcCustomerBalance(bill.customerId as string);
        if (oldCustomerId && oldCustomerId !== bill.customerId) {
            await recalcCustomerBalance(oldCustomerId);
        }

        // The printed bill reads its own frozen prevFineGold/closingFineGold snapshot
        // rather than the live customer balance, so it must be refreshed too —
        // otherwise the preview keeps showing the pre-edit closing amount.
        // (previousBalance/closingBalance are left alone: on the edit page those are
        // separate, manually-typed ledger fields, not derived Cash Jama totals.)
        const { fineGold: thisBillFine } = billNetTotals(bill.items ?? []);
        const prevFineGoldNum = totalFineGold - thisBillFine;
        bill = await BillModel.findByIdAndUpdate(id, {
            prevFineGold: prevFineGoldNum.toFixed(3),
            closingFineGold: totalFineGold.toFixed(3),
        }, { new: true }).lean() as any;

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
