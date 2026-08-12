import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import CustomerModel from "@/models/Customer";
import BillModel from "@/models/Bill";
import CustomerBalanceModel from "@/models/CustomerBalance";

export async function GET() {
    try {
        await connectDB();
        const [customers, bills, balances] = await Promise.all([
            CustomerModel.find({}).lean(),
            BillModel.find({}).lean(),
            CustomerBalanceModel.find({}).lean(),
        ]);

        const backup = {
            exportedAt: new Date().toISOString(),
            version: "1.0",
            customers: (customers as any[]).map(c => ({
                id: c._id.toString(),
                name: c.name,
                phone: c.phone,
                address: c.address ?? "",
                createdAt: c.createdAt,
            })),
            bills: (bills as any[]).map(b => ({
                id: b._id.toString(),
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
                issueTotalGross: b.issueTotalGross,
                issueTotalLess: b.issueTotalLess,
                issueTotalNet: b.issueTotalNet,
                issueTotalFine: b.issueTotalFine,
                recvTotalGross: b.recvTotalGross,
                recvTotalLess: b.recvTotalLess,
                recvTotalNet: b.recvTotalNet,
                recvTotalFine: b.recvTotalFine,
                billTotalGross: b.billTotalGross,
                billTotalLess: b.billTotalLess,
                billTotalNet: b.billTotalNet,
                billTotalFine: b.billTotalFine,
                prevFineGold: b.prevFineGold,
                closingFineGold: b.closingFineGold,
                items: (b.items ?? []).map((i: any) => ({
                    id: i._id ? i._id.toString() : "",
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
                payments: (b.payments ?? []).map((p: any) => ({
                    id: p._id ? p._id.toString() : "",
                    amount: p.amount,
                    label: p.label,
                    type: p.type,
                    voucherNo: p.voucherNo,
                    date: p.date,
                })),
            })),
            customerBalances: (balances as any[]).map(b => ({
                id: b._id.toString(),
                customerId: b.customerId,
                fineGoldBalance: b.fineGoldBalance,
                cashBalance: b.cashBalance,
                updatedAt: b.updatedAt,
            })),
        };

        return NextResponse.json(backup);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Backup failed" }, { status: 500 });
    }
}
