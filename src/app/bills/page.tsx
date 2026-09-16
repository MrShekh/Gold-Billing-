"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { getBills, deleteBill, getAllCustomerBalances, type Bill, type CustomerBalance } from "@/lib/db";
import {
  PlusCircle,
  Search,
  Printer,
  Trash2,
  Eye,
  FileText,
  Calendar,
  CalendarDays,
  Sun,
  Filter,
  X,
  ChevronDown,
} from "lucide-react";

type FilterMode = "all" | "today" | "this_month" | "month_pick" | "range";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function parseBillDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  // Bill dates stored as "YYYY-MM-DD"
  const d = new Date(dateStr + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function fmtDate(d: string) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [customerBalances, setCustomerBalances] = useState<Record<string, CustomerBalance>>({});
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Filter state
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [filterOpen, setFilterOpen] = useState(false);

  // Month picker state
  const now = new Date();
  const [pickMonth, setPickMonth] = useState(now.getMonth()); // 0-indexed
  const [pickYear, setPickYear] = useState(now.getFullYear());

  // Date range state
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");

  async function load() {
    try {
      const [allData, allBals] = await Promise.all([
        getBills(),
        getAllCustomerBalances(),
      ]);
      const all = allData.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setBills(all);

      const balMap: Record<string, CustomerBalance> = {};
      for (const b of allBals) {
        balMap[b.customer_id] = b;
      }
      setCustomerBalances(balMap);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => { load(); }, []);

  // Apply all filters
  const filtered = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let result = bills;

    // Date filter
    if (filterMode === "today") {
      result = result.filter((b) => {
        const d = parseBillDate(b.date);
        if (!d) return false;
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      });
    } else if (filterMode === "this_month") {
      result = result.filter((b) => {
        const d = parseBillDate(b.date);
        if (!d) return false;
        return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
      });
    } else if (filterMode === "month_pick") {
      result = result.filter((b) => {
        const d = parseBillDate(b.date);
        if (!d) return false;
        return d.getMonth() === pickMonth && d.getFullYear() === pickYear;
      });
    } else if (filterMode === "range") {
      const from = rangeFrom ? new Date(rangeFrom + "T00:00:00") : null;
      const to = rangeTo ? new Date(rangeTo + "T23:59:59") : null;
      result = result.filter((b) => {
        const d = parseBillDate(b.date);
        if (!d) return false;
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      });
    }

    // Search filter (name / voucher / date)
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (b) =>
          b.voucherNo.toLowerCase().includes(q) ||
          b.customerName.toLowerCase().includes(q) ||
          b.date.includes(q)
      );
    }

    return result;
  }, [bills, filterMode, search, pickMonth, pickYear, rangeFrom, rangeTo]);

  async function handleDelete(id: string) {
    await deleteBill(id);
    setDeleteConfirm(null);
    load();
  }

  function getBillSummary(b: Bill) {
    const issue = b.items.filter((i) => i.type === "ISSUE").length;
    const receive = b.items.filter((i) => i.type === "RECEIVE").length;
    return `${issue} issue, ${receive} receive`;
  }

  function getFilterLabel() {
    if (filterMode === "today") return "Today";
    if (filterMode === "this_month") return "This Month";
    if (filterMode === "month_pick") return `${MONTHS[pickMonth]} ${pickYear}`;
    if (filterMode === "range") {
      if (rangeFrom && rangeTo) return `${fmtDate(rangeFrom)} – ${fmtDate(rangeTo)}`;
      if (rangeFrom) return `From ${fmtDate(rangeFrom)}`;
      if (rangeTo) return `Until ${fmtDate(rangeTo)}`;
    }
    return "All Time";
  }

  function clearFilter() {
    setFilterMode("all");
    setRangeFrom("");
    setRangeTo("");
  }

  const isFiltered = filterMode !== "all";

  // Year options for month picker
  const years: number[] = [];
  for (let y = now.getFullYear(); y >= now.getFullYear() - 5; y--) years.push(y);

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div className="main-layout" style={{ flex: 1 }}>
        <div className="page-header">
          <div className="flex-between" style={{ paddingBottom: 20 }}>
            <div>
              <h2>Bills</h2>
              <p style={{ marginTop: 4 }}>
                {filtered.length} of {bills.length} bill{bills.length !== 1 ? "s" : ""}
                {isFiltered && <span style={{ color: "var(--accent)", marginLeft: 6 }}>• filtered</span>}
              </p>
            </div>
            <Link href="/bills/new" className="btn btn-primary">
              <PlusCircle size={15} /> New Bill
            </Link>
          </div>
        </div>

        <div className="page-content">
          {/* Filter Bar */}
          <div className="bills-filter-bar mb-3">
            {/* Search */}
            <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
              <Search className="search-icon" />
              <input
                placeholder="Search by customer name, voucher no, or date..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  title="Clear"
                  style={{
                    position: "absolute", right: 10,
                    background: "none", border: "none",
                    color: "var(--text-muted)", cursor: "pointer", padding: 2,
                    display: "flex", alignItems: "center",
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Dropdown Trigger */}
            <div style={{ position: "relative" }}>
              <button
                className={`btn ${isFiltered ? "btn-filter-active" : "btn-secondary"}`}
                onClick={() => setFilterOpen((o) => !o)}
                style={{
                  gap: 8,
                  background: isFiltered ? "var(--accent-glow)" : undefined,
                  borderColor: isFiltered ? "rgba(212,168,67,0.4)" : undefined,
                  color: isFiltered ? "var(--accent)" : undefined,
                }}
              >
                <Filter size={14} />
                <span style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {getFilterLabel()}
                </span>
                <ChevronDown size={14} style={{ transition: "transform 0.2s", transform: filterOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
              </button>

              {filterOpen && (
                <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                  <div className="filter-dropdown-inner">
                    {/* Quick filters */}
                    <div className="filter-section-label">Quick Filters</div>
                    <div className="filter-quick-btns">
                      <button
                        className={`filter-chip ${filterMode === "all" ? "active" : ""}`}
                        onClick={() => { setFilterMode("all"); setFilterOpen(false); }}
                      >
                        All Time
                      </button>
                      <button
                        className={`filter-chip ${filterMode === "today" ? "active" : ""}`}
                        onClick={() => { setFilterMode("today"); setFilterOpen(false); }}
                      >
                        <Sun size={12} /> Today
                      </button>
                      <button
                        className={`filter-chip ${filterMode === "this_month" ? "active" : ""}`}
                        onClick={() => { setFilterMode("this_month"); setFilterOpen(false); }}
                      >
                        <Calendar size={12} /> This Month
                      </button>
                    </div>

                    <div className="filter-divider" />

                    {/* Month picker */}
                    <div className="filter-section-label">Pick a Month</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                      <select
                        className="filter-select"
                        value={pickMonth}
                        onChange={(e) => setPickMonth(Number(e.target.value))}
                      >
                        {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                      </select>
                      <select
                        className="filter-select"
                        value={pickYear}
                        onChange={(e) => setPickYear(Number(e.target.value))}
                      >
                        {years.map((y) => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <button
                        className="filter-chip active"
                        style={{ whiteSpace: "nowrap" }}
                        onClick={() => { setFilterMode("month_pick"); setFilterOpen(false); }}
                      >
                        Apply
                      </button>
                    </div>

                    <div className="filter-divider" />

                    {/* Date range */}
                    <div className="filter-section-label">Date Range</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <label style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>From</label>
                        <input
                          type="date"
                          className="filter-date-input"
                          value={rangeFrom}
                          onChange={(e) => setRangeFrom(e.target.value)}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <label style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>To</label>
                        <input
                          type="date"
                          className="filter-date-input"
                          value={rangeTo}
                          onChange={(e) => setRangeTo(e.target.value)}
                        />
                      </div>
                      <button
                        className="filter-chip active"
                        style={{ alignSelf: "flex-end", whiteSpace: "nowrap" }}
                        onClick={() => { setFilterMode("range"); setFilterOpen(false); }}
                        disabled={!rangeFrom && !rangeTo}
                      >
                        <CalendarDays size={12} /> Apply Range
                      </button>
                    </div>

                    {isFiltered && (
                      <>
                        <div className="filter-divider" />
                        <button
                          className="filter-chip"
                          style={{ color: "var(--danger)", borderColor: "rgba(224,90,90,0.3)", width: "100%" }}
                          onClick={() => { clearFilter(); setFilterOpen(false); }}
                        >
                          <X size={12} /> Clear Filter
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Active filter badge */}
            {isFiltered && (
              <button
                className="filter-active-badge"
                onClick={clearFilter}
                title="Clear filter"
              >
                {getFilterLabel()} <X size={11} />
              </button>
            )}
          </div>

          {/* Table */}
          <div className="form-card" style={{ padding: 0, overflow: "hidden" }}>
            {filtered.length === 0 ? (
              <div className="empty-state">
                <FileText />
                <h3>No bills found</h3>
                <p>
                  {isFiltered || search
                    ? "Try changing your filter or search query"
                    : "Create your first bill to get started"}
                </p>
                {!isFiltered && !search && (
                  <div style={{ marginTop: 16 }}>
                    <Link href="/bills/new" className="btn btn-primary btn-sm">
                      <PlusCircle size={14} /> Create Bill
                    </Link>
                  </div>
                )}
                {(isFiltered || search) && (
                  <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "center" }}>
                    {isFiltered && (
                      <button className="btn btn-secondary btn-sm" onClick={clearFilter}>
                        <X size={13} /> Clear Filter
                      </button>
                    )}
                    {search && (
                      <button className="btn btn-secondary btn-sm" onClick={() => setSearch("")}>
                        <X size={13} /> Clear Search
                      </button>
                    )}
                  </div>
                )}
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
                      <th>This Bill Net</th>
                      <th>Balance After Bill</th>
                      <th>Customer Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((b, i) => {
                      const netFine = parseFloat(b.billTotalFine || "0");
                      const custBal = customerBalances[b.customerId];
                      const currentDue = custBal ? custBal.fine_gold_balance : 0;

                      return (
                        <tr key={b.id}>
                          <td style={{ color: "var(--text-muted)", fontSize: 13 }}>{i + 1}</td>
                          <td>
                            <span className="badge badge-gold">{b.voucherNo}</span>
                          </td>
                          <td style={{ fontWeight: 700 }}>
                            <Link
                              href={`/customers/${b.customerId}`}
                              style={{ color: "var(--text-primary)", textDecoration: "none" }}
                              className="customer-ledger-link"
                              title="View Customer Ledger"
                            >
                              {b.customerName}
                            </Link>
                          </td>
                          <td style={{ color: "var(--text-muted)", fontSize: 13 }}>
                            {fmtDate(b.date)}
                          </td>
                          <td>
                            <div>
                              <span
                                style={{
                                  fontWeight: 700,
                                  fontFamily: "monospace",
                                  fontSize: 13.5,
                                  color: netFine >= 0 ? "var(--accent)" : "var(--success)",
                                }}
                              >
                                {netFine >= 0 ? `+${netFine.toFixed(3)}` : netFine.toFixed(3)} g
                              </span>
                              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                                {getBillSummary(b)}
                              </div>
                            </div>
                          </td>
                          <td>
                            {b.closingFineGold !== undefined && b.closingFineGold !== null ? (() => {
                              const cVal = parseFloat(b.closingFineGold as string || "0");
                              return (
                                <span style={{
                                  fontWeight: 700,
                                  color: cVal < -0.0001 ? "var(--success)" : "var(--text-primary)",
                                  fontFamily: "monospace",
                                  fontSize: 13.5
                                }}>
                                  {cVal < -0.0001
                                    ? `${Math.abs(cVal).toFixed(3)} g (Adv)`
                                    : `${cVal.toFixed(3)} g`}
                                </span>
                              );
                            })() : (
                              <span style={{ color: "var(--text-muted)" }}>—</span>
                            )}
                          </td>
                          <td>
                            {currentDue < -0.0001 ? (
                              <span
                                className="badge"
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  background: "rgba(16,185,129,0.15)",
                                  color: "#10b981",
                                  border: "1px solid rgba(16,185,129,0.3)"
                                }}
                                title="Customer has deposited gold in advance"
                              >
                                Advance {Math.abs(currentDue).toFixed(3)} g
                              </span>
                            ) : currentDue <= 0.0001 ? (
                              <span
                                className="badge badge-success"
                                style={{ fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3 }}
                                title="Customer has zero pending balance today"
                              >
                                ✓ All Clear (0.000 g)
                              </span>
                            ) : (
                              <span
                                className="badge badge-gold"
                                style={{ fontSize: 11, fontWeight: 700 }}
                                title="Customer currently has an outstanding balance"
                              >
                                Owes {currentDue.toFixed(3)} g
                              </span>
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
                    );
                  })}
                </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter overlay close */}
      {filterOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 90 }}
          onClick={() => setFilterOpen(false)}
        />
      )}

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
