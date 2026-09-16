import BillModel from "@/models/Bill";
import CustomerBalanceModel from "@/models/CustomerBalance";

/**
 * Re-runs the entire chronological ledger calculation for a specific customer.
 * Cascades previous & closing balances through every bill in order (oldest to newest).
 * This ensures that editing or deleting Bill 1 automatically updates Bill 2, Bill 3, etc.
 */
export async function recalculateCustomerLedger(userId: string, customerId: string) {
    if (!userId || !customerId) {
        return { fineGoldBalance: 0, cashBalance: 0 };
    }

    // Fetch all bills for this customer sorted chronologically
    const bills = await BillModel.find({ userId, customerId })
        .sort({ date: 1, createdAt: 1 })
        .exec();

    let runningGold = 0;
    let runningCash = 0;

    for (const bill of bills) {
        const items = (bill.items as unknown as Array<Record<string, unknown>>) ?? [];

        let issueFine = 0;
        let recvFine = 0;
        let issueCash = 0;
        let recvCash = 0;

        for (const item of items) {
            const fine = parseFloat((item.fineGold as string) ?? "0") || 0;
            const amt = parseFloat((item.amount as string) ?? "0") || 0;
            const type = item.type as string;

            if (type === "ISSUE") {
                issueFine += fine;
                issueCash += amt;
            } else if (type === "RECEIVE") {
                recvFine += fine;
                recvCash += amt;
            }
        }

        const billFineNet = issueFine - recvFine;
        const billCashNet = issueCash - recvCash;

        const prevFine = runningGold;
        const prevCash = runningCash;

        // Running balance after this bill:
        // positive (+) = Due (customer owes shop)
        // negative (-) = Advance (customer has deposited extra gold/cash with shop)
        runningGold = Number((runningGold + billFineNet).toFixed(3));
        runningCash = Number((runningCash + billCashNet).toFixed(2));

        bill.prevFineGold = prevFine.toFixed(3);
        bill.closingFineGold = runningGold.toFixed(3);
        bill.previousBalance = prevCash.toFixed(2);
        bill.closingBalance = runningCash.toFixed(2);
        bill.billTotalFine = billFineNet.toFixed(3);

        await bill.save();
    }

    // Update the live customer balance in DB
    await CustomerBalanceModel.findOneAndUpdate(
        { userId, customerId },
        { userId, fineGoldBalance: runningGold, cashBalance: runningCash },
        { upsert: true, new: true }
    );

    return { fineGoldBalance: runningGold, cashBalance: runningCash };
}
