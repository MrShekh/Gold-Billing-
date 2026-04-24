"use client";
import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import BillPrint from "@/components/BillPrint";
import { getBillById, type Bill } from "@/lib/db";
import { ArrowLeft, FileText, Pencil, Download } from "lucide-react";


import { Suspense } from "react";

function BillDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const router = useRouter();
  const [bill, setBill] = useState<Bill | null>(null);
  const billRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const element = billRef.current;
    if (!element) return;
    
    import("html2pdf.js").then((html2pdf) => {
      const opt = {
        margin: 0.5,
        filename: `bill-${bill?.voucherNo}.pdf`,
        image: { type: "jpeg" as "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in" as "in", format: "a4" as "a4", orientation: "portrait" as "portrait" },
      };
      html2pdf.default().set(opt).from(element).save();
    });
  };

  useEffect(() => {
    if (id) {
      async function fetchBill() {
        try {
          const found = await getBillById(id as string);
          setBill(found || null);
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
              <div style={{ minWidth: 760 }} ref={billRef}>
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
