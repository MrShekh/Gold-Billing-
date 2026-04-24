"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import AuthGuard from "@/components/AuthGuard";
import { getDashboardStats, getBills, getCustomers } from "@/lib/db";
import type { Bill, Customer } from "@/lib/db";
import { Users, FileText, CalendarDays, PlusCircle, ArrowRight, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState({ totalCustomers: 0, totalBills: 0, todayBills: 0, totalJamaGold: 0, totalJamaCash: 0 });
  const [recentBills, setRecentBills] = useState<Bill[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const statsData = await getDashboardStats();
        setStats(statsData);
        
        const billsData = await getBills();
        const sortedBills = billsData.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setRecentBills(sortedBills.slice(0, 5));
        
        const customersData = await getCustomers();
        const sortedCustomers = customersData.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setRecentCustomers(sortedCustomers.slice(0, 5));
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      }
    }
    fetchData();
  }, []);

  function fmtDate(d: string) {
    if (!d) return "-";
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  }

  return (
    <AuthGuard>
      <div style={{ display: "flex" }}>
        <Sidebar />
        <div className="main-layout" style={{ flex: 1 }}>
          <div className="page-header">
            <h2>Dashboard</h2>
            <p>Overview of your billing activity</p>
          </div>
          <div className="page-content">
            {/* Stat Cards */}
            <div className="grid-3 mb-4">
              <div className="stat-card">
                <div className="flex-between mb-2"><span className="stat-label">Total Customers</span><div className="stat-icon"><Users size={18} /></div></div>
                <div className="stat-value">{stats.totalCustomers}</div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>Registered accounts</p>
              </div>
              <div className="stat-card">
                <div className="flex-between mb-2"><span className="stat-label">Total Bills</span><div className="stat-icon"><FileText size={18} /></div></div>
                <div className="stat-value">{stats.totalBills}</div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>All time created</p>
              </div>
              <div className="stat-card">
                <div className="flex-between mb-2"><span className="stat-label">Today&apos;s Bills</span><div className="stat-icon"><CalendarDays size={18} /></div></div>
                <div className="stat-value">{stats.todayBills}</div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>Created today</p>
              </div>
            </div>

            <div className="grid-2 mb-4">
              <div className="stat-card" style={{ borderColor: "rgba(212,168,67,0.3)" }}>
                <div className="flex-between mb-2"><span className="stat-label" style={{ color: "var(--accent)" }}>Total Gold Jama</span><div className="stat-icon"><TrendingUp size={18} /></div></div>
                <div className="stat-value" style={{ fontSize: 32 }}>{stats.totalJamaGold.toFixed(3)} g</div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>Outstanding across all customers</p>
              </div>
              <div className="stat-card" style={{ borderColor: "rgba(76,175,125,0.3)" }}>
                <div className="flex-between mb-2"><span className="stat-label" style={{ color: "var(--success)" }}>Total Cash Jama</span><div className="stat-icon" style={{ color: "var(--success)", background: "rgba(76,175,125,0.15)", borderColor: "rgba(76,175,125,0.3)" }}>₹</div></div>
                <div className="stat-value" style={{ fontSize: 32, color: "var(--success)" }}>₹{stats.totalJamaCash.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>Outstanding across all customers</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ background: "linear-gradient(135deg, rgba(212,168,67,0.12), rgba(212,168,67,0.03))", border: "1px solid rgba(212,168,67,0.3)", borderRadius: 14, padding: "20px 24px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--accent)" }}>⚜ Quick Actions</h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>Get started quickly</p>
              </div>
              <div className="flex gap-3">
                <Link href="/customers" className="btn btn-secondary btn-sm"><Users size={14} /> Add Customer</Link>
                <Link href="/bills/new" className="btn btn-primary btn-sm"><PlusCircle size={14} /> Create Bill</Link>
              </div>
            </div>

            {/* Recent Sections */}
            <div className="grid-2" style={{ gap: 20 }}>
              <div className="form-card" style={{ padding: 0, overflow: "hidden" }}>
                <div className="flex-between" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                  <div className="flex-center gap-2"><FileText size={16} style={{ color: "var(--accent)" }} /><span style={{ fontWeight: 700, fontSize: 15 }}>Recent Bills</span></div>
                  <Link href="/bills" className="btn btn-xs btn-secondary" style={{ display: "flex", alignItems: "center", gap: 4 }}>View All <ArrowRight size={12} /></Link>
                </div>
                {recentBills.length === 0 ? (
                  <div className="empty-state" style={{ padding: 32 }}><TrendingUp /><h3>No bills yet</h3><p>Create your first bill</p></div>
                ) : (
                  <div className="table-responsive">
                    <table className="data-table"><thead><tr><th>Voucher</th><th>Customer</th><th>Date</th></tr></thead>
                      <tbody>{recentBills.map(b => (
                        <tr key={b.id} style={{ cursor: "pointer" }} onClick={() => (window.location.href = `/bills/view?id=${b.id}`)}>
                          <td><span className="badge badge-gold">{b.voucherNo}</span></td>
                          <td style={{ fontWeight: 600 }}>{b.customerName}</td>
                          <td style={{ color: "var(--text-muted)", fontSize: 13 }}>{fmtDate(b.date)}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="form-card" style={{ padding: 0, overflow: "hidden" }}>
                <div className="flex-between" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                  <div className="flex-center gap-2"><Users size={16} style={{ color: "var(--accent)" }} /><span style={{ fontWeight: 700, fontSize: 15 }}>Recent Customers</span></div>
                  <Link href="/customers" className="btn btn-xs btn-secondary" style={{ display: "flex", alignItems: "center", gap: 4 }}>View All <ArrowRight size={12} /></Link>
                </div>
                {recentCustomers.length === 0 ? (
                  <div className="empty-state" style={{ padding: 32 }}><Users /><h3>No customers yet</h3><p>Add your first customer</p></div>
                ) : (
                  <div className="table-responsive">
                    <table className="data-table"><thead><tr><th>Name</th><th>Phone</th></tr></thead>
                      <tbody>{recentCustomers.map(c => (
                        <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => (window.location.href = `/customers`)}>
                          <td style={{ fontWeight: 600 }}>{c.name}</td>
                          <td style={{ color: "var(--text-muted)", fontSize: 13 }}>{c.phone}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

