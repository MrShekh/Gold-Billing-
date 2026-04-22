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
  },
  grandTotal: {
    fontWeight: "bold",
    background: "#e8e8e8",
    fontSize: 11.5,
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
              <th style={{ ...S.th, width: 42 }}>Less<br />Weight</th>
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
                <td style={S.td}>{item.lessWeight || ""}</td>
                <td style={S.td}>{item.netWeight || ""}</td>
                <td style={S.td}>{item.tunch || ""}</td>
                <td style={S.td}>{item.rate || ""}</td>
                <td style={S.td}>{item.fineGold || ""}</td>
              </tr>
            ))}

            <tr style={S.totalRow}>
              <td style={{ ...S.td, ...S.totalRow }}></td>
              <td style={{ ...S.td, ...S.totalRow }}></td>
              <td
                colSpan={2}
                style={{
                  ...S.td,
                  ...S.totalRow,
                  textAlign: "right",
                  paddingRight: 8,
                }}
              >
                Issue - Total :
              </td>
              <td style={{ ...S.td, ...S.totalRow }}>{bill.issueTotalGross || ""}</td>
              <td style={{ ...S.td, ...S.totalRow }}>{bill.issueTotalLess || ""}</td>
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
                <td style={S.td}>{item.lessWeight || ""}</td>
                <td style={S.td}>{item.netWeight || ""}</td>
                <td style={S.td}>{item.tunch || ""}</td>
                <td style={S.td}>{item.rate || ""}</td>
                <td style={S.td}>{item.fineGold || ""}</td>
              </tr>
            ))}

            <tr style={S.totalRow}>
              <td style={{ ...S.td, ...S.totalRow }}></td>
              <td style={{ ...S.td, ...S.totalRow }}></td>
              <td
                colSpan={2}
                style={{
                  ...S.td,
                  ...S.totalRow,
                  textAlign: "right",
                  paddingRight: 8,
                }}
              >
                Receive - Total :
              </td>
              <td style={{ ...S.td, ...S.totalRow }}>{bill.recvTotalGross || ""}</td>
              <td style={{ ...S.td, ...S.totalRow }}>{bill.recvTotalLess || ""}</td>
              <td style={{ ...S.td, ...S.totalRow }}>{bill.recvTotalNet || ""}</td>
              <td style={{ ...S.td, ...S.totalRow }}></td>
              <td style={{ ...S.td, ...S.totalRow }}></td>
              <td style={{ ...S.td, ...S.totalRow }}>{bill.recvTotalFine || ""}</td>
            </tr>

            <tr style={S.grandTotal}>
              <td style={{ ...S.td, ...S.grandTotal }}></td>
              <td style={{ ...S.td, ...S.grandTotal }}></td>
              <td
                colSpan={2}
                style={{
                  ...S.td,
                  ...S.grandTotal,
                  textAlign: "right",
                  paddingRight: 8,
                }}
              >
                Bill Total :
              </td>
              <td style={{ ...S.td, ...S.grandTotal }}>{bill.billTotalGross || ""}</td>
              <td style={{ ...S.td, ...S.grandTotal }}>{bill.billTotalLess || ""}</td>
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
              {/* Left: payment entries */}
              <td
                style={{
                  border: "1px solid #000",
                  verticalAlign: "top",
                  padding: 0,
                  width: "55%",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    {(bill.payments || []).map((p) => (
                      <tr key={p.id}>
                        <td
                          style={{
                            borderRight: "1px solid #000",
                            borderBottom: "1px solid #ccc",
                            padding: "2px 6px",
                            textAlign: "right",
                            width: 75,
                            fontSize: 10.5,
                          }}
                        >
                          {p.amount || ""}
                        </td>
                        <td
                          style={{
                            borderBottom: "1px solid #ccc",
                            padding: "2px 6px",
                            fontSize: 10.5,
                          }}
                        >
                          {p.label}
                          {p.date ? `  ${fmtDate(p.date)}` : ""}
                          {p.voucherNo ? `  ${p.voucherNo}` : ""}
                        </td>
                      </tr>
                    ))}
                    {/* empty filler rows */}
                    {Array.from({
                      length: Math.max(0, 4 - (bill.payments || []).length),
                    }).map((_, i) => (
                      <tr key={`empty-${i}`}>
                        <td
                          style={{
                            borderRight: "1px solid #000",
                            borderBottom: "1px solid #ccc",
                            padding: "2px 6px",
                            height: 18,
                            width: 75,
                          }}
                        ></td>
                        <td
                          style={{
                            borderBottom: "1px solid #ccc",
                            padding: "2px 6px",
                          }}
                        ></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </td>

              {/* Right: balance summary */}
              <td
                style={{
                  border: "1px solid #000",
                  verticalAlign: "top",
                  padding: 0,
                  width: "45%",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    {bill.paidCash !== undefined && (
                      <tr>
                        <td
                          style={{
                            padding: "2px 8px",
                            borderBottom: "1px solid #ccc",
                            fontSize: 10.5,
                          }}
                        >
                          Paid Cash
                        </td>
                        <td
                          style={{
                            padding: "2px 8px",
                            borderBottom: "1px solid #ccc",
                            textAlign: "right",
                            fontSize: 10.5,
                          }}
                        >
                          {bill.paidCash || ""}
                        </td>
                      </tr>
                    )}
                    {bill.receiptCash !== undefined && (
                      <tr>
                        <td
                          style={{
                            padding: "2px 8px",
                            borderBottom: "1px solid #ccc",
                            fontSize: 10.5,
                          }}
                        >
                          Receipt Cash
                        </td>
                        <td
                          style={{
                            padding: "2px 8px",
                            borderBottom: "1px solid #ccc",
                            textAlign: "right",
                            fontSize: 10.5,
                          }}
                        >
                          {bill.receiptCash || ""}
                        </td>
                      </tr>
                    )}
                    {/* Previous Balance */}
                    <tr>
                      <td
                        style={{
                          padding: "2px 8px",
                          borderBottom: "1px solid #ccc",
                          fontSize: 10.5,
                        }}
                      >
                        Previous Balance
                      </td>
                      <td
                        style={{
                          padding: "2px 8px",
                          borderBottom: "1px solid #ccc",
                          textAlign: "right",
                          fontWeight: "bold",
                          fontSize: 10.5,
                        }}
                      >
                        {bill.previousBalance !== undefined ? bill.previousBalance : ""}
                      </td>
                    </tr>
                    {/* Closing Balance */}
                    <tr style={{ background: "#f5f5f5" }}>
                      <td
                        style={{
                          padding: "3px 8px",
                          fontWeight: "bold",
                          fontSize: 11,
                        }}
                      >
                        Closing Balance
                      </td>
                      <td
                        style={{
                          padding: "3px 8px",
                          textAlign: "right",
                          fontWeight: "bold",
                          fontSize: 11,
                        }}
                      >
                        {bill.closingBalance !== undefined ? bill.closingBalance : ""}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ---- DR/NAAM ROW ---- */}
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
              <td
                style={{
                  border: "1px solid #000",
                  padding: "3px 8px",
                  width: "20%",
                  fontWeight: "bold",
                }}
              >
                Dr/Naam
              </td>
              <td
                style={{
                  border: "1px solid #000",
                  padding: "3px 8px",
                }}
              >
                {bill.drNaam || ""}
              </td>
              <td
                style={{
                  border: "1px solid #000",
                  padding: "3px 8px",
                  width: "20%",
                  fontWeight: "bold",
                  textAlign: "right",
                }}
              >
                Dr/Naam
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
