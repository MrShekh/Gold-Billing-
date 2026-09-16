"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import {
  getCustomerById,
  getCustomerBalance,
  getBillsByCustomer,
  recordPayment,
  type Customer,
  type CustomerBalance,
  type Bill,
} from "@/lib/db";
import {
  ArrowLeft,
  Scale,
  CreditCard,
  PlusCircle,
  Eye,
  Printer,
  Phone,
  MapPin,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";

function fmtDate(d: string) {
  if (!d) return "—";
  const parts = d.split("-");
  if (parts.length === 3) {
    const [y, m, day] = parts;
    return `${day}/${m}/${y}`;
  }
  return d;
}

export default function CustomerLedgerPage() {
  const params = useParams();
  const customerId = (params?.id as string) || "";

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [balance, setBalance] = useState<CustomerBalance | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [expandedBills, setExpandedBills] = useState<Record<string, boolean>>({});

  // Payment modal state
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payGold, setPayGold] = useState("");
  const [payCash, setPayCash] = useState("");
  const [payLoading, setPayLoading] = useState(false);

  async function loadData() {
    if (!customerId) return;
    setLoading(true);
    try {
      const [cust, bal, customerBills] = await Promise.all([
        getCustomerById(customerId),
        getCustomerBalance(customerId),
        getBillsByCustomer(customerId),
      ]);
      setCustomer(cust ?? null);
      setBalance(bal ?? null);
      setBills(customerBills ?? []);

      // Expand all bills by default for immediate visibility
      if (customerBills && customerBills.length > 0) {
        const initial: Record<string, boolean> = {};
        customerBills.forEach((b) => {
          initial[b.id] = true;
        });
        setExpandedBills(initial);
      }
    } catch (err) {
      console.error("Failed to load customer ledger", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [customerId]);

  const sortedBills = useMemo(() => {
    return [...bills].sort((a, b) => {
      const timeA = new Date(a.createdAt || a.date).getTime();
      const timeB = new Date(b.createdAt || b.date).getTime();
      return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
    });
  }, [bills, sortOrder]);

  const stats = useMemo(() => {
    let totalFineIssued = 0;
    let totalFineReceived = 0;
    for (const b of bills) {
      totalFineIssued += parseFloat(b.issueTotalFine || "0") || 0;
      totalFineReceived += parseFloat(b.recvTotalFine || "0") || 0;
    }
    return {
      totalFineIssued,
      totalFineReceived,
      billCount: bills.length,
    };
  }, [bills]);

  function toggleExpand(id: string) {
    setExpandedBills((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleAll(expand: boolean) {
    const next: Record<string, boolean> = {};
    for (const b of bills) {
      next[b.id] = expand;
    }
    setExpandedBills(next);
  }

  async function handleRecordPayment() {
    if (!customerId) return;
    const gold = parseFloat(payGold) || 0;
    const cash = parseFloat(payCash) || 0;
    if (gold <= 0 && cash <= 0) return;

    setPayLoading(true);
    try {
      await recordPayment(customerId, gold, cash);
      setPayGold("");
      setPayCash("");
      setPayModalOpen(false);
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setPayLoading(false);
    }
  }

  const currentGoldDue = balance ? balance.fine_gold_balance : 0;
  const currentCashDue = balance ? balance.cash_balance : 0;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div className="main-layout" style={{ flex: 1, width: "100%" }}>
        {/* Full-width Top Header */}
        <div className="page-header" style={{ borderBottom: "1px solid var(--border)", padding: "20px 32px" }}>
          <div className="flex-between" style={{ flexWrap: "wrap", gap: 16 }}>
            <div className="flex items-center gap-3">
              <Link
                href="/customers"
                className="btn btn-secondary"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 6, padding: "8px 14px", fontSize: 13 }}
              >
                <ArrowLeft size={16} /> Back
              </Link>
              <div>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "var(--text-primary)" }}>
                  {customer ? customer.name : "Customer"}
                  <span style={{ fontSize: 16, fontWeight: 500, color: "var(--text-muted)", marginLeft: 10 }}>
                    Account Statement &amp; Ledger
                  </span>
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                className="btn btn-secondary"
                onClick={() => window.print()}
                style={{ padding: "8px 16px", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Printer size={15} /> Print Ledger
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setPayModalOpen(true)}
                style={{ padding: "8px 16px", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Scale size={15} /> Settle / Payment
              </button>
              {customerId && (
                <Link
                  href={`/bills/new?customerId=${customerId}`}
                  className="btn btn-primary"
                  style={{ padding: "8px 18px", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <PlusCircle size={15} /> New Bill
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Full-width Content Area */}
        <div className="page-content" style={{ width: "100%", padding: "24px 32px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-secondary)", fontSize: 16 }}>
              Loading ledger details...
            </div>
          ) : !customer ? (
            <div className="card" style={{ textAlign: "center", padding: 40 }}>
              <h3 style={{ fontSize: 18 }}>Customer not found</h3>
              <Link href="/customers" className="btn btn-primary" style={{ marginTop: 16 }}>
                Back to Customers
              </Link>
            </div>
          ) : (
            <>
              {/* Full-width 3 Overview Cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: 16,
                  marginBottom: 24,
                  width: "100%",
                }}
              >
                {/* 1. Customer Info */}
                <div
                  className="card"
                  style={{
                    padding: "20px 24px",
                    borderRadius: 10,
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Customer Details
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6, color: "var(--text-primary)" }}>
                    {customer.name}
                  </div>
                  <div style={{ marginTop: 12, fontSize: 14, color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: 6 }}>
                    {customer.phone && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Phone size={15} style={{ color: "var(--accent)" }} />
                        <a href={`tel:${customer.phone}`} style={{ color: "var(--text-primary)", textDecoration: "none", fontWeight: 600 }}>
                          {customer.phone}
                        </a>
                      </div>
                    )}
                    {customer.address && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <MapPin size={15} style={{ color: "var(--accent)" }} />
                        <span style={{ color: "var(--text-secondary)" }}>{customer.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Fine Gold Balance */}
                <div
                  className="card"
                  style={{
                    padding: "20px 24px",
                    borderRadius: 10,
                    background: "var(--bg-card)",
                    border: currentGoldDue < -0.0001
                      ? "1px solid rgba(16,185,129,0.35)"
                      : currentGoldDue > 0.0001
                      ? "1px solid rgba(184,134,11,0.35)"
                      : "1px solid var(--border)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {currentGoldDue < -0.0001 ? "Advance Gold (In Stock)" : "Fine Gold Balance (Due)"}
                    </span>
                    <Scale size={18} style={{ color: currentGoldDue < -0.0001 ? "var(--success)" : "var(--accent)" }} />
                  </div>
                  <div
                    style={{
                      fontSize: 32,
                      fontWeight: 800,
                      fontFamily: "monospace",
                      marginTop: 8,
                      color: currentGoldDue < -0.0001 ? "var(--success)" : currentGoldDue > 0.0001 ? "var(--accent)" : "var(--success)",
                    }}
                  >
                    {currentGoldDue < -0.0001
                      ? `${Math.abs(currentGoldDue).toFixed(3)}`
                      : currentGoldDue.toFixed(3)}{" "}
                    <span style={{ fontSize: 18, fontWeight: 700 }}>g</span>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-muted)" }}>
                    {currentGoldDue < -0.0001 ? (
                      <span style={{ color: "var(--success)", fontWeight: 600 }}>● Advance gold deposited by customer</span>
                    ) : currentGoldDue > 0.0001 ? (
                      <span style={{ color: "var(--accent)", fontWeight: 600 }}>● Outstanding to receive</span>
                    ) : (
                      <span style={{ color: "var(--success)", fontWeight: 600 }}>✓ All accounts cleared</span>
                    )}
                  </div>
                </div>

                {/* 3. Cash Balance & Summary */}
                <div
                  className="card"
                  style={{
                    padding: "20px 24px",
                    borderRadius: 10,
                    background: "var(--bg-card)",
                    border: currentCashDue < -0.01
                      ? "1px solid rgba(16,185,129,0.35)"
                      : currentCashDue > 0.01
                      ? "1px solid rgba(184,134,11,0.35)"
                      : "1px solid var(--border)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {currentCashDue < -0.01 ? "Advance Cash (Deposit)" : "Cash Balance (Due)"}
                    </span>
                    <CreditCard size={18} style={{ color: "var(--info)" }} />
                  </div>
                  <div style={{
                    fontSize: 30,
                    fontWeight: 800,
                    fontFamily: "monospace",
                    marginTop: 8,
                    color: currentCashDue < -0.01 ? "var(--success)" : "var(--text-primary)"
                  }}>
                    {currentCashDue < -0.01
                      ? `₹ ${Math.abs(currentCashDue).toFixed(2)} (Adv)`
                      : `₹ ${currentCashDue.toFixed(2)}`}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                    <strong style={{ color: "var(--text-primary)" }}>{stats.billCount}</strong> Bill{stats.billCount === 1 ? "" : "s"} &nbsp;•&nbsp;
                    Issued: <strong style={{ color: "var(--accent)" }}>{stats.totalFineIssued.toFixed(3)}g</strong> &nbsp;•&nbsp;
                    Recv: <strong style={{ color: "var(--success)" }}>{stats.totalFineReceived.toFixed(3)}g</strong>
                  </div>
                </div>
              </div>

              {/* Subheader & Controls */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 0 16px",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>
                  Transaction History ({bills.length})
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="btn btn-secondary"
                    onClick={() => toggleAll(true)}
                    style={{ fontSize: 13, padding: "6px 14px" }}
                  >
                    Expand All
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => toggleAll(false)}
                    style={{ fontSize: 13, padding: "6px 14px" }}
                  >
                    Collapse All
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                    style={{ fontSize: 13, padding: "6px 14px" }}
                  >
                    Order: {sortOrder === "desc" ? "Newest First ↓" : "Oldest First ↑"}
                  </button>
                </div>
              </div>

              {/* Bills List — Full Screen Cards */}
              {sortedBills.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: 48, borderRadius: 10 }}>
                  <p style={{ color: "var(--text-muted)", fontSize: 15 }}>No bills recorded yet for this customer.</p>
                  <Link
                    href={`/bills/new?customerId=${customerId}`}
                    className="btn btn-primary"
                    style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 6 }}
                  >
                    <PlusCircle size={15} /> Create First Bill
                  </Link>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
                  {sortedBills.map((bill) => {
                    const isExpanded = !!expandedBills[bill.id];
                    const prevFine = parseFloat(bill.prevFineGold || "0") || 0;
                    const issueFine = parseFloat(bill.issueTotalFine || "0") || 0;
                    const recvFine = parseFloat(bill.recvTotalFine || "0") || 0;
                    const netFine = issueFine - recvFine;
                    const closingFine =
                      bill.closingFineGold !== undefined && bill.closingFineGold !== null
                        ? parseFloat(bill.closingFineGold) || 0
                        : prevFine + netFine;

                    const allItems = bill.items || [];

                    return (
                      <div
                        key={bill.id}
                        className="card"
                        style={{
                          padding: 0,
                          borderRadius: 10,
                          border: "1px solid var(--border)",
                          overflow: "hidden",
                          background: "var(--bg-card)",
                          width: "100%",
                        }}
                      >
                        {/* Bill Header Bar */}
                        <div
                          style={{
                            padding: "14px 22px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: 12,
                            cursor: "pointer",
                            background: "var(--bg-secondary)",
                            borderBottom: isExpanded ? "1px solid var(--border)" : "none",
                          }}
                          onClick={() => toggleExpand(bill.id)}
                        >
                          {/* Left: Voucher & Date */}
                          <div className="flex items-center gap-4">
                            <span style={{ fontWeight: 800, fontSize: 16, color: "var(--text-primary)", letterSpacing: "0.3px" }}>
                              {bill.voucherNo}
                            </span>
                            <span style={{ fontSize: 14, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
                              <Calendar size={14} style={{ color: "var(--text-muted)" }} />
                              {fmtDate(bill.date)} {bill.time ? `• ${bill.time}` : ""}
                            </span>
                          </div>

                          {/* Right: Clean summary values & actions */}
                          <div className="flex items-center gap-5">
                            {/* Summary numbers strip */}
                            <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 14 }}>
                              <span style={{ color: "var(--text-muted)" }}>
                                Prev: <strong style={{
                                  color: prevFine < -0.0001 ? "var(--success)" : "var(--text-primary)",
                                  fontFamily: "monospace",
                                  fontSize: 14
                                }}>
                                  {prevFine < -0.0001
                                    ? `${Math.abs(prevFine).toFixed(3)}g (Adv)`
                                    : `${prevFine.toFixed(3)}g`}
                                </strong>
                              </span>
                              {issueFine > 0 && (
                                <span style={{ color: "var(--accent)" }}>
                                  Issue: <strong style={{ fontFamily: "monospace", fontSize: 14 }}>+{issueFine.toFixed(3)}g</strong>
                                </span>
                              )}
                              {recvFine > 0 && (
                                <span style={{ color: "var(--success)" }}>
                                  Recv: <strong style={{ fontFamily: "monospace", fontSize: 14 }}>−{recvFine.toFixed(3)}g</strong>
                                </span>
                              )}
                              <span
                                style={{
                                  fontWeight: 800,
                                  fontSize: 15,
                                  color: closingFine < -0.0001 ? "var(--success)" : "var(--accent)",
                                  background: closingFine < -0.0001 ? "rgba(16,185,129,0.12)" : "rgba(184,134,11,0.1)",
                                  padding: "4px 10px",
                                  borderRadius: 6,
                                  border: `1px solid ${closingFine < -0.0001 ? "rgba(16,185,129,0.3)" : "rgba(184,134,11,0.25)"}`,
                                }}
                              >
                                {closingFine < -0.0001
                                  ? <>Advance After Bill: <strong style={{ fontFamily: "monospace", fontSize: 16 }}>{Math.abs(closingFine).toFixed(3)} g (Adv)</strong></>
                                  : closingFine > 0.0001
                                  ? <>Due After Bill: <strong style={{ fontFamily: "monospace", fontSize: 16 }}>{closingFine.toFixed(3)} g</strong></>
                                  : <>Balance: <strong style={{ fontFamily: "monospace", fontSize: 16 }}>0.000 g</strong> <span style={{ marginLeft: 6, fontSize: 12, color: "var(--success)", fontWeight: 700 }}>(Settled ✓)</span></>}
                              </span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Link
                                href={`/bills/view?id=${bill.id}`}
                                className="btn btn-secondary"
                                title="View Bill"
                                style={{ padding: "6px 10px", fontSize: 13 }}
                              >
                                <Eye size={15} />
                              </Link>
                              <Link
                                href={`/bills/view?id=${bill.id}`}
                                className="btn btn-secondary"
                                title="Print Bill"
                                style={{ padding: "6px 10px", fontSize: 13 }}
                              >
                                <Printer size={15} />
                              </Link>
                              <button
                                className="btn btn-secondary"
                                onClick={() => toggleExpand(bill.id)}
                                style={{ padding: "6px 10px" }}
                              >
                                {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Collapsible Clean Item Breakdown */}
                        {isExpanded && (
                          <div style={{ padding: "16px 22px" }}>
                            {allItems.length === 0 ? (
                              <div style={{ fontSize: 14, color: "var(--text-muted)", fontStyle: "italic", padding: "8px 0" }}>
                                No item details in this bill.
                              </div>
                            ) : (
                              <div style={{ overflowX: "auto" }}>
                                <table
                                  style={{
                                    width: "100%",
                                    fontSize: 14,
                                    borderCollapse: "collapse",
                                  }}
                                >
                                  <thead>
                                    <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)", textAlign: "left" }}>
                                      <th style={{ padding: "8px 12px", fontWeight: 700, width: 110 }}>Type</th>
                                      <th style={{ padding: "8px 12px", fontWeight: 700 }}>Item Name</th>
                                      <th style={{ padding: "8px 12px", fontWeight: 700, textAlign: "right" }}>Gross Wt</th>
                                      <th style={{ padding: "8px 12px", fontWeight: 700, textAlign: "right" }}>Net Wt</th>
                                      <th style={{ padding: "8px 12px", fontWeight: 700, textAlign: "right" }}>Touch</th>
                                      <th style={{ padding: "8px 12px", fontWeight: 700, textAlign: "right" }}>Fine Gold</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {allItems.map((item, idx) => {
                                      const isIssue = item.type === "ISSUE";
                                      return (
                                        <tr
                                          key={idx}
                                          style={{
                                            borderBottom: "1px solid rgba(0,0,0,0.05)",
                                          }}
                                        >
                                          <td style={{ padding: "10px 12px" }}>
                                            <span
                                              style={{
                                                fontSize: 12,
                                                fontWeight: 700,
                                                padding: "3px 8px",
                                                borderRadius: 4,
                                                background: isIssue ? "rgba(184,134,11,0.12)" : "rgba(16,185,129,0.12)",
                                                color: isIssue ? "var(--accent)" : "var(--success)",
                                              }}
                                            >
                                              {isIssue ? "ISSUE" : "RECEIVE"}
                                            </span>
                                          </td>
                                          <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--text-primary)" }}>
                                            {item.itemName}
                                          </td>
                                          <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "monospace", fontSize: 14, color: "var(--text-secondary)" }}>
                                            {item.grossWeight ? `${parseFloat(item.grossWeight).toFixed(3)} g` : "—"}
                                          </td>
                                          <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "monospace", fontSize: 14, color: "var(--text-secondary)" }}>
                                            {item.netWeight ? `${parseFloat(item.netWeight).toFixed(3)} g` : "—"}
                                          </td>
                                          <td style={{ padding: "10px 12px", textAlign: "right", fontSize: 14, color: "var(--text-secondary)" }}>
                                            {item.tunch ? `${item.tunch}%` : "—"}
                                          </td>
                                          <td
                                            style={{
                                              padding: "10px 12px",
                                              textAlign: "right",
                                              fontFamily: "monospace",
                                              fontWeight: 800,
                                              fontSize: 15,
                                              color: isIssue ? "var(--accent)" : "var(--success)",
                                            }}
                                          >
                                            {isIssue ? "+" : "−"}{parseFloat(item.fineGold || "0").toFixed(3)} g
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                  <tfoot>
                                    <tr style={{ borderTop: "2px solid var(--border)", fontSize: 14 }}>
                                      <td colSpan={2} style={{ padding: "12px 12px 6px", color: "var(--text-muted)" }}>
                                        Prev: <strong style={{ color: "var(--text-primary)", fontFamily: "monospace" }}>{prevFine.toFixed(3)}g</strong> &nbsp;•&nbsp;
                                        Net Change: <strong style={{ color: netFine >= 0 ? "var(--accent)" : "var(--success)", fontFamily: "monospace" }}>{netFine >= 0 ? `+${netFine.toFixed(3)}` : netFine.toFixed(3)}g</strong>
                                      </td>
                                      <td colSpan={4} style={{ padding: "12px 12px 6px", textAlign: "right", fontWeight: 700 }}>
                                        Balance After Bill: <span style={{ color: "var(--accent)", fontFamily: "monospace", fontSize: 17, fontWeight: 800 }}>{closingFine.toFixed(3)} g</span>
                                        {currentGoldDue <= 0.0001 && (
                                          <span style={{ marginLeft: 8, fontSize: 13, color: "var(--success)", fontWeight: 700 }}>
                                            (Settled ✓)
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Settle / Payment Modal */}
      {payModalOpen && (
        <div className="modal-overlay" onClick={() => setPayModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420, borderRadius: 10, padding: 24 }}>
            <div className="flex-between" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>
                Settle / Record Payment
              </div>
              <button
                className="btn btn-secondary btn-xs"
                onClick={() => setPayModalOpen(false)}
                style={{ padding: "4px 8px" }}
              >
                <X size={15} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label className="form-label" style={{ fontSize: 13, marginBottom: 6, fontWeight: 600 }}>
                  Fine Gold Received (g) &nbsp;•&nbsp; Due: <strong style={{ color: "var(--accent)" }}>{currentGoldDue.toFixed(3)} g</strong>
                </label>
                <input
                  type="number"
                  step="0.001"
                  className="form-input"
                  placeholder="e.g. 1.000"
                  value={payGold}
                  onChange={(e) => setPayGold(e.target.value)}
                  style={{ fontSize: 14, padding: "10px 12px" }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: 13, marginBottom: 6, fontWeight: 600 }}>
                  Cash Received (₹) &nbsp;•&nbsp; Due: <strong>₹ {currentCashDue.toFixed(2)}</strong>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="e.g. 5000"
                  value={payCash}
                  onChange={(e) => setPayCash(e.target.value)}
                  style={{ fontSize: 14, padding: "10px 12px" }}
                />
              </div>

              <div className="flex gap-3" style={{ marginTop: 10 }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, padding: "10px", fontSize: 14, fontWeight: 600 }}
                  onClick={handleRecordPayment}
                  disabled={payLoading}
                >
                  {payLoading ? "Saving..." : "Save Payment"}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setPayModalOpen(false)}
                  style={{ padding: "10px 18px", fontSize: 14 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
