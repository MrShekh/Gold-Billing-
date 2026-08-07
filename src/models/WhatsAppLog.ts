import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWhatsAppLog extends Document {
    userId: string;
    billId: string;
    customerId?: string;
    phone: string;
    messageId?: string;
    status: string;
    errorMsg?: string;
    createdAt: Date;
}

const WhatsAppLogSchema = new Schema<IWhatsAppLog>(
    {
        userId: { type: String, required: true },
        billId: { type: String, required: true },
        customerId: { type: String },
        phone: { type: String, required: true },
        messageId: { type: String },
        status: { type: String, required: true },
        errorMsg: { type: String },
    },
    { timestamps: true }
);

const WhatsAppLog: Model<IWhatsAppLog> =
    mongoose.models.WhatsAppLog || mongoose.model<IWhatsAppLog>("WhatsAppLog", WhatsAppLogSchema);

export default WhatsAppLog;
