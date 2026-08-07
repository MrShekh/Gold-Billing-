import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import ProfileModel from "@/models/Profile";

type LeanProfile = {
    _id: { toString(): string };
    businessName: string;
    ownerName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    gstNo: string;
    updatedAt?: Date;
};

function toResponse(p: LeanProfile) {
    return {
        id: p._id.toString(),
        business_name: p.businessName,
        owner_name: p.ownerName,
        phone: p.phone,
        email: p.email,
        address: p.address,
        city: p.city,
        gst_no: p.gstNo,
        updated_at: p.updatedAt,
    };
}

export async function GET() {
    try {
        await connectDB();
        const profile = await ProfileModel.findOne({}).lean() as LeanProfile | null;
        if (!profile) return NextResponse.json(null);
        return NextResponse.json(toResponse(profile));
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const data = await req.json();
        const existing = await ProfileModel.findOne({});

        let profile: LeanProfile | null;
        if (existing) {
            profile = await ProfileModel.findByIdAndUpdate(existing._id, {
                businessName: data.business_name,
                ownerName: data.owner_name,
                phone: data.phone,
                email: data.email,
                address: data.address,
                city: data.city,
                gstNo: data.gst_no,
            }, { new: true }).lean() as LeanProfile | null;
        } else {
            const created = await ProfileModel.create({
                businessName: data.business_name,
                ownerName: data.owner_name,
                phone: data.phone,
                email: data.email,
                address: data.address,
                city: data.city,
                gstNo: data.gst_no,
            });
            profile = await ProfileModel.findById(created._id).lean() as LeanProfile | null;
        }

        if (!profile) return NextResponse.json({ error: "Failed" }, { status: 500 });
        return NextResponse.json(toResponse(profile));
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
