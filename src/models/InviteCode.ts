import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInviteCode extends Document {
    code: string;
    createdBy: mongoose.Types.ObjectId;  // user_id of the admin who generated
    expiresAt: Date;
    maxUses: number;
    usedCount: number;
    usedBy: mongoose.Types.ObjectId[];
    note?: string;
    createdAt: Date;
}

const InviteCodeSchema = new Schema<IInviteCode>(
    {
        code: { type: String, required: true, unique: true, uppercase: true, trim: true },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        expiresAt: { type: Date, required: true },
        maxUses: { type: Number, default: 1 },
        usedCount: { type: Number, default: 0 },
        usedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
        note: { type: String },
    },
    { timestamps: true }
);

const InviteCode: Model<IInviteCode> =
    mongoose.models.InviteCode || mongoose.model<IInviteCode>("InviteCode", InviteCodeSchema);

export default InviteCode;
