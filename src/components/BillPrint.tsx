"use client";
import React, { forwardRef, useRef, useImperativeHandle } from "react";
import type { Bill, BillItem } from "@/lib/db";

export interface BillBusiness {
  business_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  gst_no?: string;
}

interface Props {
  bill: Bill;
  /** Business details from the logged-in user's Settings/Profile */
  business?: BillBusiness | null;
  customerPhone?: string;
  customerAddress?: string;
  isPhoneSize?: boolean;
}

function fmtDate(d: string) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

// ─── Design tokens (matched to the sample bill) ───────────────────────────────
const NAVY = "#1b2a4a";
const GOLD = "#a8742a";
const GOLD_DARK = "#8a5a12";
const CREAM = "#fdf8ec";
const CREAM_2 = "#f8f0dc";
const CREAM_3 = "#f4e6bf";
const LINE = "#ddd5c0";
const INK = "#1f2430";
const MUTED = "#5b6070";
const GREEN = "#1a7f45";
const SANS = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
const SERIF = "'Cinzel', 'Trajan Pro', 'Times New Roman', Georgia, serif";

const Icon = ({ d, size = 13, color = NAVY }: { d: string; size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
);
const P_PIN = "M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z";
const P_PHONE = "M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11 11 0 0 0 3.6.6 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.6 3.6a1 1 0 0 1-.25 1z";
const P_MAIL = "M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z";
const P_USER = "M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5z";
const P_COIN = "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 15.5V19h-2v-1.5a3.5 3.5 0 0 1-2.5-2.6l1.9-.5c.2.8.8 1.2 1.6 1.2s1.4-.4 1.4-1c0-.6-.5-.9-1.7-1.2-1.8-.5-3-1.1-3-2.7A2.8 2.8 0 0 1 11 8.5V7h2v1.5a3.3 3.3 0 0 1 2.3 2.3l-1.9.5c-.2-.7-.7-1-1.4-1s-1.2.3-1.2.9c0 .5.4.8 1.6 1.1 1.9.5 3.1 1.1 3.1 2.8a2.9 2.9 0 0 1-2.5 2.4z";
const P_BARS = "M3 17h18v3H3zm2-5h14v3H5zm3-5h8v3H8z";

/** Diamond logo mark */
const Logo = ({ size }: { size: number }) => (
  <svg width={size} height={size * 0.82} viewBox="0 0 64 52" fill="none" style={{ flexShrink: 0 }}>
    <defs>
      <linearGradient id="bp-gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#e2b867" />
        <stop offset="1" stopColor="#9a6a22" />
      </linearGradient>
    </defs>
    <path d="M16 3h32l14 17-30 29L2 20z" fill="url(#bp-gold)" opacity="0.18" stroke="url(#bp-gold)" strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M2 20h60M22 20l10 29 10-29M16 3l6 17 10-17 10 17 6-17M32 3v17" stroke="url(#bp-gold)" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

const sumAd = (items: BillItem[]) =>
  items.reduce((acc, i) => acc + (parseFloat(i.adWeight || "0") || 0), 0);

const signed = (raw: string | undefined, fallback = "0.000") => {
  const v = parseFloat(raw || "0") || 0;
  return v < 0 ? `${Math.abs(v).toFixed(3)} R` : v > 0 ? v.toFixed(3) : fallback;
};

export const BillPrint = forwardRef<HTMLDivElement, Props>(function BillPrint(
  { bill, business, customerPhone, customerAddress, isPhoneSize = false },
  outerRef
) {
  const internalRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(outerRef, () => internalRef.current as HTMLDivElement);

  const ph = isPhoneSize;
  const issueItems = bill.items.filter((i) => i.type === "ISSUE");
  const receiveItems = bill.items.filter((i) => i.type === "RECEIVE");

  // ── Business info (per-user, from Settings) ──
  const bizName = (business?.business_name || "Your Business").trim();
  const words = bizName.split(/\s+/);
  const bizFirst = words.length > 1 ? words.slice(0, -1).join(" ") : bizName;
  const bizLast = words.length > 1 ? words[words.length - 1] : "";
  const addressLine = [business?.address, business?.city].filter(Boolean).join(", ");
  const contactRows: { icon: string; text: string }[] = [];
  if (addressLine) contactRows.push({ icon: P_PIN, text: addressLine });
  if (business?.phone) contactRows.push({ icon: P_PHONE, text: business.phone });
  if (business?.email) contactRows.push({ icon: P_MAIL, text: business.email });
  if (business?.gst_no) contactRows.push({ icon: P_BARS, text: `GSTIN: ${business.gst_no}` });

  // ── Table cell styles ──
  const pad = ph ? "6px 2px" : "8px 5px";
  const th: React.CSSProperties = {
    background: NAVY,
    color: "#ffffff",
    border: `1px solid #2d3d63`,
    padding: ph ? "7px 2px" : "9px 4px",
    textAlign: "center",
    fontWeight: 700,
    fontSize: ph ? 9 : 11.5,
    lineHeight: 1.25,
    verticalAlign: "middle",
  };
  const td: React.CSSProperties = {
    border: `1px solid ${LINE}`,
    padding: pad,
    textAlign: "center",
    verticalAlign: "middle",
    fontSize: ph ? 10 : 12,
    fontWeight: 500,
    color: INK,
    lineHeight: 1.35,
    background: "#ffffff",
    wordBreak: "break-word",
  };
  const tdLeft: React.CSSProperties = { ...td, textAlign: "left", paddingLeft: ph ? 3 : 8 };
  const tdSection: React.CSSProperties = { ...td, background: CREAM };
  const tdTotal: React.CSSProperties = { ...td, background: CREAM_2, fontWeight: 700 };
  const tdGrand: React.CSSProperties = {
    ...td,
    background: CREAM_3,
    fontWeight: 800,
    fontSize: ph ? 11 : 13.5,
    borderTop: `1.5px solid ${GOLD}`,
    borderBottom: `1.5px solid ${GOLD}`,
  };

  const emptyCells = (n: number, style: React.CSSProperties) =>
    Array.from({ length: n }).map((_, i) => <td key={i} style={style}></td>);

  const sectionRow = (label: string) => (
    <tr>
      <td style={tdSection}></td>
      <td style={tdSection}></td>
      <td style={{ ...tdSection, textAlign: "left", fontWeight: 800, paddingLeft: ph ? 3 : 8, letterSpacing: 0.5 }}>
        {label}
      </td>
      {emptyCells(9, tdSection)}
    </tr>
  );

  const itemRow = (item: BillItem, idx: number) => (
    <tr key={item.id || idx}>
      <td style={td}>{idx + 1}</td>
      <td style={td}>{item.amount || ""}</td>
      <td style={{ ...tdLeft, fontWeight: 600 }}>{item.itemName}</td>
      <td style={td}>{item.pcs || ""}</td>
      <td style={td}>{item.grossWeight || ""}</td>
      <td style={td}>{item.adWeight || ""}</td>
      <td style={td}>{item.lessWeight || ""}</td>
      <td style={tdLeft}>{item.description || ""}</td>
      <td style={td}>{item.netWeight || ""}</td>
      <td style={td}>{item.tunch || ""}</td>
      <td style={td}>{item.rate || ""}</td>
      <td style={{ ...td, fontWeight: 700 }}>{item.fineGold || ""}</td>
    </tr>
  );

  const totalRow = (
    label: string,
    gross?: string,
    ad?: number,
    less?: string,
    net?: string,
    fine?: string
  ) => (
    <tr>
      <td style={tdTotal}></td>
      <td style={tdTotal}></td>
      <td colSpan={2} style={{ ...tdTotal, textAlign: "right", paddingRight: ph ? 4 : 8 }}>
        {label}
      </td>
      <td style={tdTotal}>{gross || ""}</td>
      <td style={tdTotal}>{ad && ad > 0 ? ad.toFixed(3) : ""}</td>
      <td style={tdTotal}>{less || ""}</td>
      <td style={tdTotal}></td>
      <td style={tdTotal}>{net || ""}</td>
      <td style={tdTotal}></td>
      <td style={tdTotal}></td>
      <td style={tdTotal}>{fine || ""}</td>
    </tr>
  );

  // ── Footer maths (unchanged logic) ──
  const prevFine = parseFloat(bill.prevFineGold ?? "0") || 0;
  const issueFine =
    parseFloat(bill.issueTotalFine ?? "0") ||
    issueItems.reduce((acc, i) => acc + (parseFloat(i.fineGold || "0") || 0), 0);
  const recvFine =
    parseFloat(bill.recvTotalFine ?? "0") ||
    receiveItems.reduce((acc, i) => acc + (parseFloat(i.fineGold || "0") || 0), 0);
  const netFineBeforeRecv = prevFine + issueFine;
  const totalFineDue = Math.max(0, netFineBeforeRecv);
  const closingFine =
    bill.closingFineGold !== undefined && bill.closingFineGold !== ""
      ? parseFloat(bill.closingFineGold)
      : netFineBeforeRecv - recvFine;

  const prevCash = parseFloat(bill.previousBalance ?? "0") || 0;
  const issueCash = issueItems.reduce((acc, i) => acc + (parseFloat(i.amount || "0") || 0), 0);
  const recvCash = receiveItems.reduce((acc, i) => acc + (parseFloat(i.amount || "0") || 0), 0);
  const netCashBeforeRecv = prevCash + issueCash;
  const totalCashDue = Math.max(0, netCashBeforeRecv);
  const closingCash =
    bill.closingBalance !== undefined && bill.closingBalance !== ""
      ? parseFloat(bill.closingBalance)
      : netCashBeforeRecv - recvCash;

  const fPad = ph ? "6px 9px" : "8px 14px";
  const fSize = ph ? 10.5 : 12;
  const fRow = (label: string, value: string, color: string, bold = false) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 6,
        padding: fPad,
        borderBottom: `1px solid #ece6d6`,
        fontSize: fSize,
        color: INK,
        fontWeight: bold ? 700 : 500,
        background: "#ffffff",
      }}
    >
      <span>{label}</span>
      <span style={{ color, fontWeight: 700, whiteSpace: "nowrap" }}>{value}</span>
    </div>
  );

  const card = (
    title: string,
    iconPath: string,
    accent: string,
    headBg: string,
    border: string,
    closeBg: string,
    rows: React.ReactNode,
    closeLabel: string,
    closeValue: string
  ) => (
    <div
      style={{
        flex: "1 1 0",
        minWidth: 0,
        border: `1px solid ${border}`,
        borderRadius: 6,
        overflow: "hidden",
        background: "#ffffff",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: ph ? "7px 9px" : "9px 14px",
          background: headBg,
          color: accent,
          fontWeight: 800,
          fontSize: ph ? 10.5 : 12.5,
          borderBottom: `1px solid ${border}`,
        }}
      >
        <Icon d={iconPath} size={ph ? 13 : 16} color={accent} />
        {title}
      </div>
      {rows}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 6,
          padding: ph ? "8px 9px" : "10px 14px",
          background: closeBg,
          color: accent,
          fontWeight: 800,
          fontSize: ph ? 11 : 13,
        }}
      >
        <span>{closeLabel}</span>
        <span style={{ whiteSpace: "nowrap" }}>{closeValue}</span>
      </div>
    </div>
  );

  const cashLabel = (v: number, adv: string, due: string, zero: string) =>
    v < -0.01 ? adv : v > 0.01 ? due : zero;

  return (
    <div>
      <div
        ref={internalRef}
        className="print-area"
        style={{
          fontFamily: SANS,
          fontSize: ph ? 11 : 12,
          color: INK,
          background: "#ffffff",
          padding: ph ? "10px 10px 14px" : "18px 22px 22px",
          maxWidth: ph ? 640 : 1000,
          width: "100%",
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        {/* ===== HEADER ===== */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: ph ? 8 : 16,
            paddingBottom: ph ? 10 : 14,
            borderBottom: `2px solid ${GOLD}`,
            marginBottom: ph ? 8 : 12,
          }}
        >
          {/* Logo + name */}
          <div style={{ display: "flex", alignItems: "center", gap: ph ? 8 : 14, minWidth: 0, flex: "1 1 auto" }}>
            <Logo size={ph ? 38 : 64} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: SERIF, lineHeight: 1.1, display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: ph ? 5 : 9 }}>
                <span style={{ fontSize: ph ? 20 : 34, fontWeight: 700, color: GOLD, letterSpacing: ph ? 0.8 : 1.5, textTransform: "uppercase" }}>
                  {bizFirst}
                </span>
                {bizLast && (
                  <span style={{ fontSize: ph ? 13 : 22, fontWeight: 600, color: NAVY, letterSpacing: ph ? 1.2 : 2.5, textTransform: "uppercase" }}>
                    {bizLast}
                  </span>
                )}
              </div>
              <div style={{ height: 1, background: `linear-gradient(90deg, ${GOLD}, transparent)`, marginTop: ph ? 4 : 6 }} />
            </div>
          </div>

          {/* Contact */}
          {contactRows.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: ph ? 2 : 4,
                fontSize: ph ? 9.5 : 11.5,
                color: INK,
                paddingLeft: ph ? 0 : 16,
                borderLeft: ph ? "none" : `1px solid ${LINE}`,
                maxWidth: ph ? "100%" : 260,
              }}
            >
              {contactRows.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
                  <span style={{ marginTop: 1 }}><Icon d={r.icon} size={ph ? 10 : 12} /></span>
                  <span style={{ lineHeight: 1.35 }}>{r.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Bill no / date */}
          <div
            style={{
              background: CREAM,
              border: `1px solid ${CREAM_3}`,
              borderRadius: 6,
              padding: ph ? "6px 10px" : "9px 14px",
              fontSize: ph ? 10.5 : 12.5,
              lineHeight: 1.7,
              color: INK,
              marginLeft: ph ? 0 : "auto",
              minWidth: ph ? 0 : 190,
            }}
          >
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ fontWeight: 700, width: ph ? 48 : 62 }}>Bill No.</span>
              <span>:&nbsp;&nbsp;{bill.voucherNo}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ fontWeight: 700, width: ph ? 48 : 62 }}>Date</span>
              <span>:&nbsp;&nbsp;{fmtDate(bill.date)}{bill.time ? ` ${bill.time}` : ""}</span>
            </div>
          </div>
        </div>

        {/* ===== CUSTOMER DETAILS ===== */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: ph ? 9 : 14,
            background: CREAM,
            border: `1px solid ${CREAM_3}`,
            borderRadius: 6,
            padding: ph ? "8px 10px" : "12px 18px",
            marginBottom: ph ? 8 : 12,
          }}
        >
          <div
            style={{
              width: ph ? 28 : 38,
              height: ph ? 28 : 38,
              borderRadius: "50%",
              background: CREAM_3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon d={P_USER} size={ph ? 16 : 22} color={GOLD} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: ph ? 9.5 : 11.5, fontWeight: 700, color: GOLD_DARK }}>Customer Details</div>
            <div style={{ fontSize: ph ? 14 : 18, fontWeight: 800, color: NAVY, textTransform: "uppercase", lineHeight: 1.25 }}>
              {bill.customerName}
            </div>
            <div style={{ fontSize: ph ? 9.5 : 11.5, color: MUTED, marginTop: 2, lineHeight: 1.5 }}>
              <div>Mobile &nbsp;&nbsp;: {customerPhone || "-"}</div>
              <div>Address : {customerAddress || "-"}</div>
            </div>
          </div>
        </div>

        {/* ===== MAIN TABLE ===== */}
        <div style={{ border: `1px solid ${NAVY}`, borderRadius: 6, overflow: "hidden", marginBottom: ph ? 8 : 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={{ ...th, width: "5%" }}>S.No</th>
                <th style={{ ...th, width: "8%" }}>Amount</th>
                <th style={{ ...th, width: "15%", textAlign: "left", paddingLeft: ph ? 3 : 8 }}>Item Name</th>
                <th style={{ ...th, width: "5%" }}>Pcs</th>
                <th style={{ ...th, width: "9%" }}>Gross<br />Weight</th>
                <th style={{ ...th, width: "7%" }}>AD<br />Weight</th>
                <th style={{ ...th, width: "7%" }}>Less<br />Weight</th>
                <th style={{ ...th, width: "11%", textAlign: "left", paddingLeft: ph ? 3 : 8 }}>Description</th>
                <th style={{ ...th, width: "9%" }}>Net<br />Weight</th>
                <th style={{ ...th, width: "6%" }}>Tunch<br />%</th>
                <th style={{ ...th, width: "6%" }}>Rate</th>
                <th style={{ ...th, width: "10%" }}>Fine<br />Gold</th>
              </tr>
            </thead>
            <tbody>
              {sectionRow("ISSUE")}
              {issueItems.map(itemRow)}
              {totalRow("Issue - Total :", bill.issueTotalGross, sumAd(issueItems), bill.issueTotalLess, bill.issueTotalNet, bill.issueTotalFine)}

              {sectionRow("RECEIVE")}
              {receiveItems.map(itemRow)}
              {totalRow("Receive - Total :", bill.recvTotalGross, sumAd(receiveItems), bill.recvTotalLess, bill.recvTotalNet, bill.recvTotalFine)}

              {/* Bill Total (R = receive-heavy) */}
              <tr>
                <td style={tdGrand}></td>
                <td style={tdGrand}></td>
                <td colSpan={2} style={{ ...tdGrand, textAlign: "right", paddingRight: ph ? 4 : 8 }}>
                  Bill Total :
                </td>
                <td style={tdGrand}>{signed(bill.billTotalGross)}</td>
                <td style={tdGrand}>
                  {(() => {
                    const diff = sumAd(issueItems) - sumAd(receiveItems);
                    return diff < 0 ? `${Math.abs(diff).toFixed(3)} R` : diff > 0 ? diff.toFixed(3) : "";
                  })()}
                </td>
                <td style={tdGrand}>{signed(bill.billTotalLess)}</td>
                <td style={tdGrand}></td>
                <td style={tdGrand}>{signed(bill.billTotalNet)}</td>
                <td style={tdGrand}></td>
                <td style={tdGrand}></td>
                <td style={tdGrand}>{signed(bill.billTotalFine)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ===== FOOTER: CASH JAMA + FINE GOLD JAMA ===== */}
        <div style={{ display: "flex", gap: ph ? 6 : 12, alignItems: "stretch" }}>
          {card(
            "CASH JAMA (₹)",
            P_COIN,
            GREEN,
            "#e6f6ec",
            "#bfe3cb",
            "#e3f6e9",
            <>
              {fRow(
                cashLabel(prevCash, "Previous Advance (−)", "Previous Due (+)", "Previous Balance"),
                prevCash < -0.01 ? `−₹${Math.abs(prevCash).toFixed(2)}` : prevCash > 0.01 ? `+₹${prevCash.toFixed(2)}` : "₹0.00",
                prevCash < -0.01 ? GREEN : INK
              )}
              {fRow("This Bill Issue Cash (+)", issueCash > 0 ? `+₹${issueCash.toFixed(2)}` : "₹0.00", GREEN)}
              {fRow("Total Cash Due", `₹${totalCashDue.toFixed(2)}`, GREEN, true)}
              {fRow("Received Cash (−)", recvCash > 0 ? `−₹${recvCash.toFixed(2)}` : "₹0.00", GREEN)}
            </>,
            cashLabel(closingCash, "Closing Advance (Stock)", "Closing Due Cash", "Closing Cash"),
            closingCash < -0.01
              ? `₹${Math.abs(closingCash).toFixed(2)} Adv`
              : closingCash > 0.01
              ? `₹${closingCash.toFixed(2)} Due`
              : "₹0.00 (Cleared)"
          )}

          {card(
            "FINE GOLD JAMA (grams)",
            P_COIN,
            GOLD,
            "#fdf1d6",
            "#ecd9a8",
            "#fbe9bb",
            <>
              {fRow(
                prevFine < -0.0001 ? "Previous Advance (−)" : prevFine > 0.0001 ? "Previous Due (+)" : "Previous Balance",
                prevFine < -0.0001 ? `−${Math.abs(prevFine).toFixed(3)} g` : prevFine > 0.0001 ? `+${prevFine.toFixed(3)} g` : "0.000 g",
                prevFine < -0.0001 ? GREEN : INK
              )}
              {fRow("This Bill Issue (+)", `${issueFine > 0 ? `+${issueFine.toFixed(3)}` : "0.000"} g`, "#b45309")}
              {fRow("Total Fine Due", `${totalFineDue.toFixed(3)} g`, "#b45309", true)}
              {fRow("Received Fine (−)", `${recvFine > 0 ? `−${recvFine.toFixed(3)}` : "0.000"} g`, GREEN)}
            </>,
            closingFine < -0.0001 ? "Closing Advance (Stock)" : closingFine > 0.0001 ? "Closing Due Gold" : "Closing Fine Gold",
            closingFine < -0.0001
              ? `${Math.abs(closingFine).toFixed(3)} g Adv`
              : closingFine > 0.0001
              ? `${closingFine.toFixed(3)} g Due`
              : "0.000 g (Cleared)"
          )}
        </div>
      </div>
    </div>
  );
});

export default BillPrint;
