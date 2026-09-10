"use client";
import React, { forwardRef, useRef, useImperativeHandle } from "react";
import { useReactToPrint } from "react-to-print";
import type { Bill } from "@/lib/db";
import { Printer } from "lucide-react";

interface Props {
  bill: Bill;
  companyName?: string;
  isPhoneSize?: boolean;
}

function fmtDate(d: string) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

const MONO_FONT = "'Consolas', 'Courier New', monospace";

export const BillPrint = forwardRef<HTMLDivElement, Props>(function BillPrint(
  { bill, companyName = "BHATIJA", isPhoneSize = false },
  outerRef
) {
  const internalRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(outerRef, () => internalRef.current as HTMLDivElement);

  const handlePrint = useReactToPrint({
    contentRef: internalRef,
    documentTitle: `Bill-${bill.voucherNo}`,
  });

  const issueItems = bill.items.filter((i) => i.type === "ISSUE");
  const receiveItems = bill.items.filter((i) => i.type === "RECEIVE");

  // Phone size styles vs Desktop size styles
  const thStyle: React.CSSProperties = {
    border: "1.5px solid #000000",
    padding: isPhoneSize ? "4px 2px" : "6px 4px",
    textAlign: "center",
    fontWeight: 900,
    background: "#e5e5e5",
    fontSize: isPhoneSize ? 10.5 : 11,
    color: "#000000",
    verticalAlign: "middle",
    lineHeight: 1.15,
  };

  const tdStyle: React.CSSProperties = {
    border: "1px solid #000000",
    padding: isPhoneSize ? "4px 2px" : "6px 4px",
    textAlign: "center",
    verticalAlign: "middle",
    fontSize: isPhoneSize ? 11.5 : 12,
    fontWeight: 800,
    color: "#000000",
  };

  const tdLeftStyle: React.CSSProperties = {
    ...tdStyle,
    textAlign: "left",
    fontWeight: 900,
  };

  const totalRowStyle: React.CSSProperties = {
    ...tdStyle,
    fontWeight: 900,
    background: "#f0f0f0",
    fontSize: isPhoneSize ? 12 : 12.5,
    color: "#000000",
  };

  const grandTotalStyle: React.CSSProperties = {
    ...tdStyle,
    fontWeight: 900,
    background: "#dedede",
    fontSize: isPhoneSize ? 13 : 13.5,
    color: "#000000",
  };

  return (
    <div>
      {/* ===== PRINTABLE BILL (EXACT SARAFA FORMAT) ===== */}
      <div
        ref={internalRef}
        className="print-area"
        style={{
          fontFamily: MONO_FONT,
          fontSize: isPhoneSize ? 11 : 11.5,
          color: "#000000",
          background: "#ffffff",
          padding: isPhoneSize ? "12px 14px" : "16px 20px",
          maxWidth: isPhoneSize ? 640 : 1000,
          width: "100%",
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        {/* ---- HEADER ---- */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: 6,
          }}
        >
          <tbody>
            <tr>
              <td
                style={{
                  fontWeight: 900,
                  fontSize: isPhoneSize ? 16 : 18,
                  letterSpacing: 1,
                  padding: 0,
                  border: "none",
                  color: "#000000",
                  textTransform: "uppercase",
                }}
              >
                {companyName}
              </td>
              <td
                style={{
                  textAlign: "right",
                  border: "none",
                  fontSize: isPhoneSize ? 11 : 12,
                  fontWeight: 800,
                  lineHeight: 1.7,
                  color: "#000000",
                }}
              >
                <span>V.No.&nbsp;&nbsp;:&nbsp;&nbsp;{bill.voucherNo}</span>
                <br />
                <span>
                  Date&nbsp;&nbsp;&nbsp;:&nbsp;&nbsp;{fmtDate(bill.date)}
                  {bill.time ? ` ${bill.time}` : ""}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ---- MAIN 12-COLUMN TABLE (EXACT SARAFA FORMAT) ---- */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
            fontFamily: MONO_FONT,
            color: "#000000",
          }}
        >
          <thead>
            <tr>
              <th style={{ ...thStyle, width: "4%" }}>S.No</th>
              <th style={{ ...thStyle, width: "8%" }}>Amount</th>
              <th style={{ ...thStyle, width: "16%", textAlign: "left" }}>
                Item Name
              </th>
              <th style={{ ...thStyle, width: "4%" }}>Pcs</th>
              <th style={{ ...thStyle, width: "9%" }}>
                Gross
                <br />
                Weight
              </th>
              <th style={{ ...thStyle, width: "8%" }}>
                AD
                <br />
                Weight
              </th>
              <th style={{ ...thStyle, width: "8%" }}>
                Less
                <br />
                Weight
              </th>
              <th style={{ ...thStyle, width: "10%", textAlign: "left" }}>
                Description
              </th>
              <th style={{ ...thStyle, width: "9%" }}>
                Net
                <br />
                Weight
              </th>
              <th style={{ ...thStyle, width: "7%" }}>
                Tunch
                <br />%
              </th>
              <th style={{ ...thStyle, width: "7%" }}>Rate</th>
              <th style={{ ...thStyle, width: "10%" }}>
                Fine
                <br />
                Gold
              </th>
            </tr>
          </thead>
          <tbody>
            {/* ===== ISSUE SECTION ===== */}
            <tr>
              <td style={tdStyle}></td>
              <td style={tdStyle}></td>
              <td style={tdLeftStyle}>
                <span
                  style={{
                    fontWeight: 900,
                    textDecoration: "underline",
                    fontSize: isPhoneSize ? 11.5 : 12,
                  }}
                >
                  ISSUE
                </span>
              </td>
              <td style={tdStyle}></td>
              <td style={tdStyle}></td>
              <td style={tdStyle}></td>
              <td style={tdStyle}></td>
              <td style={tdStyle}></td>
              <td style={tdStyle}></td>
              <td style={tdStyle}></td>
              <td style={tdStyle}></td>
              <td style={tdStyle}></td>
            </tr>

            {issueItems.map((item, idx) => (
              <tr key={item.id || idx}>
                <td style={tdStyle}>{idx + 1}</td>
                <td style={tdStyle}>{item.amount || ""}</td>
                <td style={tdLeftStyle}>
                  <div>{item.itemName}</div>
                </td>
                <td style={tdStyle}>{item.pcs || ""}</td>
                <td style={tdStyle}>{item.grossWeight || ""}</td>
                <td style={tdStyle}>{item.adWeight || ""}</td>
                <td style={tdStyle}>{item.lessWeight || ""}</td>
                <td style={{ ...tdLeftStyle, fontWeight: 700 }}>
                  {item.description || ""}
                </td>
                <td style={tdStyle}>{item.netWeight || ""}</td>
                <td style={tdStyle}>{item.tunch || ""}</td>
                <td style={tdStyle}>{item.rate || ""}</td>
                <td style={tdStyle}>{item.fineGold || ""}</td>
              </tr>
            ))}

            {/* Issue Total */}
            <tr style={{ background: "#f0f0f0" }}>
              <td style={totalRowStyle}></td>
              <td style={totalRowStyle}></td>
              <td
                colSpan={2}
                style={{
                  ...totalRowStyle,
                  textAlign: "right",
                  padding: isPhoneSize ? "4px 6px 4px 2px" : "6px 6px 6px 4px",
                }}
              >
                Issue - Total :
              </td>
              <td style={totalRowStyle}>{bill.issueTotalGross || ""}</td>
              <td style={totalRowStyle}>
                {issueItems.reduce(
                  (acc, item) =>
                    acc + (parseFloat(item.adWeight || "0") || 0),
                  0
                ) > 0
                  ? issueItems
                      .reduce(
                        (acc, item) =>
                          acc + (parseFloat(item.adWeight || "0") || 0),
                        0
                      )
                      .toFixed(3)
                  : ""}
              </td>
              <td style={totalRowStyle}>{bill.issueTotalLess || ""}</td>
              <td style={totalRowStyle}></td>
              <td style={totalRowStyle}>{bill.issueTotalNet || ""}</td>
              <td style={totalRowStyle}></td>
              <td style={totalRowStyle}></td>
              <td style={totalRowStyle}>{bill.issueTotalFine || ""}</td>
            </tr>

            {/* ===== RECEIVE SECTION ===== */}
            <tr>
              <td style={tdStyle}></td>
              <td style={tdStyle}></td>
              <td style={tdLeftStyle}>
                <span
                  style={{
                    fontWeight: 900,
                    textDecoration: "underline",
                    fontSize: isPhoneSize ? 11.5 : 12,
                  }}
                >
                  RECEIVE
                </span>
              </td>
              <td style={tdStyle}></td>
              <td style={tdStyle}></td>
              <td style={tdStyle}></td>
              <td style={tdStyle}></td>
              <td style={tdStyle}></td>
              <td style={tdStyle}></td>
              <td style={tdStyle}></td>
              <td style={tdStyle}></td>
              <td style={tdStyle}></td>
            </tr>

            {receiveItems.map((item, idx) => (
              <tr key={item.id || idx}>
                <td style={tdStyle}>{idx + 1}</td>
                <td style={tdStyle}>{item.amount || ""}</td>
                <td style={tdLeftStyle}>
                  <div>{item.itemName}</div>
                </td>
                <td style={tdStyle}>{item.pcs || ""}</td>
                <td style={tdStyle}>{item.grossWeight || ""}</td>
                <td style={tdStyle}>{item.adWeight || ""}</td>
                <td style={tdStyle}>{item.lessWeight || ""}</td>
                <td style={{ ...tdLeftStyle, fontWeight: 700 }}>
                  {item.description || ""}
                </td>
                <td style={tdStyle}>{item.netWeight || ""}</td>
                <td style={tdStyle}>{item.tunch || ""}</td>
                <td style={tdStyle}>{item.rate || ""}</td>
                <td style={tdStyle}>{item.fineGold || ""}</td>
              </tr>
            ))}

            {/* Receive Total */}
            <tr style={{ background: "#f0f0f0" }}>
              <td style={totalRowStyle}></td>
              <td style={totalRowStyle}></td>
              <td
                colSpan={2}
                style={{
                  ...totalRowStyle,
                  textAlign: "right",
                  padding: isPhoneSize ? "4px 6px 4px 2px" : "6px 6px 6px 4px",
                }}
              >
                Receive - Total :
              </td>
              <td style={totalRowStyle}>{bill.recvTotalGross || ""}</td>
              <td style={totalRowStyle}>
                {receiveItems.reduce(
                  (acc, item) =>
                    acc + (parseFloat(item.adWeight || "0") || 0),
                  0
                ) > 0
                  ? receiveItems
                      .reduce(
                        (acc, item) =>
                          acc + (parseFloat(item.adWeight || "0") || 0),
                        0
                      )
                      .toFixed(3)
                  : ""}
              </td>
              <td style={totalRowStyle}>{bill.recvTotalLess || ""}</td>
              <td style={totalRowStyle}></td>
              <td style={totalRowStyle}>{bill.recvTotalNet || ""}</td>
              <td style={totalRowStyle}></td>
              <td style={totalRowStyle}></td>
              <td style={totalRowStyle}>{bill.recvTotalFine || ""}</td>
            </tr>

            {/* Bill Total (Positive values with R for receive) */}
            <tr style={{ background: "#dedede" }}>
              <td style={grandTotalStyle}></td>
              <td style={grandTotalStyle}></td>
              <td
                colSpan={2}
                style={{
                  ...grandTotalStyle,
                  textAlign: "right",
                  padding: isPhoneSize ? "4px 6px 4px 2px" : "6px 6px 6px 4px",
                }}
              >
                Bill Total :
              </td>
              <td style={grandTotalStyle}>
                {(() => {
                  const v = parseFloat(bill.billTotalGross || "0") || 0;
                  return v < 0
                    ? `${Math.abs(v).toFixed(3)} R`
                    : v > 0
                    ? v.toFixed(3)
                    : "0.000";
                })()}
              </td>
              <td style={grandTotalStyle}>
                {(() => {
                  const iA = issueItems.reduce(
                    (acc, item) =>
                      acc + (parseFloat(item.adWeight || "0") || 0),
                    0
                  );
                  const rA = receiveItems.reduce(
                    (acc, item) =>
                      acc + (parseFloat(item.adWeight || "0") || 0),
                    0
                  );
                  const diff = iA - rA;
                  return diff < 0
                    ? `${Math.abs(diff).toFixed(3)} R`
                    : diff > 0
                    ? diff.toFixed(3)
                    : "";
                })()}
              </td>
              <td style={grandTotalStyle}>
                {(() => {
                  const v = parseFloat(bill.billTotalLess || "0") || 0;
                  return v < 0
                    ? `${Math.abs(v).toFixed(3)} R`
                    : v > 0
                    ? v.toFixed(3)
                    : "0.000";
                })()}
              </td>
              <td style={grandTotalStyle}></td>
              <td style={grandTotalStyle}>
                {(() => {
                  const v = parseFloat(bill.billTotalNet || "0") || 0;
                  return v < 0
                    ? `${Math.abs(v).toFixed(3)} R`
                    : v > 0
                    ? v.toFixed(3)
                    : "0.000";
                })()}
              </td>
              <td style={grandTotalStyle}></td>
              <td style={grandTotalStyle}></td>
              <td style={grandTotalStyle}>
                {(() => {
                  const v = parseFloat(bill.billTotalFine || "0") || 0;
                  return v < 0
                    ? `${Math.abs(v).toFixed(3)} R`
                    : v > 0
                    ? v.toFixed(3)
                    : "0.000";
                })()}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ---- FOOTER (CASH JAMA & FINE GOLD JAMA SIDE-BY-SIDE) ---- */}
        {(() => {
          const prevFine = parseFloat(bill.prevFineGold ?? "0") || 0;
          const issueFine =
            parseFloat(bill.issueTotalFine ?? "0") ||
            issueItems.reduce(
              (acc, i) => acc + (parseFloat(i.fineGold || "0") || 0),
              0
            );
          const recvFine =
            parseFloat(bill.recvTotalFine ?? "0") ||
            receiveItems.reduce(
              (acc, i) => acc + (parseFloat(i.fineGold || "0") || 0),
              0
            );
          const totalFineDue = prevFine + issueFine;
          const closingFine = bill.closingFineGold
            ? parseFloat(bill.closingFineGold)
            : Math.max(0, totalFineDue - recvFine);

          const prevCash = parseFloat(bill.previousBalance ?? "0") || 0;
          const issueCash = issueItems.reduce(
            (acc, i) => acc + (parseFloat(i.amount || "0") || 0),
            0
          );
          const recvCash = receiveItems.reduce(
            (acc, i) => acc + (parseFloat(i.amount || "0") || 0),
            0
          );
          const totalCashDue = prevCash + issueCash;
          const closingCash = bill.closingBalance
            ? parseFloat(bill.closingBalance)
            : Math.max(0, totalCashDue - recvCash);

          return (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: 0,
                fontSize: isPhoneSize ? 10.5 : 11,
              }}
            >
              <tbody>
                <tr>
                  {/* CASH JAMA (₹) */}
                  <td
                    style={{
                      border: "1px solid #000000",
                      verticalAlign: "top",
                      padding: 0,
                      width: "50%",
                    }}
                  >
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontFamily: MONO_FONT,
                      }}
                    >
                      <tbody>
                        <tr>
                          <td
                            colSpan={2}
                            style={{
                              padding: "3px 8px",
                              background: "#f0fdf4",
                              borderBottom: "1px solid #ddd",
                              fontSize: isPhoneSize ? 9.5 : 10,
                              fontWeight: 900,
                              color: "#166534",
                              letterSpacing: 0.4,
                            }}
                          >
                            CASH JAMA (₹)
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              padding: "2px 8px",
                              borderBottom: "1px solid #ccc",
                              fontSize: isPhoneSize ? 10.5 : 11,
                              fontWeight: 700,
                              width: "55%",
                              color: "#000000",
                            }}
                          >
                            Previous Jama
                          </td>
                          <td
                            style={{
                              padding: "2px 8px",
                              borderBottom: "1px solid #ccc",
                              textAlign: "right",
                              fontSize: isPhoneSize ? 10.5 : 11,
                              fontWeight: 800,
                              color: "#000000",
                            }}
                          >
                            {prevCash > 0 ? prevCash.toFixed(2) : "0.00"}
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              padding: "2px 8px",
                              borderBottom: "1px solid #ccc",
                              fontSize: isPhoneSize ? 10.5 : 11,
                              fontWeight: 700,
                              color: "#000000",
                            }}
                          >
                            This Bill Issue Cash (+)
                          </td>
                          <td
                            style={{
                              padding: "2px 8px",
                              borderBottom: "1px solid #ccc",
                              textAlign: "right",
                              fontSize: isPhoneSize ? 10.5 : 11,
                              fontWeight: 800,
                              color: "#166534",
                            }}
                          >
                            {issueCash > 0 ? `+${issueCash.toFixed(2)}` : "0.00"}
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              padding: "2px 8px",
                              borderBottom: "1px solid #ccc",
                              fontSize: isPhoneSize ? 10.5 : 11,
                              fontWeight: 900,
                              color: "#000000",
                            }}
                          >
                            Total Cash Due
                          </td>
                          <td
                            style={{
                              padding: "2px 8px",
                              borderBottom: "1px solid #ccc",
                              textAlign: "right",
                              fontSize: isPhoneSize ? 10.5 : 11,
                              fontWeight: 900,
                              color: "#166534",
                            }}
                          >
                            {totalCashDue.toFixed(2)}
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              padding: "2px 8px",
                              borderBottom: "1px solid #ccc",
                              fontSize: isPhoneSize ? 10.5 : 11,
                              fontWeight: 700,
                              color: "#000000",
                            }}
                          >
                            Received Cash (−)
                          </td>
                          <td
                            style={{
                              padding: "2px 8px",
                              borderBottom: "1px solid #ccc",
                              textAlign: "right",
                              fontSize: isPhoneSize ? 10.5 : 11,
                              fontWeight: 800,
                              color: "#166534",
                            }}
                          >
                            {recvCash > 0 ? `−${recvCash.toFixed(2)}` : "0.00"}
                          </td>
                        </tr>
                        <tr style={{ background: "#dcfce7" }}>
                          <td
                            style={{
                              padding: "3px 8px",
                              fontWeight: 900,
                              fontSize: isPhoneSize ? 11 : 11.5,
                              color: "#166534",
                            }}
                          >
                            Closing Jama Cash
                          </td>
                          <td
                            style={{
                              padding: "3px 8px",
                              textAlign: "right",
                              fontWeight: 900,
                              fontSize: isPhoneSize ? 11 : 11.5,
                              color: "#166534",
                            }}
                          >
                            {closingCash.toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>

                  {/* FINE GOLD JAMA (grams) */}
                  <td
                    style={{
                      border: "1px solid #000000",
                      verticalAlign: "top",
                      padding: 0,
                      width: "50%",
                    }}
                  >
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontFamily: MONO_FONT,
                      }}
                    >
                      <tbody>
                        <tr>
                          <td
                            colSpan={2}
                            style={{
                              padding: "3px 8px",
                              background: "#fef9e7",
                              borderBottom: "1px solid #ddd",
                              fontSize: isPhoneSize ? 9.5 : 10,
                              fontWeight: 900,
                              color: "#92400e",
                              letterSpacing: 0.4,
                            }}
                          >
                            FINE GOLD JAMA (grams)
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              padding: "2px 8px",
                              borderBottom: "1px solid #ccc",
                              fontSize: isPhoneSize ? 10.5 : 11,
                              fontWeight: 700,
                              width: "55%",
                              color: "#000000",
                            }}
                          >
                            Previous Jama
                          </td>
                          <td
                            style={{
                              padding: "2px 8px",
                              borderBottom: "1px solid #ccc",
                              textAlign: "right",
                              fontSize: isPhoneSize ? 10.5 : 11,
                              fontWeight: 800,
                              color: "#000000",
                            }}
                          >
                            {prevFine > 0 ? prevFine.toFixed(3) : "0.000"} g
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              padding: "2px 8px",
                              borderBottom: "1px solid #ccc",
                              fontSize: isPhoneSize ? 10.5 : 11,
                              fontWeight: 700,
                              color: "#000000",
                            }}
                          >
                            This Bill Issue (+)
                          </td>
                          <td
                            style={{
                              padding: "2px 8px",
                              borderBottom: "1px solid #ccc",
                              textAlign: "right",
                              fontSize: isPhoneSize ? 10.5 : 11,
                              fontWeight: 800,
                              color: "#b45309",
                            }}
                          >
                            {issueFine > 0 ? `+${issueFine.toFixed(3)}` : "0.000"} g
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              padding: "2px 8px",
                              borderBottom: "1px solid #ccc",
                              fontSize: isPhoneSize ? 10.5 : 11,
                              fontWeight: 900,
                              color: "#000000",
                            }}
                          >
                            Total Fine Due
                          </td>
                          <td
                            style={{
                              padding: "2px 8px",
                              borderBottom: "1px solid #ccc",
                              textAlign: "right",
                              fontSize: isPhoneSize ? 10.5 : 11,
                              fontWeight: 900,
                              color: "#92400e",
                            }}
                          >
                            {totalFineDue.toFixed(3)} g
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              padding: "2px 8px",
                              borderBottom: "1px solid #ccc",
                              fontSize: isPhoneSize ? 10.5 : 11,
                              fontWeight: 700,
                              color: "#000000",
                            }}
                          >
                            Received Fine (−)
                          </td>
                          <td
                            style={{
                              padding: "2px 8px",
                              borderBottom: "1px solid #ccc",
                              textAlign: "right",
                              fontSize: isPhoneSize ? 10.5 : 11,
                              fontWeight: 800,
                              color: "#166534",
                            }}
                          >
                            {recvFine > 0 ? `−${recvFine.toFixed(3)}` : "0.000"} g
                          </td>
                        </tr>
                        <tr style={{ background: "#fff3cd" }}>
                          <td
                            style={{
                              padding: "4px 8px",
                              fontWeight: 900,
                              fontSize: isPhoneSize ? 11.5 : 12,
                              color: "#856404",
                            }}
                          >
                            Closing Jama Gold
                          </td>
                          <td
                            style={{
                              padding: "4px 8px",
                              textAlign: "right",
                              fontWeight: 900,
                              fontSize: isPhoneSize ? 12 : 13,
                              color: "#856404",
                            }}
                          >
                            {closingFine.toFixed(3)} g
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          );
        })()}
      </div>
    </div>
  );
});

export default BillPrint;
