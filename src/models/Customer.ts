import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICustomer extends Document {
    name: string;
    phone: string;
    address?: string;
    createdAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
    {
        name: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        address: { type: String, default: "" },
    },
    { timestamps: true }
);

const Customer: Model<ICustomer> =
    mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema);

export default Customer;
