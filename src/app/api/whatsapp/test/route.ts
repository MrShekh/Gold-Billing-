import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization") || req.headers.get("cookie");
    // Since we are in app router, let's just get the access token from the request
    // actually, if the user is calling this from client, the cookie is sent automatically.
    // Let's instantiate a supabase client with the auth token.
    
    // Instead of full auth parsing, let's use the service role client and verify the JWT if sent in header, 
    // or just rely on the standard client if we can. 
    // For simplicity, we can pass the user ID from the client, but that's insecure.
    // The proper way in Next.js App Router API is:
    
    // Actually, creating a client with the anon key and relying on cookies requires @supabase/ssr.
    // Let's assume the client sends the token in the Authorization header: `Bearer ${session.access_token}`
    
    // For this implementation, let's use a simpler approach:
    // Client POSTs to this endpoint.
    
    const body = await req.json();
    const { phone } = body;
    
    if (!phone) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 });
    }

    // We'll create a Supabase client with the service role key to bypass RLS for fetching settings
    // But we need to know WHICH user to fetch settings for.
    // Let's fetch the token from the Authorization header.
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabaseAuth = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: settings, error: settingsError } = await supabaseAuth
      .from("whatsapp_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (settingsError || !settings) {
      return NextResponse.json({ error: "WhatsApp settings not found" }, { status: 404 });
    }

    if (!settings.phone_number_id || !settings.access_token) {
      return NextResponse.json({ error: "WhatsApp credentials missing" }, { status: 400 });
    }

    // Call Meta API
    const metaRes = await fetch(`https://graph.facebook.com/v18.0/${settings.phone_number_id}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${settings.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: {
          body: "Hello! This is a test message from your Gold Billing System integration."
        }
      })
    });

    const metaData = await metaRes.json();
    
    if (!metaRes.ok) {
      console.error("Meta API Error:", metaData);
      return NextResponse.json({ error: metaData.error?.message || "Failed to send message" }, { status: metaRes.status });
    }

    return NextResponse.json({ success: true, message_id: metaData.messages?.[0]?.id });

  } catch (error) {
    console.error("Test WhatsApp error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
