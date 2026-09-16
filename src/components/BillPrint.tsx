"use client";
import React, { forwardRef, useRef, useImperativeHandle } from "react";
import { useReactToPrint } from "react-to-print";
import type { Bill } from "@/lib/db";

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

  const issueItems = bill.items.filter((i) => i.type === "ISSUE");
  const receiveItems = bill.items.filter((i) => i.type === "RECEIVE");

  // Generous vertical padding & line-height so values NEVER touch the bottom line
  const thStyle: React.CSSProperties = {
    border: "1.5px solid #000000",
    padding: isPhoneSize ? "6px 2px 7px 2px" : "7px 4px 8px 4px",
    textAlign: "center",
    fontWeight: 900,
    background: "#e5e5e5",
    fontSize: isPhoneSize ? 10.5 : 11,
    color: "#000000",
    verticalAlign: "middle",
    lineHeight: 1.25,
  };

  const tdStyle: React.CSSProperties = {
    border: "1px solid #000000",
    padding: isPhoneSize ? "6px 2px 7px 2px" : "7px 4px 8px 4px",
    textAlign: "center",
    verticalAlign: "middle",
    fontSize: isPhoneSize ? 11.5 : 12,
    fontWeight: 800,
    lineHeight: 1.35,
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

  const footerCellPadding = isPhoneSize
    ? "5px 8px 6px 8px"
    : "6px 10px 7px 10px";
  const footerHeaderPadding = isPhoneSize
    ? "4px 8px 5px 8px"
    : "5px 10px 6px 10px";
  const footerClosingPadding = isPhoneSize
    ? "6px 8px 7px 8px"
    : "7px 10px 8px 10px";

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
          padding: isPhoneSize ? "14px 16px" : "18px 22px",
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
            marginBottom: 8,
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
                  padding: isPhoneSize
                    ? "6px 6px 7px 2px"
                    : "7px 6px 8px 4px",
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
                  padding: isPhoneSize
                    ? "6px 6px 7px 2px"
                    : "7px 6px 8px 4px",
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
                  padding: isPhoneSize
                    ? "6px 6px 7px 2px"
                    : "7px 6px 8px 4px",
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
          const netFineBeforeRecv = prevFine + issueFine;
          const totalFineDue = Math.max(0, netFineBeforeRecv);
          const closingFine =
            bill.closingFineGold !== undefined && bill.closingFineGold !== ""
              ? parseFloat(bill.closingFineGold)
              : netFineBeforeRecv - recvFine;

          const prevCash = parseFloat(bill.previousBalance ?? "0") || 0;
          const issueCash = issueItems.reduce(
            (acc, i) => acc + (parseFloat(i.amount || "0") || 0),
            0
          );
          const recvCash = receiveItems.reduce(
            (acc, i) => acc + (parseFloat(i.amount || "0") || 0),
            0
          );
          const netCashBeforeRecv = prevCash + issueCash;
          const totalCashDue = Math.max(0, netCashBeforeRecv);
          const closingCash =
            bill.closingBalance !== undefined && bill.closingBalance !== ""
              ? parseFloat(bill.closingBalance)
              : netCashBeforeRecv - recvCash;

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
                              padding: footerHeaderPadding,
                              background: "#f0fdf4",
                              borderBottom: "1px solid #ddd",
                              fontSize: isPhoneSize ? 9.5 : 10,
                              fontWeight: 900,
                              color: "#166534",
                              letterSpacing: 0.4,
                              lineHeight: 1.3,
                            }}
                          >
                            CASH JAMA (₹)
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              padding: footerCellPadding,
                              borderBottom: "1px solid #ccc",
                              fontSize: isPhoneSize ? 10.5 : 11,
                              fontWeight: 700,
                              width: "55%",
                              color: "#000000",
                              lineHeight: 1.35,
                            }}
                          >
                            {prevCash < -0.01 ? "Previous Advance (−)" : prevCash > 0.01 ? "Previous Due (+)" : "Previous Balance"}
                          </td>
                          <td
                            style={{
                              padding: footerCellPadding,
                              borderBottom: "1px solid #ccc",
                              textAlign: "right",
                              fontSize: isPhoneSize ? 10.5 : 11,
                              fontWeight: 800,
                              color: prevCash < -0.01 ? "#166534" : "#000000",
                              lineHeight: 1.35,
                            }}
                          >
                            {prevCash < -0.01 ? `−₹${Math.abs(prevCash).toFixed(2)}` : prevCash > 0.01 ? `+₹${prevCash.toFixed(2)}` : "₹0.00"}
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              padding: footerCellPadding,
                              borderBottom: "1px solid #ccc",
                              fontSize: isPhoneSize ? 10.5 : 11,
                              fontWeight: 700,
                              color: "#000000",
                              lineHeight: 1.35,
                            }}
                          >
                            This Bill Issue Cash (+)
                          </td>
                          <td
                            style={{
                              padding: footerCellPadding,
                              borderBottom: "1px solid #ccc",
                              textAlign: "right",
                              fontSize: isPhoneSize ? 10.5 : 11,
                              fontWeight: 800,
                              color: "#166534",
                              lineHeight: 1.35,
                            }}
                          >
                            {issueCash > 0 ? `+₹${issueCash.toFixed(2)}` : "₹0.00"}
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              padding: footerCellPadding,
                              borderBottom: "1px solid #ccc",
                              fontSize: isPhoneSize ? 10.5 : 11,
                              fontWeight: 900,
                              color: "#000000",
                              lineHeight: 1.35,
                            }}
                          >
                            Total Cash Due
                          </td>
                          <td
                            style={{
                              padding: footerCellPadding,
                              borderBottom: "1px solid #ccc",
                              textAlign: "right",
                              fontSize: isPhoneSize ? 10.5 : 11,
                              fontWeight: 900,
                              color: "#166534",
                              lineHeight: 1.35,
                            }}
                          >
                            {`₹${totalCashDue.toFixed(2)}`}
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              padding: footerCellPadding,
                              borderBottom: "1px solid #ccc",
                              fontSize: isPhoneSize ? 10.5 : 11,
                              fontWeight: 700,
                              color: "#000000",
                              lineHeight: 1.35,
                            }}
                          >
                            Received Cash (−)
                          </td>
                          <td
                            style={{
                              padding: footerCellPadding,
                              borderBottom: "1px solid #ccc",
                              textAlign: "right",
                              fontSize: isPhoneSize ? 10.5 : 11,
                              fontWeight: 800,
                              color: "#166534",
                              lineHeight: 1.35,
                            }}
                          >
                            {recvCash > 0 ? `−₹${recvCash.toFixed(2)}` : "₹0.00"}
                          </td>
                        </tr>
                        <tr style={{ background: closingCash < -0.01 ? "#ecfdf5" : "#dcfce7" }}>
                          <td
                            style={{
                              padding: footerClosingPadding,
                              fontWeight: 900,
                              fontSize: isPhoneSize ? 11 : 11.5,
                              color: closingCash < -0.01 ? "#059669" : "#166534",
                              lineHeight: 1.35,
                            }}
                          >
                            {closingCash < -0.01 ? "Closing Advance (Stock)" : closingCash > 0.01 ? "Closing Due Cash" : "Closing Cash"}
                          </td>
                          <td
                            style={{
                              padding: footerClosingPadding,
                              textAlign: "right",
                              fontWeight: 900,
                              fontSize: isPhoneSize ? 11 : 11.5,
                              color: closingCash < -0.01 ? "#059669" : "#166534",
                              lineHeight: 1.35,
                            }}
                          >
                            {closingCash < -0.01 ? `₹${Math.abs(closingCash).toFixed(2)} Adv` : closingCash > 0.01 ? `₹${closingCash.toFixed(2)} Due` : "₹0.00 (Cleared)"}
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
                              padding: footerHeaderPadding,
                              background: "#fef9e7",
                              borderBottom: "1px solid #ddd",
                              fontSize: isPhoneSize ? 9.5 : 10,
                              fontWeight: 900,
                              color: "#92400e",
                              letterSpacing: 0.4,
                              lineHeight: 1.3,
                            }}
                          >
                            FINE GOLD JAMA (grams)
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              padding: footerCellPadding,
                              borderBottom: "1px solid #ccc",
                              fontSize: isPhoneSize ? 10.5 : 11,
                              fontWeight: 700,
                              width: "55%",
                              color: "#000000",
                              lineHeight: 1.35,
                            }}
                          >
                            {prevFine < -0.0001 ? "Previous Advance (−)" : prevFine > 0.0001 ? "Previous Due (+)" : "Previous Balance"}
                          </td>
                          <td
                            style={{
                              padding: footerCellPadding,
                              borderBottom: "1px solid #ccc",
                              textAlign: "right",
                              fontSize: isPhoneSize ? 10.5 : 11,
                              fontWeight: 800,
                              color: prevFine < -0.0001 ? "#059669" : "#000000",
                              lineHeight: 1.35,
                            }}
                          >
                            {prevFine < -0.0001 ? `−${Math.abs(prevFine).toFixed(3)} g` : prevFine > 0.0001 ? `+${prevFine.toFixed(3)} g` : "0.000 g"}
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              padding: footerCellPadding,
                              borderBottom: "1px solid #ccc",
                              fontSize: isPhoneSize ? 10.5 : 11,
                              fontWeight: 700,
                              color: "#000000",
                              lineHeight: 1.35,
                            }}
                          >
                            This Bill Issue (+)
                          </td>
                          <td
                            style={{
                              padding: footerCellPadding,
                              borderBottom: "1px solid #ccc",
                              textAlign: "right",
                              fontSize: isPhoneSize ? 10.5 : 11,
                              fontWeight: 800,
                              color: "#b45309",
                              lineHeight: 1.35,
                            }}
                          >
                            {issueFine > 0 ? `+${issueFine.toFixed(3)}` : "0.000"} g
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              padding: footerCellPadding,
                              borderBottom: "1px solid #ccc",
                              fontSize: isPhoneSize ? 10.5 : 11,
                              fontWeight: 900,
                              color: "#000000",
                              lineHeight: 1.35,
                            }}
                          >
                            Total Fine Due
                          </td>
                          <td
                            style={{
                              padding: footerCellPadding,
                              borderBottom: "1px solid #ccc",
                              textAlign: "right",
                              fontSize: isPhoneSize ? 10.5 : 11,
                              fontWeight: 900,
                              color: "#92400e",
                              lineHeight: 1.35,
                            }}
                          >
                            {totalFineDue.toFixed(3)} g
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              padding: footerCellPadding,
                              borderBottom: "1px solid #ccc",
                              fontSize: isPhoneSize ? 10.5 : 11,
                              fontWeight: 700,
                              color: "#000000",
                              lineHeight: 1.35,
                            }}
                          >
                            Received Fine (−)
                          </td>
                          <td
                            style={{
                              padding: footerCellPadding,
                              borderBottom: "1px solid #ccc",
                              textAlign: "right",
                              fontSize: isPhoneSize ? 10.5 : 11,
                              fontWeight: 800,
                              color: "#166534",
                              lineHeight: 1.35,
                            }}
                          >
                            {recvFine > 0 ? `−${recvFine.toFixed(3)}` : "0.000"} g
                          </td>
                        </tr>
                        <tr style={{ background: closingFine < -0.0001 ? "#ecfdf5" : "#fff3cd" }}>
                          <td
                            style={{
                              padding: footerClosingPadding,
                              fontWeight: 900,
                              fontSize: isPhoneSize ? 11.5 : 12,
                              color: closingFine < -0.0001 ? "#059669" : "#856404",
                              lineHeight: 1.35,
                            }}
                          >
                            {closingFine < -0.0001 ? "Closing Advance (Stock)" : closingFine > 0.0001 ? "Closing Due Gold" : "Closing Fine Gold"}
                          </td>
                          <td
                            style={{
                              padding: footerClosingPadding,
                              textAlign: "right",
                              fontWeight: 900,
                              fontSize: isPhoneSize ? 12 : 13,
                              color: closingFine < -0.0001 ? "#059669" : "#856404",
                              lineHeight: 1.35,
                            }}
                          >
                            {closingFine < -0.0001 ? `${Math.abs(closingFine).toFixed(3)} g Adv` : closingFine > 0.0001 ? `${closingFine.toFixed(3)} g Due` : "0.000 g (Cleared)"}
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
