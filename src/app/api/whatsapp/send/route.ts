import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongoose";
import WhatsAppLog from "@/models/WhatsAppLog";

const JWT_SECRET = process.env.JWT_SECRET || "goldbill_secret_change_in_production";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded: { id: string; email: string; username: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; username: string };
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { billId, customerId, phone, customerName, billNumber, pdfBuffer } = body;

    if (!billId || !phone || !pdfBuffer) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectDB();

    // Ensure phone is correctly formatted (strip non-digits)
    const cleanPhone = phone.replace(/\D/g, "");

    // Call AM Jwellers WhatsApp Service
    const WA_SERVICE_URL = process.env.WHATSAPP_SERVICE_URL || "http://localhost:5001";

    const waRes = await fetch(`${WA_SERVICE_URL}/send-bill`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        phone: cleanPhone,
        customerName: customerName || "Customer",
        billNumber: billNumber || billId,
        pdfBuffer: pdfBuffer
      })
    });

    // If response is not JSON, handle text gracefully
    let waData;
    const contentType = waRes.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      waData = await waRes.json();
    } else {
      waData = { error: await waRes.text() };
    }

    // Log it to MongoDB
    await WhatsAppLog.create({
      userId: decoded.id,
      billId: billId,
      customerId: customerId || undefined,
      phone: cleanPhone,
      messageId: waData.messageId || undefined,
      status: waRes.ok ? "sent" : "failed",
      errorMsg: waRes.ok ? undefined : (waData.error || "Unknown error")
    });

    if (!waRes.ok) {
      console.error("WA Service Error:", waData);
      return NextResponse.json({ error: waData.error || "Failed to send PDF message" }, { status: waRes.status });
    }

    return NextResponse.json({ success: true, message_id: waData.messageId });

  } catch (error) {
    console.error("Send WhatsApp error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
