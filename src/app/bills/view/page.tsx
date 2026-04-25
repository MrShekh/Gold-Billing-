"use client";
import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import BillPrint from "@/components/BillPrint";
import { getBillById, getCustomerById, type Bill } from "@/lib/db";
import { ArrowLeft, FileText, Pencil, Download } from "lucide-react";
import WhatsAppBillButton from "@/components/WhatsAppBillButton";


import { Suspense } from "react";

function BillDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const router = useRouter();
  const [bill, setBill] = useState<Bill | null>(null);
  const [customerPhone, setCustomerPhone] = useState<string | undefined>(undefined);
  const billRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    if (!bill) return;
    const printArea = billRef.current?.querySelector(".print-area") as HTMLElement | null;
    if (!printArea) return;

    // Open a new window with ONLY the bill content (no sidebar, no dark page)
    const printWindow = window.open("", "_blank", "width=1100,height=800");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill-${bill.voucherNo}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 0; background: #fff; font-family: 'Courier New', monospace; }
            @page { size: A4 landscape; margin: 0.5cm; }
            .print-btn-bar { text-align: center; padding: 10px; background: #f5f5f5; border-bottom: 1px solid #ddd; }
            .print-btn-bar button { padding: 8px 24px; font-size: 14px; cursor: pointer; background: #2c6b2f; color: #fff; border: none; border-radius: 4px; }
            @media print { .print-btn-bar { display: none !important; } }
          </style>
        </head>
        <body>
          <div class="print-btn-bar">
            <button onclick="window.print()">🖨️ Save as PDF / Print</button>
            <span style="margin-left:12px; font-size:12px; color:#666;">Click the button above → in the print dialog choose <b>Save as PDF</b></span>
          </div>
          ${printArea.outerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    // Slight delay to allow rendering before print dialog
    setTimeout(() => {
      printWindow.print();
    }, 600);
  };

  useEffect(() => {
    if (id) {
      async function fetchBill() {
        try {
          const found = await getBillById(id as string);
          setBill(found || null);
          if (found && found.customerId) {
            const customer = await getCustomerById(found.customerId);
            if (customer) setCustomerPhone(customer.phone);
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
        <div className="main-layout" style={{ flex: 1 }}>
          <div className="page-content" style={{ paddingTop: 60 }}>
            <div className="empty-state">
              <FileText />
              <h3>Bill not found</h3>
              <p>This bill may have been deleted.</p>
              <div style={{ marginTop: 16 }}>
                <button className="btn btn-secondary" onClick={() => router.push("/bills")}>
                  <ArrowLeft size={14} /> Back to Bills
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div className="main-layout" style={{ flex: 1 }}>
        <div className="page-header">
          <div className="flex-between" style={{ paddingBottom: 20 }}>
            <div>
              <h2>Bill — {bill.voucherNo}</h2>
              <p style={{ marginTop: 4 }}>
                Customer: <strong style={{ color: "var(--text-primary)" }}>{bill.customerName}</strong>
                &nbsp;·&nbsp; Date: {bill.date.split("-").reverse().join("/")}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                className="btn btn-primary"
                onClick={() => router.push(`/bills/edit?id=${bill.id}`)}
              >
                <Pencil size={14} /> Edit Bill
              </button>
              <WhatsAppBillButton
                billId={bill.id}
                customerId={bill.customerId}
                customerPhone={customerPhone}
                customerName={bill.customerName}
                voucherNo={bill.voucherNo}
              />
              <button
                className="btn btn-secondary"
                onClick={handleDownload}
              >
                <Download size={14} /> Download
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => router.push("/bills")}
              >
                <ArrowLeft size={14} /> Back
              </button>
            </div>
          </div>
        </div>

        <div className="page-content">
          <div
            className="form-card"
            style={{ background: "#1a1a24", border: "1px solid var(--border-light)" }}
          >
            <div className="table-responsive">
              <div style={{ minWidth: 950 }} ref={billRef}>
                <BillPrint bill={bill} companyName={bill.customerName.toUpperCase()} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BillDetailPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>Loading...</div>}>
      <BillDetailContent />
    </Suspense>
  );
}
