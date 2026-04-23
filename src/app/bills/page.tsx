"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { getBills, deleteBill, type Bill } from "@/lib/db";
import { PlusCircle, Search, Printer, Trash2, Eye, FileText } from "lucide-react";

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [filtered, setFiltered] = useState<Bill[]>([]);
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  async function load() {
    try {
      const allData = await getBills();
      const all = allData.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setBills(all);
      setFiltered(all);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      bills.filter(
        (b) =>
          b.voucherNo.toLowerCase().includes(q) ||
          b.customerName.toLowerCase().includes(q) ||
          b.date.includes(q)
      )
    );
  }, [search, bills]);

  async function handleDelete(id: string) {
    await deleteBill(id);
    setDeleteConfirm(null);
    load();
  }

  function fmtDate(d: string) {
    if (!d) return "-";
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  }

  function getBillSummary(b: Bill) {
    const issue = b.items.filter((i) => i.type === "ISSUE").length;
    const receive = b.items.filter((i) => i.type === "RECEIVE").length;
    return `${issue} issue, ${receive} receive`;
  }

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div className="main-layout" style={{ flex: 1 }}>
        <div className="page-header">
          <div className="flex-between" style={{ paddingBottom: 20 }}>
            <div>
              <h2>Bills</h2>
              <p style={{ marginTop: 4 }}>
                {bills.length} bill{bills.length !== 1 ? "s" : ""} created
              </p>
            </div>
            <Link href="/bills/new" className="btn btn-primary">
              <PlusCircle size={15} /> New Bill
            </Link>
          </div>
        </div>

        <div className="page-content">
          {/* Search */}
          <div className="search-bar mb-3">
            <Search className="search-icon" />
            <input
              placeholder="Search by voucher no, customer, or date..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Table */}
          <div className="form-card" style={{ padding: 0, overflow: "hidden" }}>
            {filtered.length === 0 ? (
              <div className="empty-state">
                <FileText />
                <h3>No bills found</h3>
                <p>Create your first bill to get started</p>
                <div style={{ marginTop: 16 }}>
                  <Link href="/bills/new" className="btn btn-primary btn-sm">
                    <PlusCircle size={14} /> Create Bill
                  </Link>
                </div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Voucher No</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Closing Balance</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((b, i) => (
                      <tr key={b.id}>
                        <td style={{ color: "var(--text-muted)", fontSize: 13 }}>{i + 1}</td>
                        <td>
                          <span className="badge badge-gold">{b.voucherNo}</span>
                        </td>
                        <td style={{ fontWeight: 700 }}>{b.customerName}</td>
                        <td style={{ color: "var(--text-muted)", fontSize: 13 }}>
                          {fmtDate(b.date)}
                        </td>
                        <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                          {getBillSummary(b)}
                        </td>
                        <td>
                          {b.closingBalance !== undefined ? (
                            <span style={{ fontWeight: 700, color: "var(--accent)" }}>
                              {b.closingBalance}
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-muted)" }}>—</span>
                          )}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <Link
                              href={`/bills/view?id=${b.id}`}
                              className="btn btn-xs btn-secondary"
                              title="View / Print"
                            >
                              <Eye size={12} />
                            </Link>
                            <Link
                              href={`/bills/view?id=${b.id}`}
                              className="btn btn-xs btn-secondary"
                              title="Print"
                            >
                              <Printer size={12} />
                            </Link>
                            <button
                              className="btn btn-xs btn-danger"
                              onClick={() => setDeleteConfirm(b.id)}
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">🗑️ Delete Bill?</div>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 20 }}>
              This will permanently delete the bill. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(deleteConfirm)}
              >
                Yes, Delete
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
