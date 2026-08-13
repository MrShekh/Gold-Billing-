import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";

const DEV_SECRET = process.env.DEV_SECRET;

function checkSecret(req: NextRequest): boolean {
    const secret = req.headers.get("x-dev-secret") || "";
    return !!DEV_SECRET && secret === DEV_SECRET;
}

// GET — list all users (masked passwords)
export async function GET(req: NextRequest) {
    if (!checkSecret(req)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        await connectDB();
        const users = await User.find({}).lean();
        return NextResponse.json(
            users.map((u) => ({
                id: u._id.toString(),
                email: u.email,
                username: u.username,
                phone: u.phone ?? null,
                createdAt: u.createdAt,
                hasResetPending: !!u.resetOtp,
            }))
        );
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

// POST — reset any user's password directly
export async function POST(req: NextRequest) {
    if (!checkSecret(req)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        await connectDB();
        const { email, newPassword } = await req.json();

        if (!email || !newPassword) {
            return NextResponse.json({ error: "email and newPassword required" }, { status: 400 });
        }
        if (newPassword.length < 6) {
            return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const hashed = await bcrypt.hash(newPassword, 12);
        user.password = hashed;
        user.resetOtp = undefined;
        user.resetOtpExpiry = undefined;
        await user.save();

        return NextResponse.json({ success: true, message: `Password for ${user.email} has been reset.` });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

// DELETE — delete a user (use with caution)
export async function DELETE(req: NextRequest) {
    if (!checkSecret(req)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        await connectDB();
        const { email } = await req.json();
        if (!email) {
            return NextResponse.json({ error: "email required" }, { status: 400 });
        }
        await User.deleteOne({ email: email.toLowerCase().trim() });
        return NextResponse.json({ success: true, message: `User ${email} deleted.` });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
