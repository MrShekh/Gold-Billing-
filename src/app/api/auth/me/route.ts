import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "goldbill_secret_change_in_production";

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get("auth_token")?.value;
        if (!token) {
            return NextResponse.json({ user: null, hasAccount: await checkHasAccount() });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; username: string };
        return NextResponse.json({
            user: { id: decoded.id, email: decoded.email, username: decoded.username },
            hasAccount: true,
        });
    } catch {
        return NextResponse.json({ user: null, hasAccount: await checkHasAccount() });
    }
}

async function checkHasAccount(): Promise<boolean> {
    try {
        await connectDB();
        const count = await User.countDocuments();
        return count > 0;
    } catch {
        return false;
    }
}
