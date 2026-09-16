import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import CustomerModel from "@/models/Customer";
import BillModel from "@/models/Bill";
import CustomerBalanceModel from "@/models/CustomerBalance";
import { getAuthUserId } from "@/lib/authHelper";

export async function GET(req: NextRequest) {
    const userId = getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        await connectDB();
        const today = new Date().toISOString().slice(0, 10);

        const [totalCustomers, totalBills, todayBills, balances] = await Promise.all([
            CustomerModel.countDocuments({ userId }),
            BillModel.countDocuments({ userId }),
            BillModel.countDocuments({ userId, date: today }),
            CustomerBalanceModel.find({ userId }).lean(),
        ]);

        let totalJamaGold = 0;
        let totalJamaCash = 0;
        let totalAdvanceGold = 0;
        let totalAdvanceCash = 0;
        let advanceCustomerCount = 0;

        for (const b of balances) {
            const g = Number(b.fineGoldBalance) || 0;
            const c = Number(b.cashBalance) || 0;
            if (g > 0.0001) totalJamaGold += g;
            if (g < -0.0001) totalAdvanceGold += Math.abs(g);
            if (c > 0.01) totalJamaCash += c;
            if (c < -0.01) totalAdvanceCash += Math.abs(c);
            if (g < -0.0001 || c < -0.01) advanceCustomerCount++;
        }

        return NextResponse.json({
            totalCustomers,
            totalBills,
            todayBills,
            totalJamaGold,
            totalJamaCash,
            totalAdvanceGold,
            totalAdvanceCash,
            advanceCustomerCount,
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
