import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import InviteCode from "@/models/InviteCode";

const JWT_SECRET = process.env.JWT_SECRET || "goldbill_secret_change_in_production";

async function getAuthUser(req: NextRequest) {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return null;
    try {
        return jwt.verify(token, JWT_SECRET) as { id: string; email: string; username: string };
    } catch {
        return null;
    }
}

// ── GET: list all invite codes ───────────────────────────────────────────────
export async function GET(req: NextRequest) {
    const authUser = await getAuthUser(req);
    if (!authUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const codes = await InviteCode.find({})
        .sort({ createdAt: -1 })
        .populate("createdBy", "username email")
        .populate("usedBy", "username email")
        .lean();

    return NextResponse.json({ codes });
}

// ── POST: generate a new invite code ────────────────────────────────────────
export async function POST(req: NextRequest) {
    const authUser = await getAuthUser(req);
    if (!authUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { maxUses = 1, expiryDays = 7, note = "" } = await req.json().catch(() => ({}));

    // Generate a readable code: XXXX-XXXX-XXXX
    const raw = crypto.randomBytes(6).toString("hex").toUpperCase();
    const code = `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Number(expiryDays));

    const dbUser = await User.findById(authUser.id);
    if (!dbUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const invite = await InviteCode.create({
        code,
        createdBy: dbUser._id,
        expiresAt,
        maxUses: Number(maxUses),
        note,
    });

    return NextResponse.json({ success: true, invite });
}

// ── DELETE: revoke / delete an invite code ────────────────────────────────────
export async function DELETE(req: NextRequest) {
    const authUser = await getAuthUser(req);
    if (!authUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await req.json();
    if (!id) {
        return NextResponse.json({ error: "Invite code ID required" }, { status: 400 });
    }

    await InviteCode.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
}
