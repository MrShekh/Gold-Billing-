import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProfile extends Document {
    userId: string;
    businessName: string;
    ownerName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    gstNo: string;
}

const ProfileSchema = new Schema<IProfile>(
    {
        userId: { type: String, required: true, unique: true },
        businessName: { type: String, default: "" },
        ownerName: { type: String, default: "" },
        phone: { type: String, default: "" },
        email: { type: String, default: "" },
        address: { type: String, default: "" },
        city: { type: String, default: "" },
        gstNo: { type: String, default: "" },
    },
    { timestamps: true }
);

const Profile: Model<IProfile> =
    mongoose.models.Profile || mongoose.model<IProfile>("Profile", ProfileSchema);

export default Profile;
