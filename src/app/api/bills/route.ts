import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import BillModel from "@/models/Bill";
import CustomerBalanceModel from "@/models/CustomerBalance";

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

export async function GET() {
    try {
        await connectDB();
        const bills = await BillModel.find({}).sort({ createdAt: -1 }).lean();
        return NextResponse.json(bills.map(b => mapBill(b as unknown as Record<string, unknown>)));
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to fetch bills" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const data = await req.json();

        // Calculate jama balance
        const prev = await CustomerBalanceModel.findOne({ customerId: data.customerId });
        const prevFineGoldNum = prev?.fineGoldBalance ?? 0;
        const prevCashNum = prev?.cashBalance ?? 0;

        const issueFineGold = (data.items ?? []).filter((i: { type: string }) => i.type === "ISSUE").reduce((s: number, i: { fineGold?: string }) => s + (parseFloat(i.fineGold ?? "0") || 0), 0);
        const recvFineGold = (data.items ?? []).filter((i: { type: string }) => i.type === "RECEIVE").reduce((s: number, i: { fineGold?: string }) => s + (parseFloat(i.fineGold ?? "0") || 0), 0);
        const billFineGold = issueFineGold - recvFineGold;

        const issueCash = (data.items ?? []).filter((i: { type: string }) => i.type === "ISSUE").reduce((s: number, i: { amount?: string }) => s + (parseFloat(i.amount ?? "0") || 0), 0);
        const recvCash = (data.items ?? []).filter((i: { type: string }) => i.type === "RECEIVE").reduce((s: number, i: { amount?: string }) => s + (parseFloat(i.amount ?? "0") || 0), 0);
        const billCash = issueCash - recvCash;

        const closingFineGoldNum = prevFineGoldNum + billFineGold;
        const closingCashNum = prevCashNum + billCash;

        const bill = await BillModel.create({
            ...data,
            previousBalance: prevCashNum.toFixed(2),
            closingBalance: closingCashNum.toFixed(2),
            prevFineGold: prevFineGoldNum.toFixed(3),
            closingFineGold: closingFineGoldNum.toFixed(3),
        });

        await CustomerBalanceModel.findOneAndUpdate(
            { customerId: data.customerId },
            { fineGoldBalance: closingFineGoldNum, cashBalance: closingCashNum },
            { upsert: true, new: true }
        );

        const fresh = await BillModel.findById(bill._id).lean();
        return NextResponse.json(mapBill(fresh as unknown as Record<string, unknown>), { status: 201 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to create bill" }, { status: 500 });
    }
}
