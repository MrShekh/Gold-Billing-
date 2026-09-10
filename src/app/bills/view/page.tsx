"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import BillPrint from "@/components/BillPrint";
import {
  getBillById,
  getCustomerById,
  getCustomerBalance,
  type Bill,
  type CustomerBalance,
} from "@/lib/db";
import {
  ArrowLeft,
  Pencil,
  Smartphone,
  Printer,
  Share2,
  Image as ImageIcon,
  Check,
  ChevronDown,
  Download,
  FileText,
} from "lucide-react";
import Link from "next/link";
import html2canvas from "html2canvas";

function BillDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const router = useRouter();
  const [bill, setBill] = useState<Bill | null>(null);
  const [customerPhone, setCustomerPhone] = useState<string | undefined>(
    undefined
  );
  const [custBalance, setCustBalance] = useState<CustomerBalance | null>(null);

  // Default is ALWAYS desktop width
  const [viewMode, setViewMode] = useState<"desktop" | "phone">("desktop");

  const [downloadOpen, setDownloadOpen] = useState(false);
  const [downloadingImage, setDownloadingImage] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const billContainerRef = useRef<HTMLDivElement>(null);
  const hiddenPhoneContainerRef = useRef<HTMLDivElement>(null);

  // Download Phone Image (WhatsApp)
  const handleDownloadPhoneImage = async () => {
    setDownloadOpen(false);
    if (!bill) return;

    // Use the hidden phone-sized container so it's always formatted for phone
    const targetElement = (hiddenPhoneContainerRef.current?.querySelector(
      ".print-area"
    ) ||
      billContainerRef.current?.querySelector(".print-area")) as HTMLElement | null;

    if (!targetElement) return;

    try {
      setDownloadingImage(true);
      const canvas = await html2canvas(targetElement, {
        scale: 3, // 3x ultra-crisp resolution
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `Bill-${bill.voucherNo}-Phone.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to generate bill image", err);
      alert("Could not generate image. Please try saving as PDF.");
    } finally {
      setDownloadingImage(false);
    }
  };

  // Phone Size PDF / Print
  const handleDownloadPhonePdf = () => {
    setDownloadOpen(false);
    if (!bill) return;

    const targetElement = (hiddenPhoneContainerRef.current?.querySelector(
      ".print-area"
    ) ||
      billContainerRef.current?.querySelector(".print-area")) as HTMLElement | null;

    if (!targetElement) return;

    const printWindow = window.open("", "_blank", "width=700,height=850");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill — ${bill.voucherNo}</title>
          <style>
            @page { size: auto; margin: 4mm; }
            body { margin: 0; padding: 10px; font-family: 'Consolas', 'Courier New', monospace; background: #fff; color: #000; display: flex; justify-content: center; }
            .print-btn-bar { margin-bottom: 12px; padding: 8px 12px; background: #f0f0f0; border: 1px solid #ccc; border-radius: 6px; display: flex; align-items: center; justify-content: space-between; width: 100%; max-width: 640px; }
            .print-btn-bar button { padding: 6px 14px; font-size: 13px; font-weight: bold; background: #166534; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
            @media print { .print-btn-bar { display: none !important; } body { padding: 0; } }
          </style>
        </head>
        <body>
          <div style="width: 100%; max-width: 640px;">
            <div class="print-btn-bar">
              <button onclick="window.print()">📱 Save Phone PDF / Print</button>
              <span style="font-size:11px; color:#555;">Choose <b>Save as PDF</b> in print dialog</span>
            </div>
            ${targetElement.outerHTML}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // Desktop A4 PDF / Print
  const handleDownloadDesktop = () => {
    setDownloadOpen(false);
    if (!bill) return;
    const printArea = billContainerRef.current?.querySelector(
      ".print-area"
    ) as HTMLElement | null;
    if (!printArea) return;

    const printWindow = window.open("", "_blank", "width=1100,height=800");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill — ${bill.voucherNo}</title>
          <style>
            body { margin: 0; padding: 20px; font-family: 'Consolas', 'Courier New', monospace; background: #fff; color: #000; }
            .print-btn-bar { margin-bottom: 16px; padding: 8px 12px; background: #f0f0f0; border: 1px solid #ccc; border-radius: 6px; display: flex; align-items: center; }
            .print-btn-bar button { padding: 6px 16px; font-size: 13px; font-weight: bold; background: #b8860b; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
            @media print { .print-btn-bar { display: none !important; } }
          </style>
        </head>
        <body>
          <div class="print-btn-bar">
            <button onclick="window.print()">🖨️ Save as Desktop PDF / Print</button>
            <span style="margin-left:12px; font-size:12px; color:#666;">Choose <b>Save as PDF</b></span>
          </div>
          ${printArea.outerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 600);
  };

  // WhatsApp share
  const handleWhatsAppShare = () => {
    setDownloadOpen(false);
    if (!bill) return;
    const closingGold = bill.closingFineGold
      ? `${parseFloat(bill.closingFineGold).toFixed(3)} g`
      : "0.000 g";
    const statusText =
      parseFloat(bill.closingFineGold ?? "0") <= 0.0001
        ? "Account Cleared (0.000 g)"
        : `Balance Due: ${closingGold}`;
    const text = encodeURIComponent(
      `*${bill.customerName.toUpperCase()} — Gold Bill Voucher*\n` +
        `Voucher No: ${bill.voucherNo}\n` +
        `Date: ${bill.date}\n` +
        `Fine Gold Balance: ${statusText}\n\n` +
        `Please find your bill voucher attached.`
    );
    const cleanPhone = (customerPhone || "").replace(/\D/g, "");
    const waUrl =
      cleanPhone.length >= 10
        ? `https://api.whatsapp.com/send?phone=91${cleanPhone.slice(-10)}&text=${text}`
        : `https://api.whatsapp.com/send?text=${text}`;
    window.open(waUrl, "_blank");
  };

  useEffect(() => {
    if (id) {
      async function fetchBill() {
        try {
          const found = await getBillById(id as string);
          setBill(found || null);
          if (found && found.customerId) {
            const [customer, bal] = await Promise.all([
              getCustomerById(found.customerId),
              getCustomerBalance(found.customerId),
            ]);
            if (customer) setCustomerPhone(customer.phone);
            setCustBalance(bal ?? null);
          }
        } catch (e) {
          console.error(e);
        }
      }
      fetchBill();
    }
  }, [id]);

  if (!bill) {
    return (
      <div style={{ display: "flex" }}>
        <Sidebar />
        <div
          className="main-layout"
          style={{ flex: 1, padding: 40, textAlign: "center" }}
        >
          Bill not found.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex" }} onClick={() => setDownloadOpen(false)}>
      <Sidebar />
      <div className="main-layout" style={{ flex: 1 }}>
        {/* Page Header with Actions on the Side */}
        <div className="page-header">
          <div
            className="flex-between"
            style={{ paddingBottom: 16, alignItems: "flex-start", gap: 16 }}
          >
            {/* Left Info */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h2 style={{ margin: 0 }}>Bill — {bill.voucherNo}</h2>
                {custBalance &&
                  (custBalance.fine_gold_balance <= 0.0001 ? (
                    <span
                      className="badge badge-success"
                      style={{ fontWeight: 700, fontSize: 11 }}
                    >
                      ✓ Account Cleared (0.000 g today)
                    </span>
                  ) : (
                    <span
                      className="badge badge-gold"
                      style={{ fontWeight: 700, fontSize: 11 }}
                    >
                      Current Due: {custBalance.fine_gold_balance.toFixed(3)} g
                    </span>
                  ))}
              </div>
              <p
                style={{
                  marginTop: 4,
                  fontSize: 13,
                  color: "var(--text-secondary)",
                }}
              >
                Customer:{" "}
                <strong style={{ color: "var(--text-primary)" }}>
                  {bill.customerName}
                </strong>
                &nbsp;·&nbsp; Date:{" "}
                {bill.date.split("-").reverse().join("/")}
                {bill.time ? ` ${bill.time}` : ""}
              </p>
            </div>

            {/* Right Side Options & Actions */}
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Desktop / Phone Size Toggle Pill */}
              <div
                style={{
                  display: "inline-flex",
                  background: "#181824",
                  borderRadius: 8,
                  padding: 3,
                  border: "1px solid var(--border-light)",
                  marginRight: 4,
                }}
              >
                <button
                  type="button"
                  onClick={() => setViewMode("desktop")}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "none",
                    background:
                      viewMode === "desktop"
                        ? "var(--accent)"
                        : "transparent",
                    color: viewMode === "desktop" ? "#000" : "var(--text-secondary)",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    transition: "all 0.15s ease",
                  }}
                  title="Full desktop view"
                >
                  <Printer size={13} /> Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("phone")}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "none",
                    background:
                      viewMode === "phone"
                        ? "var(--accent)"
                        : "transparent",
                    color: viewMode === "phone" ? "#000" : "var(--text-secondary)",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    transition: "all 0.15s ease",
                  }}
                  title="Phone screen width"
                >
                  <Smartphone size={13} /> Phone
                </button>
              </div>

              <Link
                href={`/customers/${bill.customerId}`}
                className="btn btn-secondary"
                style={{ fontSize: 13 }}
              >
                View Ledger
              </Link>
              <button
                className="btn btn-secondary"
                onClick={() => router.push(`/bills/edit?id=${bill.id}`)}
                style={{ fontSize: 13 }}
              >
                <Pencil size={14} /> Edit
              </button>

              {/* DOWNLOAD DROPDOWN BUTTON */}
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setDownloadOpen((o) => !o)}
                  style={{
                    fontWeight: 800,
                    fontSize: 13,
                    gap: 6,
                    background: "#16a34a",
                    borderColor: "#16a34a",
                  }}
                >
                  {downloadSuccess ? (
                    <Check size={15} />
                  ) : (
                    <Download size={15} />
                  )}
                  {downloadingImage
                    ? "Saving…"
                    : downloadSuccess
                    ? "Saved!"
                    : "Download ▾"}
                </button>

                {/* Dropdown Menu */}
                {downloadOpen && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "calc(100% + 6px)",
                      background: "#1e1e2d",
                      border: "1px solid var(--border-light)",
                      borderRadius: 8,
                      boxShadow: "0 12px 30px rgba(0,0,0,0.6)",
                      zIndex: 100,
                      minWidth: 260,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding: "8px 12px",
                        fontSize: 10.5,
                        fontWeight: 800,
                        color: "#888",
                        letterSpacing: 0.5,
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      CHOOSE EXPORT FORMAT
                    </div>

                    {/* 1. Phone Size Image (WhatsApp) */}
                    <button
                      type="button"
                      onClick={handleDownloadPhoneImage}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        background: "transparent",
                        border: "none",
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        color: "#fff",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "rgba(22,163,74,0.15)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <ImageIcon
                        size={16}
                        style={{ color: "#22c55e", marginTop: 2, flexShrink: 0 }}
                      />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 13 }}>
                          📱 Phone Image (WhatsApp)
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--text-secondary)",
                            marginTop: 1,
                          }}
                        >
                          Fits mobile screens without zooming
                        </div>
                      </div>
                    </button>

                    {/* 2. Phone Size PDF */}
                    <button
                      type="button"
                      onClick={handleDownloadPhonePdf}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        background: "transparent",
                        border: "none",
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        color: "#fff",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "rgba(59,130,246,0.15)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <Smartphone
                        size={16}
                        style={{ color: "#60a5fa", marginTop: 2, flexShrink: 0 }}
                      />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 13 }}>
                          📱 Phone Size PDF
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--text-secondary)",
                            marginTop: 1,
                          }}
                        >
                          Compact single-page PDF
                        </div>
                      </div>
                    </button>

                    {/* 3. Desktop A4 PDF / Print */}
                    <button
                      type="button"
                      onClick={handleDownloadDesktop}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        background: "transparent",
                        border: "none",
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        color: "#fff",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "rgba(212,168,67,0.15)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <Printer
                        size={16}
                        style={{ color: "var(--accent)", marginTop: 2, flexShrink: 0 }}
                      />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 13 }}>
                          🖨️ Desktop A4 PDF / Print
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--text-secondary)",
                            marginTop: 1,
                          }}
                        >
                          Standard full A4 office print
                        </div>
                      </div>
                    </button>

                    {/* 4. WhatsApp Share */}
                    <button
                      type="button"
                      onClick={handleWhatsAppShare}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        background: "transparent",
                        border: "none",
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        color: "#fff",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "rgba(34,197,94,0.15)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <Share2
                        size={16}
                        style={{ color: "#22c55e", marginTop: 2, flexShrink: 0 }}
                      />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 13 }}>
                          💬 Send on WhatsApp
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--text-secondary)",
                            marginTop: 1,
                          }}
                        >
                          Open chat with customer summary
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              <button
                className="btn btn-secondary"
                onClick={() => router.push("/bills")}
                style={{ fontSize: 13 }}
              >
                <ArrowLeft size={14} /> Back
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="page-content">
          <div
            className="form-card"
            style={{
              background: "#161622",
              border: "1px solid var(--border-light)",
              display: "flex",
              justifyContent: "center",
              padding: viewMode === "desktop" ? "24px 16px" : "24px 8px",
            }}
          >
            <div
              ref={billContainerRef}
              style={{
                width: "100%",
                maxWidth: viewMode === "desktop" ? "100%" : 640,
                boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
                background: "#ffffff",
                borderRadius: 4,
                transition: "max-width 0.2s ease",
              }}
            >
              <BillPrint
                bill={bill}
                companyName={bill.customerName.toUpperCase()}
                isPhoneSize={viewMode === "phone"}
              />
            </div>
          </div>

          {/* Off-screen Phone-sized voucher (used to capture crisp phone images even in desktop view) */}
          <div
            ref={hiddenPhoneContainerRef}
            style={{
              position: "fixed",
              left: -9999,
              top: 0,
              width: 640,
              background: "#ffffff",
              pointerEvents: "none",
            }}
          >
            <BillPrint
              bill={bill}
              companyName={bill.customerName.toUpperCase()}
              isPhoneSize={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BillDetailPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            height: "100vh",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Loading...
        </div>
      }
    >
      <BillDetailContent />
    </Suspense>
  );
}
