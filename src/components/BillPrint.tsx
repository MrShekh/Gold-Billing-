"use client";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import type { Bill } from "@/lib/db";
import { Printer } from "lucide-react";

interface Props {
  bill: Bill;
  companyName?: string;
}

function fmtDate(d: string) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

const S: Record<string, React.CSSProperties> = {
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 11,
    fontFamily: "'Courier New', Courier, monospace",
  },
  th: {
    border: "1px solid #000",
    padding: "3px 5px",
    textAlign: "center",
    fontWeight: "bold",
    background: "#fff",
    fontSize: 10.5,
    verticalAlign: "middle",
    lineHeight: 1.2,
  },
  td: {
    border: "1px solid #000",
    padding: "2px 5px",
    textAlign: "center",
    verticalAlign: "middle",
    fontSize: 11,
    lineHeight: 1.3,
  },
  tdLeft: {
    border: "1px solid #000",
    padding: "2px 5px",
    textAlign: "left",
    verticalAlign: "middle",
    fontSize: 11,
    lineHeight: 1.3,
  },
  totalRow: {
    fontWeight: "bold",
    background: "#f5f5f5",
    fontSize: 14,
  },
  grandTotal: {
    fontWeight: "bold",
    background: "#e8e8e8",
    fontSize: 15,
  },
};

export default function BillPrint({ bill, companyName = "BHATIJA" }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Bill-${bill.voucherNo}`,
  });

  const issueItems = bill.items.filter((i) => i.type === "ISSUE");
  const receiveItems = bill.items.filter((i) => i.type === "RECEIVE");

  return (
    <div>
      {/* Print Button */}
      <div className="no-print" style={{ marginBottom: 14 }}>
        <button className="btn btn-primary" onClick={() => handlePrint()}>
          <Printer size={15} /> Print Bill
        </button>
      </div>

      {/* ===== PRINTABLE BILL ===== */}
      <div
        ref={printRef}
        className="print-area"
        style={{
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: 11,
          color: "#000",
          background: "#fff",
          padding: "16px 20px",
          maxWidth: 780,
          margin: "0 auto",
        }}
      >
        {/* ---- HEADER ---- */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
          <tbody>
            <tr>
              <td
                style={{
                  fontWeight: "bold",
                  fontSize: 15,
                  letterSpacing: 1,
                  padding: 0,
                  border: "none",
                }}
              >
                {companyName}
              </td>
              <td style={{ textAlign: "right", border: "none", fontSize: 11, lineHeight: 1.7 }}>
                <span>V.No.&nbsp;&nbsp;:&nbsp;&nbsp;{bill.voucherNo}</span>
                <br />
                <span>Date&nbsp;&nbsp;&nbsp;:&nbsp;&nbsp;{fmtDate(bill.date)}</span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ---- MAIN TABLE ---- */}
        <table style={S.table}>
          <thead>
            <tr>
              <th style={{ ...S.th, width: 28 }}>S.No</th>
              <th style={{ ...S.th, width: 52 }}>Amount</th>
              <th style={{ ...S.th, textAlign: "left" }}>Item Name</th>
              <th style={{ ...S.th, width: 28 }}>Pcs</th>
              <th style={{ ...S.th, width: 55 }}>Gross<br />Weight</th>
              <th style={{ ...S.th, width: 42 }}>AD<br />Weight</th>
              <th style={{ ...S.th, width: 42 }}>Less<br />Weight</th>
              <th style={{ ...S.th, width: 80, textAlign: "left" }}>Description</th>
              <th style={{ ...S.th, width: 55 }}>Net<br />Weight</th>
              <th style={{ ...S.th, width: 48 }}>Tunch<br />%</th>
              <th style={{ ...S.th, width: 38 }}>Rate</th>
              <th style={{ ...S.th, width: 55 }}>Fine<br />Gold</th>
            </tr>
          </thead>
          <tbody>
            {/* ===== ISSUE SECTION ===== */}
            <tr>
              <td style={{ ...S.td, border: "1px solid #000" }}></td>
              <td style={{ ...S.td }}></td>
              <td style={{ ...S.tdLeft }}>
                <span style={{ fontWeight: "bold", textDecoration: "underline" }}>ISSUE</span>
              </td>
              <td style={{ ...S.td }}></td>
              <td style={{ ...S.td }}></td>
              <td style={{ ...S.td }}></td>
              <td style={{ ...S.td }}></td>
              <td style={{ ...S.td }}></td>
              <td style={{ ...S.td }}></td>
              <td style={{ ...S.td }}></td>
              <td style={{ ...S.td }}></td>
            </tr>

            {issueItems.map((item, idx) => (
              <tr key={item.id}>
                <td style={S.td}>{idx + 1}</td>
                <td style={S.td}>{item.amount || ""}</td>
                <td style={S.tdLeft}>
                  <div style={{ fontWeight: "bold" }}>{item.itemName}</div>
                </td>
                <td style={S.td}>{item.pcs || ""}</td>
                <td style={S.td}>{item.grossWeight || ""}</td>
                <td style={S.td}>{item.adWeight || ""}</td>
                <td style={S.td}>{item.lessWeight || ""}</td>
                <td style={S.tdLeft}>{item.description || ""}</td>
                <td style={S.td}>{item.netWeight || ""}</td>
                <td style={S.td}>{item.tunch || ""}</td>
                <td style={S.td}>{item.rate || ""}</td>
                <td style={S.td}>{item.fineGold || ""}</td>
              </tr>
            ))}

            <tr style={S.totalRow}>
              <td style={{ ...S.td, ...S.totalRow }}></td>
              <td style={{ ...S.td, ...S.totalRow }}></td>
              <td colSpan={2} style={{ ...S.td, ...S.totalRow, textAlign: "right", paddingRight: 8 }}>Issue - Total :</td>
              <td style={{ ...S.td, ...S.totalRow }}>{bill.issueTotalGross || ""}</td>
              <td style={{ ...S.td, ...S.totalRow }}>{issueItems.reduce((acc, item) => acc + (parseFloat(item.adWeight || "0") || 0), 0) > 0 ? issueItems.reduce((acc, item) => acc + (parseFloat(item.adWeight || "0") || 0), 0).toFixed(3) : ""}</td>
              <td style={{ ...S.td, ...S.totalRow }}>{bill.issueTotalLess || ""}</td>
              <td style={{ ...S.td, ...S.totalRow }}></td>
              <td style={{ ...S.td, ...S.totalRow }}>{bill.issueTotalNet || ""}</td>
              <td style={{ ...S.td, ...S.totalRow }}></td>
              <td style={{ ...S.td, ...S.totalRow }}></td>
              <td style={{ ...S.td, ...S.totalRow }}>{bill.issueTotalFine || ""}</td>
            </tr>

            {/* ===== RECEIVE SECTION ===== */}
            <tr>
              <td style={S.td}></td>
              <td style={S.td}></td>
              <td style={S.tdLeft}>
                <span style={{ fontWeight: "bold", textDecoration: "underline" }}>RECEIVE</span>
              </td>
              <td style={S.td}></td>
              <td style={S.td}></td>
              <td style={S.td}></td>
              <td style={S.td}></td>
              <td style={S.td}></td>
              <td style={S.td}></td>
              <td style={S.td}></td>
              <td style={S.td}></td>
            </tr>

            {receiveItems.map((item, idx) => (
              <tr key={item.id}>
                <td style={S.td}>{idx + 1}</td>
                <td style={S.td}>{item.amount || ""}</td>
                <td style={S.tdLeft}>
                  <div style={{ fontWeight: "bold" }}>{item.itemName}</div>
                </td>
                <td style={S.td}>{item.pcs || ""}</td>
                <td style={S.td}>{item.grossWeight || ""}</td>
                <td style={S.td}>{item.adWeight || ""}</td>
                <td style={S.td}>{item.lessWeight || ""}</td>
                <td style={S.tdLeft}>{item.description || ""}</td>
                <td style={S.td}>{item.netWeight || ""}</td>
                <td style={S.td}>{item.tunch || ""}</td>
                <td style={S.td}>{item.rate || ""}</td>
                <td style={S.td}>{item.fineGold || ""}</td>
              </tr>
            ))}

            <tr style={S.totalRow}>
              <td style={{ ...S.td, ...S.totalRow }}></td>
              <td style={{ ...S.td, ...S.totalRow }}></td>
              <td colSpan={2} style={{ ...S.td, ...S.totalRow, textAlign: "right", paddingRight: 8 }}>Receive - Total :</td>
              <td style={{ ...S.td, ...S.totalRow }}>{bill.recvTotalGross || ""}</td>
              <td style={{ ...S.td, ...S.totalRow }}>{receiveItems.reduce((acc, item) => acc + (parseFloat(item.adWeight || "0") || 0), 0) > 0 ? receiveItems.reduce((acc, item) => acc + (parseFloat(item.adWeight || "0") || 0), 0).toFixed(3) : ""}</td>
              <td style={{ ...S.td, ...S.totalRow }}>{bill.recvTotalLess || ""}</td>
              <td style={{ ...S.td, ...S.totalRow }}></td>
              <td style={{ ...S.td, ...S.totalRow }}>{bill.recvTotalNet || ""}</td>
              <td style={{ ...S.td, ...S.totalRow }}></td>
              <td style={{ ...S.td, ...S.totalRow }}></td>
              <td style={{ ...S.td, ...S.totalRow }}>{bill.recvTotalFine || ""}</td>
            </tr>

            <tr style={S.grandTotal}>
              <td style={{ ...S.td, ...S.grandTotal }}></td>
              <td style={{ ...S.td, ...S.grandTotal }}></td>
              <td colSpan={2} style={{ ...S.td, ...S.grandTotal, textAlign: "right", paddingRight: 8 }}>Bill Total :</td>
              <td style={{ ...S.td, ...S.grandTotal }}>{bill.billTotalGross || ""}</td>
              <td style={{ ...S.td, ...S.grandTotal }}>{(() => {
                const iA = issueItems.reduce((acc, item) => acc + (parseFloat(item.adWeight || "0") || 0), 0);
                const rA = receiveItems.reduce((acc, item) => acc + (parseFloat(item.adWeight || "0") || 0), 0);
                const diff = iA - rA;
                return diff !== 0 ? diff.toFixed(3) : "";
              })()}</td>
              <td style={{ ...S.td, ...S.grandTotal }}>{bill.billTotalLess || ""}</td>
              <td style={{ ...S.td, ...S.grandTotal }}></td>
              <td style={{ ...S.td, ...S.grandTotal }}>{bill.billTotalNet || ""}</td>
              <td style={{ ...S.td, ...S.grandTotal }}></td>
              <td style={{ ...S.td, ...S.grandTotal }}></td>
              <td style={{ ...S.td, ...S.grandTotal }}>{bill.billTotalFine || ""}</td>
            </tr>
          </tbody>
        </table>

        {/* ---- FOOTER ---- */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: 0,
            fontSize: 11,
          }}
        >
          <tbody>
            <tr>
              {/* Jama Balance — Cash & Gold */}
              <td style={{ border: "1px solid #000", verticalAlign: "top", padding: 0, width: "50%" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td colSpan={2} style={{ padding: "2px 10px", background: "#f0fdf4", borderBottom: "1px solid #ddd", fontSize: 9.5, fontWeight: "bold", color: "#166534", letterSpacing: 0.4 }}>
                        CASH JAMA (₹)
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "2px 10px", borderBottom: "1px solid #ccc", fontSize: 10.5, width: "50%" }}>Previous Jama</td>
                      <td style={{ padding: "2px 10px", borderBottom: "1px solid #ccc", textAlign: "right", fontSize: 10.5, color: parseFloat(bill.previousBalance ?? "0") > 0 ? "#15803d" : "#555" }}>
                        {bill.previousBalance ? parseFloat(bill.previousBalance).toFixed(2) : "0.00"}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "2px 10px", borderBottom: "1px solid #ccc", fontSize: 10.5 }}>This Bill Net Cash</td>
                      {(() => {
                        const netAmt = (bill.items || []).reduce((sum, item) => sum + (item.type === "ISSUE" ? 1 : -1) * (parseFloat(item.amount ?? "0") || 0), 0);
                        return (
                          <td style={{ padding: "2px 10px", borderBottom: "1px solid #ccc", textAlign: "right", fontSize: 10.5, color: netAmt >= 0 ? "#166534" : "#b91c1c" }}>
                            {netAmt >= 0 ? "+" : ""}{netAmt.toFixed(2)}
                          </td>
                        );
                      })()}
                    </tr>
                    <tr style={{ background: "#dcfce7" }}>
                      <td style={{ padding: "3px 10px", fontWeight: "bold", fontSize: 11, color: "#166534" }}>Closing Jama Cash</td>
                      <td style={{ padding: "3px 10px", textAlign: "right", fontWeight: "bold", fontSize: 11, color: "#166534" }}>
                        {bill.closingBalance ? parseFloat(bill.closingBalance).toFixed(2) : "0.00"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td style={{ border: "1px solid #000", verticalAlign: "top", padding: 0, width: "50%" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td colSpan={2} style={{ padding: "2px 10px", background: "#fef9e7", borderBottom: "1px solid #ddd", fontSize: 9.5, fontWeight: "bold", color: "#92400e", letterSpacing: 0.4 }}>
                        FINE GOLD JAMA (grams)
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "2px 10px", borderBottom: "1px solid #ccc", fontSize: 10.5, width: "50%" }}>Previous Jama</td>
                      <td style={{ padding: "2px 10px", borderBottom: "1px solid #ccc", textAlign: "right", fontSize: 10.5, color: parseFloat(bill.prevFineGold ?? "0") > 0 ? "#b45309" : "#555" }}>
                        {bill.prevFineGold ? parseFloat(bill.prevFineGold).toFixed(3) : "0.000"} g
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "2px 10px", borderBottom: "1px solid #ccc", fontSize: 10.5 }}>This Bill Fine Gold</td>
                      <td style={{ padding: "2px 10px", borderBottom: "1px solid #ccc", textAlign: "right", fontSize: 10.5 }}>
                        {bill.billTotalFine ? parseFloat(bill.billTotalFine).toFixed(3) : "0.000"} g
                      </td>
                    </tr>
                    <tr style={{ background: "#fff3cd" }}>
                      <td style={{ padding: "3px 10px", fontWeight: "bold", fontSize: 13, color: "#856404" }}>Closing Jama Gold</td>
                      <td style={{ padding: "3px 10px", textAlign: "right", fontWeight: "bold", fontSize: 14, color: "#856404" }}>
                        {bill.closingFineGold ? parseFloat(bill.closingFineGold).toFixed(3) : "0.000"} g
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>


      </div>
    </div>
  );
}
