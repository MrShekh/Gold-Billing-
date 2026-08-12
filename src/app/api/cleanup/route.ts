import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import BillModel from "@/models/Bill";
import CustomerBalanceModel from "@/models/CustomerBalance";

// One-time cleanup: recalculate ALL customer balances from actual bills
export async function POST() {
    try {
        await connectDB();

        // Delete all existing balance records
        await CustomerBalanceModel.deleteMany({});

        // Get all bills
        const allBills = await BillModel.find({}).lean() as any[];

        // Group by customerId and recalculate
        const balanceMap: Record<string, { fineGold: number; cash: number }> = {};

        for (const bill of allBills) {
            const cid = bill.customerId as string;
            if (!balanceMap[cid]) balanceMap[cid] = { fineGold: 0, cash: 0 };

            const items = (bill.items ?? []) as any[];
            for (const item of items) {
                const fineGold = parseFloat(item.fineGold ?? "0") || 0;
                const amount = parseFloat(item.amount ?? "0") || 0;
                if (item.type === "ISSUE") {
                    balanceMap[cid].fineGold += fineGold;
                    balanceMap[cid].cash += amount;
                } else {
                    balanceMap[cid].fineGold -= fineGold;
                    balanceMap[cid].cash -= amount;
                }
            }
        }

        // Bulk upsert balances
        const ops = Object.entries(balanceMap).map(([customerId, bal]) => ({
            updateOne: {
                filter: { customerId },
                update: { $set: { fineGoldBalance: bal.fineGold, cashBalance: bal.cash } },
                upsert: true,
            },
        }));

        if (ops.length > 0) {
            await CustomerBalanceModel.bulkWrite(ops);
        }

        return NextResponse.json({
            success: true,
            message: `Recalculated balances for ${ops.length} customer(s).`,
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
    }
}
