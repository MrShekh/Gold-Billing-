"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import AuthGuard from "@/components/AuthGuard";
import {
  getCustomers,
  getAllCustomerBalances,
  getBills,
  getDashboardStats,
  type Customer,
  type CustomerBalance,
  type Bill,
} from "@/lib/db";
import {
  Scale,
  Package,
  Users,
  Search,
  PlusCircle,
  BookOpen,
  Phone,
  TrendingUp,
  Coins,
} from "lucide-react";

export default function AdvanceStockPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [balances, setBalances] = useState<Record<string, CustomerBalance>>({});
  const [bills, setBills] = useState<Bill[]>([]);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalBills: 0,
    todayBills: 0,
    totalJamaGold: 0,
    totalJamaCash: 0,
    totalAdvanceGold: 0,
    totalAdvanceCash: 0,
    advanceCustomerCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "GOLD" | "CASH">("ALL");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [custData, balData, billsData, statsData] = await Promise.all([
          getCustomers(),
          getAllCustomerBalances(),
          getBills(),
          getDashboardStats(),
        ]);
        setCustomers(custData);
        setBills(billsData);
        setStats(statsData as typeof stats);

        const balMap: Record<string, CustomerBalance> = {};
        for (const b of balData) {
          balMap[b.customer_id] = b;
        }
        setBalances(balMap);
      } catch (err) {
        console.error("Failed to load advance stock", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Filter customers who hold advance gold or advance cash
  const advanceCustomers = customers.filter((c) => {
    const bal = balances[c.id];
    if (!bal) return false;
    const hasGoldAdv = (bal.fine_gold_balance ?? 0) < -0.0001;
    const hasCashAdv = (bal.cash_balance ?? 0) < -0.01;

    if (filterType === "GOLD") return hasGoldAdv;
    if (filterType === "CASH") return hasCashAdv;
    return hasGoldAdv || hasCashAdv;
  });

  const filtered = advanceCustomers.filter((c) => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q);
  });

  // Calculate live totals from filtered/found customers
  let totalStockGold = 0;
  let totalStockCash = 0;
  for (const c of advanceCustomers) {
    const bal = balances[c.id];
    if (bal) {
      if (bal.fine_gold_balance < -0.0001) totalStockGold += Math.abs(bal.fine_gold_balance);
      if (bal.cash_balance < -0.01) totalStockCash += Math.abs(bal.cash_balance);
    }
  }

  function getCustomerBillCount(cid: string) {
    return bills.filter((b) => b.customerId === cid).length;
  }

  return (
    <AuthGuard>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <div className="main-layout" style={{ flex: 1, width: "100%" }}>
          {/* Header */}
          <div className="page-header" style={{ borderBottom: "1px solid var(--border)", padding: "20px 32px" }}>
            <div className="flex-between" style={{ flexWrap: "wrap", gap: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 24 }}>⚜</span>
                  <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "var(--text-primary)" }}>
                    Advance Stock
                  </h1>
                </div>
                <p style={{ marginTop: 4, color: "var(--text-secondary)", fontSize: 13 }}>
                  Overview of advance fine gold and cash held from customers (auto-deducted on future bills)
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/bills/new"
                  className="btn btn-primary"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: 13 }}
                >
                  <PlusCircle size={15} /> Create Bill
                </Link>
              </div>
            </div>
          </div>

          <div className="page-content" style={{ width: "100%", padding: "24px 32px" }}>
            {/* KPI Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 16,
                marginBottom: 24,
              }}
            >
              {/* 1. Total Advance Gold Stock */}
              <div
                className="stat-card"
                style={{
                  background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))",
                  borderColor: "rgba(16,185,129,0.35)",
                }}
              >
                <div className="flex-between mb-2">
                  <span className="stat-label" style={{ color: "var(--success)" }}>
                    Advance Gold Stock
                  </span>
                  <div
                    className="stat-icon"
                    style={{
                      color: "var(--success)",
                      background: "rgba(16,185,129,0.15)",
                      borderColor: "rgba(16,185,129,0.3)",
                    }}
                  >
                    <Scale size={18} />
                  </div>
                </div>
                <div className="stat-value" style={{ fontSize: 32, color: "var(--success)" }}>
                  {totalStockGold.toFixed(3)} <span style={{ fontSize: 18, fontWeight: 700 }}>g</span>
                </div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
                  Customer gold deposited in advance
                </p>
              </div>

              {/* 2. Total Advance Cash Stock */}
              <div
                className="stat-card"
                style={{
                  background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))",
                  borderColor: "rgba(16,185,129,0.35)",
                }}
              >
                <div className="flex-between mb-2">
                  <span className="stat-label" style={{ color: "var(--success)" }}>
                    Advance Cash Held
                  </span>
                  <div
                    className="stat-icon"
                    style={{
                      color: "var(--success)",
                      background: "rgba(16,185,129,0.15)",
                      borderColor: "rgba(16,185,129,0.3)",
                    }}
                  >
                    <Coins size={18} />
                  </div>
                </div>
                <div className="stat-value" style={{ fontSize: 30, color: "var(--success)" }}>
                  ₹{totalStockCash.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
                  Customer cash advance payments
                </p>
              </div>

              {/* 3. Customer Count */}
              <div className="stat-card">
                <div className="flex-between mb-2">
                  <span className="stat-label">Advance Accounts</span>
                  <div className="stat-icon">
                    <Users size={18} />
                  </div>
                </div>
                <div className="stat-value">{advanceCustomers.length}</div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
                  Customers holding advance credit
                </p>
              </div>

              {/* 4. Comparison: Outstanding Gold Due */}
              <div className="stat-card" style={{ borderColor: "rgba(212,168,67,0.3)" }}>
                <div className="flex-between mb-2">
                  <span className="stat-label" style={{ color: "var(--accent)" }}>
                    Pending Gold Due
                  </span>
                  <div className="stat-icon">
                    <TrendingUp size={18} />
                  </div>
                </div>
                <div className="stat-value" style={{ fontSize: 30 }}>
                  {(stats.totalJamaGold || 0).toFixed(3)} g
                </div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
                  Receivable from owing customers
                </p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
                marginBottom: 16,
              }}
            >
              <div className="search-bar" style={{ flex: 1, minWidth: 260 }}>
                <Search className="search-icon" />
                <input
                  placeholder="Search advance accounts by customer name or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className={`btn btn-sm ${filterType === "ALL" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setFilterType("ALL")}
                >
                  All ({advanceCustomers.length})
                </button>
                <button
                  className={`btn btn-sm ${filterType === "GOLD" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setFilterType("GOLD")}
                >
                  Gold Advance
                </button>
                <button
                  className={`btn btn-sm ${filterType === "CASH" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setFilterType("CASH")}
                >
                  Cash Advance
                </button>
              </div>
            </div>

            {/* Advance Customers Table */}
            <div className="form-card" style={{ padding: 0, overflow: "hidden" }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
                  Loading advance stock details...
                </div>
              ) : filtered.length === 0 ? (
                <div className="empty-state" style={{ padding: 48 }}>
                  <Package size={36} style={{ color: "var(--text-muted)", marginBottom: 12 }} />
                  <h3>No advance stock found</h3>
                  <p>
                    {search
                      ? "No customers match your search."
                      : "When a customer pays extra gold or cash on a bill, their advance stock will automatically be tracked here and deducted on their next bill."}
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Customer Name</th>
                        <th>Phone</th>
                        <th>Advance Fine Gold</th>
                        <th>Advance Cash</th>
                        <th>Bills</th>
                        <th>Quick Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((c, idx) => {
                        const bal = balances[c.id];
                        const goldAdv = bal && bal.fine_gold_balance < -0.0001 ? Math.abs(bal.fine_gold_balance) : 0;
                        const cashAdv = bal && bal.cash_balance < -0.01 ? Math.abs(bal.cash_balance) : 0;

                        return (
                          <tr key={c.id}>
                            <td style={{ color: "var(--text-muted)", fontSize: 13 }}>{idx + 1}</td>
                            <td>
                              <Link
                                href={`/customers/${c.id}`}
                                style={{
                                  fontWeight: 800,
                                  fontSize: 15,
                                  color: "var(--text-primary)",
                                  textDecoration: "none",
                                }}
                                className="customer-ledger-link"
                              >
                                {c.name}
                              </Link>
                              {c.address && (
                                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                                  {c.address}
                                </div>
                              )}
                            </td>
                            <td>
                              <div
                                className="flex-center gap-2"
                                style={{ color: "var(--text-secondary)", fontSize: 13 }}
                              >
                                <Phone size={13} /> {c.phone}
                              </div>
                            </td>
                            <td>
                              {goldAdv > 0 ? (
                                <span
                                  className="badge"
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 800,
                                    fontFamily: "monospace",
                                    background: "rgba(16,185,129,0.15)",
                                    color: "#10b981",
                                    border: "1px solid rgba(16,185,129,0.3)",
                                    padding: "4px 10px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                  }}
                                >
                                  <Scale size={13} />
                                  {goldAdv.toFixed(3)} g Adv
                                </span>
                              ) : (
                                <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
                              )}
                            </td>
                            <td>
                              {cashAdv > 0 ? (
                                <span
                                  className="badge"
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 800,
                                    fontFamily: "monospace",
                                    background: "rgba(16,185,129,0.15)",
                                    color: "#10b981",
                                    border: "1px solid rgba(16,185,129,0.3)",
                                    padding: "4px 10px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                  }}
                                >
                                  ₹{cashAdv.toLocaleString("en-IN", { minimumFractionDigits: 2 })} Adv
                                </span>
                              ) : (
                                <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
                              )}
                            </td>
                            <td>
                              <span className="badge badge-gold">
                                {getCustomerBillCount(c.id)} bill{getCustomerBillCount(c.id) !== 1 ? "s" : ""}
                              </span>
                            </td>
                            <td>
                              <div className="flex gap-2">
                                <Link
                                  href={`/bills/new?customerId=${c.id}`}
                                  className="btn btn-xs btn-primary"
                                  title="Create Bill (Deduct Advance)"
                                  style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                                >
                                  <PlusCircle size={12} /> Use in Bill
                                </Link>
                                <Link
                                  href={`/customers/${c.id}`}
                                  className="btn btn-xs btn-secondary"
                                  title="View Customer Ledger"
                                  style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                                >
                                  <BookOpen size={12} /> Ledger
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
