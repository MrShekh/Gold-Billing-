import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Helper to format date "YYYY-MM-DD" -> "DD MMM YYYY"
function formatDate(d: string) {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "Missing authorization token" }, { status: 401 });
    }

    const body = await req.json();
    const { billId, customerId, phone, customerName, billNumber, pdfBuffer } = body;
    
    if (!billId || !phone || !pdfBuffer) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabaseAuth = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure phone is correctly formatted (strip non-digits)
    const cleanPhone = phone.replace(/\D/g, "");

    // Call AM Jwellers WhatsApp Service
    // In production, this URL should be an environment variable
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
    
    // Log it
    const logEntry = {
      user_id: user.id,
      bill_id: billId,
      customer_id: customerId || null,
      phone: cleanPhone,
      message_id: waData.messageId || null,
      status: waRes.ok ? "sent" : "failed",
      error_msg: waRes.ok ? null : (waData.error || "Unknown error")
    };
    
    await supabaseAuth.from("whatsapp_logs").insert([logEntry]);

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
