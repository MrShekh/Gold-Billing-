import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import { sendOtpEmail } from "@/lib/email";

function generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            // Return success anyway to prevent email enumeration
            return NextResponse.json({ success: true, message: "If this email is registered, an OTP has been sent." });
        }

        const otp = generateOtp();
        const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.resetOtp = otp;
        user.resetOtpExpiry = expiry;
        await user.save();

        await sendOtpEmail(user.email, otp, user.username);

        return NextResponse.json({ success: true, message: "OTP sent to your email address." });
    } catch (err) {
        console.error("Forgot password error:", err);
        return NextResponse.json({ error: "Failed to send OTP. Check email configuration." }, { status: 500 });
    }
}
