import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICashEntry extends Document {
    userId: string;
    personId: string;
    // GIVEN = client gave cash to the person, RECEIVED = client received cash from the person
    type: "GIVEN" | "RECEIVED";
    amount: number;
    note?: string;
    isSettlement: boolean;
    date: Date;
    createdAt: Date;
}

const CashEntrySchema = new Schema<ICashEntry>(
    {
        userId: { type: String, required: true, index: true },
        personId: { type: String, required: true, index: true },
        type: { type: String, enum: ["GIVEN", "RECEIVED"], required: true },
        amount: { type: Number, required: true, min: 0.01 },
        note: { type: String, default: "" },
        isSettlement: { type: Boolean, default: false },
        date: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

const CashEntry: Model<ICashEntry> =
    mongoose.models.CashEntry || mongoose.model<ICashEntry>("CashEntry", CashEntrySchema);

export default CashEntry;
