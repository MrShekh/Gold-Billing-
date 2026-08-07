import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICustomerBalance extends Document {
    customerId: string;
    fineGoldBalance: number;
    cashBalance: number;
    updatedAt: Date;
}

const CustomerBalanceSchema = new Schema<ICustomerBalance>(
    {
        customerId: { type: String, required: true, unique: true },
        fineGoldBalance: { type: Number, default: 0 },
        cashBalance: { type: Number, default: 0 },
    },
    { timestamps: true }
);

const CustomerBalance: Model<ICustomerBalance> =
    mongoose.models.CustomerBalance ||
    mongoose.model<ICustomerBalance>("CustomerBalance", CustomerBalanceSchema);

export default CustomerBalance;
