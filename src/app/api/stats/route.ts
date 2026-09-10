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
        for (const b of balances) {
            if (b.fineGoldBalance > 0) totalJamaGold += Number(b.fineGoldBalance);
            if (b.cashBalance > 0) totalJamaCash += Number(b.cashBalance);
        }

        return NextResponse.json({ totalCustomers, totalBills, todayBills, totalJamaGold, totalJamaCash });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
