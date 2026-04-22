"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import {
  getCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  getBills,
  type Customer,
} from "@/lib/db";
import { Search, UserPlus, Pencil, Trash2, Phone, MapPin, FileText, X } from "lucide-react";

type Mode = "list" | "add" | "edit";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filtered, setFiltered] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<Mode>("list");
  const [editTarget, setEditTarget] = useState<Customer | null>(null);
  const [billCounts, setBillCounts] = useState<Record<string, number>>({});

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  async function load() {
    try {
      const allData = await getCustomers();
      const all = allData.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setCustomers(all);
      setFiltered(all);

      const allBills = await getBills();
      const counts: Record<string, number> = {};
      for (const bill of allBills) {
        counts[bill.customerId] = (counts[bill.customerId] || 0) + 1;
      }
      setBillCounts(counts);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      customers.filter(
        (c) =>
          c.name.toLowerCase().includes(q) || c.phone.includes(q)
      )
    );
  }, [search, customers]);

  function openAdd() {
    setName(""); setPhone(""); setAddress(""); setError("");
    setEditTarget(null);
    setMode("add");
  }

  function openEdit(c: Customer) {
    setName(c.name); setPhone(c.phone); setAddress(c.address || ""); setError("");
    setEditTarget(c);
    setMode("edit");
  }

  function cancel() { setMode("list"); setEditTarget(null); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required"); return; }
    if (!phone.trim()) { setError("Phone is required"); return; }

    if (mode === "add") {
      await addCustomer({ name: name.trim(), phone: phone.trim(), address: address.trim() });
    } else if (mode === "edit" && editTarget) {
      await updateCustomer(editTarget.id, { name: name.trim(), phone: phone.trim(), address: address.trim() });
    }
    load();
    setMode("list");
  }

  async function handleDelete(id: string) {
    await deleteCustomer(id);
    setDeleteConfirm(null);
    load();
  }

  function getCustomerBillCount(id: string) {
    return billCounts[id] || 0;
  }

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div className="main-layout" style={{ flex: 1 }}>
        <div className="page-header">
          <div className="flex-between" style={{ paddingBottom: 20 }}>
            <div>
              <h2>Customers</h2>
              <p style={{ marginTop: 4 }}>
                {customers.length} customer{customers.length !== 1 ? "s" : ""} registered
              </p>
            </div>
            <button className="btn btn-primary" onClick={openAdd}>
              <UserPlus size={15} /> Add Customer
            </button>
          </div>
        </div>

        <div className="page-content">
          {/* Add / Edit Form */}
          {(mode === "add" || mode === "edit") && (
            <div className="form-card mb-4">
              <div className="flex-between mb-3">
                <h3 style={{ fontSize: 17, fontWeight: 700 }}>
                  {mode === "add" ? "➕ New Customer" : "✏️ Edit Customer"}
                </h3>
                <button className="btn btn-xs btn-secondary" onClick={cancel}>
                  <X size={13} /> Cancel
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="grid-3" style={{ gap: 14 }}>
                  <div>
                    <label className="form-label">Customer Name *</label>
                    <input
                      className="form-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ramesh Bhatija"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="form-label">Phone Number *</label>
                    <input
                      className="form-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 99999 99999"
                      type="tel"
                    />
                  </div>
                  <div>
                    <label className="form-label">Address (optional)</label>
                    <input
                      className="form-input"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="City / Area"
                    />
                  </div>
                </div>
                {error && (
                  <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 10 }}>
                    ⚠️ {error}
                  </p>
                )}
                <div className="flex gap-3 mt-3">
                  <button type="submit" className="btn btn-primary">
                    {mode === "add" ? "Save Customer" : "Update Customer"}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={cancel}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Search */}
          <div className="search-bar mb-3">
            <Search className="search-icon" />
            <input
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* List */}
          <div className="form-card" style={{ padding: 0, overflow: "hidden" }}>
            {filtered.length === 0 ? (
              <div className="empty-state">
                <UserPlus />
                <h3>No customers found</h3>
                <p>Add a new customer to get started</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Bills</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <tr key={c.id}>
                      <td style={{ color: "var(--text-muted)", fontSize: 13 }}>{i + 1}</td>
                      <td>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 15,
                            color: "var(--text-primary)",
                          }}
                        >
                          {c.name}
                        </div>
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
                        {c.address ? (
                          <div
                            className="flex-center gap-2"
                            style={{ color: "var(--text-muted)", fontSize: 13 }}
                          >
                            <MapPin size={12} /> {c.address}
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-gold">
                          <FileText size={11} style={{ marginRight: 4 }} />
                          {getCustomerBillCount(c.id)} bill{getCustomerBillCount(c.id) !== 1 ? "s" : ""}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            className="btn btn-xs btn-secondary"
                            onClick={() => openEdit(c)}
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            className="btn btn-xs btn-danger"
                            onClick={() => setDeleteConfirm(c.id)}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">🗑️ Delete Customer?</div>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 20 }}>
              This will permanently delete the customer. Their bills will remain.
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
