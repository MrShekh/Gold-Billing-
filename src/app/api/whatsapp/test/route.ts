import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ success: true, message: "WhatsApp test route is disabled. Use the QR code scanner on the settings page to connect WhatsApp." });
}
