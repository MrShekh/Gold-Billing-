import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "goldbill_secret_change_in_production";

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { emailOrUsername, password } = await req.json();

        if (!emailOrUsername || !password) {
            return NextResponse.json({ error: "Email/Username and password are required" }, { status: 400 });
        }

        const user = await User.findOne({
            $or: [
                { email: emailOrUsername.toLowerCase() },
                { username: emailOrUsername },
            ],
        });

        if (!user) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, username: user.username },
            JWT_SECRET,
            { expiresIn: "30d" }
        );

        const response = NextResponse.json({
            success: true,
            user: { email: user.email, username: user.username },
        });
        response.cookies.set("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 30 * 24 * 60 * 60,
            path: "/",
        });
        return response;
    } catch (err) {
        console.error("Login error:", err);
        return NextResponse.json({ error: "Login failed" }, { status: 500 });
    }
}
