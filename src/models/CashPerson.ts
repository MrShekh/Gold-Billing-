import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICashPerson extends Document {
    userId: string;
    name: string;
    phone: string;
    createdAt: Date;
}

const CashPersonSchema = new Schema<ICashPerson>(
    {
        userId: { type: String, required: true, index: true },
        name: { type: String, required: true, trim: true },
        phone: { type: String, default: "", trim: true },
    },
    { timestamps: true }
);

const CashPerson: Model<ICashPerson> =
    mongoose.models.CashPerson || mongoose.model<ICashPerson>("CashPerson", CashPersonSchema);

export default CashPerson;
