import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import CustomerModel from "@/models/Customer";
import BillModel from "@/models/Bill";
import CustomerBalanceModel from "@/models/CustomerBalance";

export async function GET() {
    try {
        await connectDB();
        const today = new Date().toISOString().slice(0, 10);

        const [totalCustomers, totalBills, todayBills, balances] = await Promise.all([
            CustomerModel.countDocuments(),
            BillModel.countDocuments(),
            BillModel.countDocuments({ date: today }),
            CustomerBalanceModel.find({}).lean(),
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
