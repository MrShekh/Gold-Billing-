import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "goldbill_secret_change_in_production";

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { email, username, password } = await req.json();

        if (!email || !username || !password) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        // Check if any user already exists (single-user app)
        const existingUser = await User.findOne({});
        if (existingUser) {
            return NextResponse.json({ error: "Account already set up. Please login." }, { status: 400 });
        }

        const hashed = await bcrypt.hash(password, 12);
        const user = await User.create({ email: email.toLowerCase(), username, password: hashed });

        const token = jwt.sign({ id: user._id, email: user.email, username: user.username }, JWT_SECRET, { expiresIn: "30d" });

        const response = NextResponse.json({ success: true, message: "Account created successfully" });
        response.cookies.set("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 30 * 24 * 60 * 60, // 30 days
            path: "/",
        });
        return response;
    } catch (err) {
        console.error("Setup error:", err);
        return NextResponse.json({ error: "Setup failed" }, { status: 500 });
    }
}
