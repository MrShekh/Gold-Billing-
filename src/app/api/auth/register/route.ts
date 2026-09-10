import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import InviteCode from "@/models/InviteCode";

const JWT_SECRET = process.env.JWT_SECRET || "goldbill_secret_change_in_production";

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { email, username, password, inviteCode } = await req.json();

        // ── Validate inputs ──────────────────────────────────────────────────
        if (!email || !username || !password || !inviteCode) {
            return NextResponse.json(
                { error: "All fields (email, username, password, invite code) are required" },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters" },
                { status: 400 }
            );
        }

        // ── Validate invite code ─────────────────────────────────────────────
        const invite = await InviteCode.findOne({ code: inviteCode.trim().toUpperCase() });

        if (!invite) {
            return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
        }

        if (new Date() > invite.expiresAt) {
            return NextResponse.json({ error: "Invite code has expired" }, { status: 400 });
        }

        if (invite.usedCount >= invite.maxUses) {
            return NextResponse.json({ error: "Invite code has already been used the maximum number of times" }, { status: 400 });
        }

        // ── Check for duplicate email / username ────────────────────────────
        const existingByEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingByEmail) {
            return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
        }

        const existingByUsername = await User.findOne({ username });
        if (existingByUsername) {
            return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
        }

        // ── Create user ──────────────────────────────────────────────────────
        const hashed = await bcrypt.hash(password, 12);
        const user = await User.create({
            email: email.toLowerCase(),
            username,
            password: hashed,
        });

        // ── Mark invite code as used ─────────────────────────────────────────
        invite.usedCount += 1;
        invite.usedBy.push(user._id);
        await invite.save();

        // ── Issue JWT & set cookie ───────────────────────────────────────────
        const token = jwt.sign(
            { id: user._id, email: user.email, username: user.username },
            JWT_SECRET,
            { expiresIn: "30d" }
        );

        const response = NextResponse.json({ success: true, message: "Account created successfully" });
        response.cookies.set("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 30 * 24 * 60 * 60,
            path: "/",
        });
        return response;
    } catch (err) {
        console.error("Register error:", err);
        return NextResponse.json({ error: "Registration failed" }, { status: 500 });
    }
}
