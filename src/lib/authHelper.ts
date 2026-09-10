import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "goldbill_secret_change_in_production";

/**
 * Reads the auth_token JWT cookie from a request and returns the user's _id string.
 * Returns null if the token is missing or invalid.
 */
export function getAuthUserId(req: NextRequest): string | null {
    try {
        const token = req.cookies.get("auth_token")?.value;
        if (!token) return null;
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
        return decoded.id ?? null;
    } catch {
        return null;
    }
}
