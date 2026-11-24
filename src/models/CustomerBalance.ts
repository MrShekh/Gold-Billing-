import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICustomerBalance extends Document {
    userId: string;
    customerId: string;
    fineGoldBalance: number;
    cashBalance: number;
    /** Total of Settle/Payment entries (not inside any bill). Kept so a bill recalculation never wipes them. */
    settledGold?: number;
    settledCash?: number;
    updatedAt: Date;
}

const CustomerBalanceSchema = new Schema<ICustomerBalance>(
    {
        userId: { type: String, required: true },
        customerId: { type: String, required: true },
        fineGoldBalance: { type: Number, default: 0 },
        cashBalance: { type: Number, default: 0 },
        settledGold: { type: Number, default: 0 },
        settledCash: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// Unique per user+customer pair (was previously unique on customerId alone)
CustomerBalanceSchema.index({ userId: 1, customerId: 1 }, { unique: true });

const CustomerBalance: Model<ICustomerBalance> =
    mongoose.models.CustomerBalance ||
    mongoose.model<ICustomerBalance>("CustomerBalance", CustomerBalanceSchema);

export default CustomerBalance;
