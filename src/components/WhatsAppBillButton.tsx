"use client";
import { useState } from "react";
import { MessageCircle, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface Props {
  billId: string;
  customerId?: string;
  customerPhone?: string;
  customerName?: string;
  voucherNo?: string;
  onSent?: () => void;
}

export default function WhatsAppBillButton({ billId, customerId, customerPhone, customerName, voucherNo, onSent }: Props) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSend = async () => {
    if (!customerPhone) {
      alert("No phone number found for this customer.");
      return;
    }

    if (!confirm(`Send PDF bill to WhatsApp number ${customerPhone}?`)) {
      return;
    }

    setLoading(true);
    setStatus("idle");
    setErrorMsg("");

    try {
      // 1. Capture the bill as PDF
      const printElement = document.querySelector(".print-area") as HTMLElement;
      if (!printElement) throw new Error("Bill layout not found");

      // Temporarily adjust styles for better PDF capture if needed
      const originalTransform = printElement.style.transform;
      printElement.style.transform = "none";
      
      const canvas = await html2canvas(printElement, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false
      });
      
      printElement.style.transform = originalTransform;

      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      
      // A4 landscape dimensions: 297mm x 210mm
      const pdf = new jsPDF("landscape", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      
      // Get base64 string without the data URL prefix
      const pdfBase64 = pdf.output("datauristring").split(",")[1];

      // 2. Send to our API
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          billId,
          customerId,
          phone: customerPhone,
          customerName: customerName || "Customer",
          billNumber: voucherNo || billId,
          pdfBuffer: pdfBase64
        })
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        if (onSent) onSent();
        setTimeout(() => setStatus("idle"), 5000);
      } else {
        setStatus("error");
        setErrorMsg(data.error || "Failed to send");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  if (!customerPhone) {
    return (
      <button 
        className="btn" 
        style={{ background: "#ccc", color: "#666", cursor: "not-allowed", display: "flex", alignItems: "center", gap: 6 }}
        title="Add customer phone number to enable"
      >
        <MessageCircle size={15} /> WhatsApp
      </button>
    );
  }

  if (status === "success") {
    return (
      <button className="btn" style={{ background: "#e8f5e9", color: "#2e7d32", border: "1px solid #a5d6a7", display: "flex", alignItems: "center", gap: 6 }}>
        <CheckCircle size={15} /> Sent PDF
      </button>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button 
        className="btn" 
        onClick={handleSend}
        disabled={loading}
        style={{ 
          background: "#25D366", 
          color: "#fff", 
          border: "none",
          display: "flex", 
          alignItems: "center", 
          gap: 6,
          opacity: loading ? 0.7 : 1
        }}
      >
        <MessageCircle size={15} /> {loading ? "Generating PDF..." : "WhatsApp"}
      </button>
      
      {status === "error" && (
        <span style={{ color: "var(--danger)", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
          <AlertCircle size={12} /> {errorMsg}
        </span>
      )}
    </div>
  );
}
