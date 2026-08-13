import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { email, otp, newPassword } = await req.json();

        if (!email || !otp || !newPassword) {
            return NextResponse.json({ error: "Email, OTP, and new password are required" }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return NextResponse.json({ error: "Invalid OTP or email" }, { status: 400 });
        }

        // Check OTP
        if (!user.resetOtp || user.resetOtp !== otp.trim()) {
            return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
        }

        // Check expiry
        if (!user.resetOtpExpiry || user.resetOtpExpiry < new Date()) {
            return NextResponse.json({ error: "OTP has expired. Please request a new one." }, { status: 400 });
        }

        // Hash new password and clear OTP
        const hashed = await bcrypt.hash(newPassword, 12);
        user.password = hashed;
        user.resetOtp = undefined;
        user.resetOtpExpiry = undefined;
        await user.save();

        return NextResponse.json({ success: true, message: "Password reset successfully. You can now log in." });
    } catch (err) {
        console.error("Reset password error:", err);
        return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
    }
}
