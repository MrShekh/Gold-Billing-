import mongoose, { Schema, Document, Model } from "mongoose";

const BillItemSchema = new Schema({
    type: { type: String, enum: ["ISSUE", "RECEIVE"], required: true },
    sno: { type: Number, default: 1 },
    itemName: { type: String, default: "" },
    pcs: { type: String, default: "" },
    grossWeight: { type: String, default: "" },
    adWeight: { type: String, default: "" },
    lessWeight: { type: String, default: "" },
    description: { type: String, default: "" },
    netWeight: { type: String, default: "" },
    tunch: { type: String, default: "" },
    rate: { type: String, default: "" },
    fineGold: { type: String, default: "" },
    amount: { type: String, default: "" },
}, { _id: true });

const PaymentEntrySchema = new Schema({
    amount: { type: String, default: "" },
    label: { type: String, default: "" },
    type: { type: String, enum: ["paid", "receipt", "previous"], default: "paid" },
    voucherNo: { type: String, default: "" },
    date: { type: String, default: "" },
}, { _id: true });

export interface IBill extends Document {
    customerId: string;
    customerName: string;
    voucherNo: string;
    date: string;
    time?: string;
    items: mongoose.Types.DocumentArray<mongoose.Document>;
    payments: mongoose.Types.DocumentArray<mongoose.Document>;
    paidCash?: string;
    receiptCash?: string;
    previousBalance?: string;
    closingBalance?: string;
    drNaam?: string;
    issueTotalGross?: string;
    issueTotalLess?: string;
    issueTotalNet?: string;
    issueTotalFine?: string;
    recvTotalGross?: string;
    recvTotalLess?: string;
    recvTotalNet?: string;
    recvTotalFine?: string;
    billTotalGross?: string;
    billTotalLess?: string;
    billTotalNet?: string;
    billTotalFine?: string;
    prevFineGold?: string;
    closingFineGold?: string;
    createdAt: Date;
}

const BillSchema = new Schema<IBill>(
    {
        customerId: { type: String, required: true },
        customerName: { type: String, required: true },
        voucherNo: { type: String, required: true },
        date: { type: String, required: true },
        time: { type: String },
        items: [BillItemSchema],
        payments: [PaymentEntrySchema],
        paidCash: String,
        receiptCash: String,
        previousBalance: String,
        closingBalance: String,
        drNaam: String,
        issueTotalGross: String, issueTotalLess: String,
        issueTotalNet: String, issueTotalFine: String,
        recvTotalGross: String, recvTotalLess: String,
        recvTotalNet: String, recvTotalFine: String,
        billTotalGross: String, billTotalLess: String,
        billTotalNet: String, billTotalFine: String,
        prevFineGold: String, closingFineGold: String,
    },
    { timestamps: true }
);

const Bill: Model<IBill> =
    mongoose.models.Bill || mongoose.model<IBill>("Bill", BillSchema);

export default Bill;
