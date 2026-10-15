"use client";

import React, { useCallback, useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import AuthGuard from "@/components/AuthGuard";
import { Wallet, UserPlus, Phone, Trash2, Pencil, Eraser, ArrowUpRight, ArrowDownLeft, CheckCircle2, ArrowLeft } from "lucide-react";

interface Person { id: string; name: string; phone: string; balance: number; }
interface Entry { id: string; type: "GIVEN" | "RECEIVED"; amount: number; note: string; isSettlement: boolean; date: string; }
interface Detail extends Person { entries: Entry[]; }

const fmt = (n: number) => "₹" + Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2 });
const GREEN = "var(--success)";
const RED = "var(--danger)";

async function api(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}
const json = (method: string, body: unknown): RequestInit => ({
  method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
});

export default function CashPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState<"GIVEN" | "RECEIVED">("GIVEN");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string; phone: string } | null>(null);

  const loadPeople = useCallback(async () => {
    try { setPeople(await api("/api/cash")); } catch { setPeople([]); }
    setLoading(false);
  }, []);

  const openPerson = useCallback(async (id: string) => {
    setDetail(await api(`/api/cash/${id}`));
  }, []);

  useEffect(() => { loadPeople(); }, [loadPeople]);

  async function refresh(id: string) { await Promise.all([openPerson(id), loadPeople()]); }

  async function addPerson(e: React.FormEvent) {
    e.preventDefault(); setError("");
    try {
      await api("/api/cash", json("POST", { name, phone }));
      setName(""); setPhone(""); setShowAdd(false);
      loadPeople();
    } catch (err) { setError((err as Error).message); }
  }

  async function addEntry(e: React.FormEvent) {
    e.preventDefault(); if (!detail) return; setError("");
    try {
      await api(`/api/cash/${detail.id}`, json("POST", { type, amount, note }));
      setAmount(""); setNote("");
      refresh(detail.id);
    } catch (err) { setError((err as Error).message); }
  }

  async function settle() {
    if (!detail) return;
    const input = window.prompt(`Settle amount (full balance ${fmt(detail.balance)})`, String(Math.abs(detail.balance)));
    if (input === null) return;
    try {
      await api(`/api/cash/${detail.id}`, json("POST", { settle: true, amount: input }));
      refresh(detail.id);
    } catch (err) { setError((err as Error).message); }
  }

  async function removeEntry(entryId: string) {
    if (!detail || !confirm("Delete this transaction?")) return;
    await api(`/api/cash/${detail.id}?entryId=${entryId}`, { method: "DELETE" });
    refresh(detail.id);
  }

  async function removePerson() {
    if (!detail || !confirm(`Delete ${detail.name} and all their cash records?`)) return;
    await api(`/api/cash/${detail.id}`, { method: "DELETE" });
    setDetail(null); loadPeople();
  }

  async function removeFromList(p: Person) {
    if (!confirm(`Delete ${p.name} and all their cash records?`)) return;
    try { await api(`/api/cash/${p.id}`, { method: "DELETE" }); loadPeople(); }
    catch (err) { setError((err as Error).message); }
  }

  async function clearPerson(p: { id: string; name: string; balance: number }) {
    if (!confirm(`Clear all transactions of ${p.name}? Balance of ${fmt(p.balance)} will be reset to zero.`)) return;
    try {
      await api(`/api/cash/${p.id}?clear=1`, { method: "DELETE" });
      if (detail?.id === p.id) await openPerson(p.id);
      loadPeople();
    } catch (err) { setError((err as Error).message); }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault(); if (!editing) return; setError("");
    try {
      await api(`/api/cash/${editing.id}`, json("PUT", { name: editing.name, phone: editing.phone }));
      const id = editing.id;
      setEditing(null);
      if (detail?.id === id) await openPerson(id);
      loadPeople();
    } catch (err) { setError((err as Error).message); }
  }

  const totalToReceive = people.filter(p => p.balance > 0).reduce((s, p) => s + p.balance, 0);
  const totalToPay = people.filter(p => p.balance < 0).reduce((s, p) => s + Math.abs(p.balance), 0);

  const balanceText = (b: number) =>
    b > 0.009 ? { text: `Will give you ${fmt(b)}`, color: GREEN }
    : b < -0.009 ? { text: `You owe ${fmt(b)}`, color: RED }
    : { text: "Settled", color: "var(--text-muted)" };

  return (
    <AuthGuard>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <div className="main-layout" style={{ flex: 1, width: "100%" }}>
          <div className="page-header" style={{ borderBottom: "1px solid var(--border)", padding: "20px 32px" }}>
            <div className="flex-between" style={{ flexWrap: "wrap", gap: 16 }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, display: "flex", alignItems: "center", gap: 10 }}>
                  <Wallet size={24} /> Cash
                </h1>
                <p style={{ marginTop: 4, color: "var(--text-secondary)", fontSize: 13 }}>
                  Separate cash given / received ledger for people outside billing
                </p>
              </div>
              {!detail && (
                <button className="btn btn-primary" onClick={() => setShowAdd(s => !s)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <UserPlus size={15} /> Add Person
                </button>
              )}
            </div>
          </div>

          <div className="page-content" style={{ width: "100%", padding: "24px 32px" }}>
            {editing && (
              <form className="form-card" onSubmit={saveEdit} style={{ marginBottom: 24, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label className="form-label">Name</label>
                  <input className="form-input" required value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label className="form-label">Number</label>
                  <input className="form-input" value={editing.phone} onChange={e => setEditing({ ...editing, phone: e.target.value })} />
                </div>
                <button className="btn btn-primary" type="submit">Update</button>
                <button className="btn btn-secondary" type="button" onClick={() => setEditing(null)}>Cancel</button>
                {error && <p style={{ color: RED, width: "100%", fontSize: 13 }}>{error}</p>}
              </form>
            )}
            {!detail ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
                  <div className="stat-card">
                    <span className="stat-label" style={{ color: GREEN }}>To Receive</span>
                    <div className="stat-value" style={{ color: GREEN }}>{fmt(totalToReceive)}</div>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label" style={{ color: RED }}>To Pay</span>
                    <div className="stat-value" style={{ color: RED }}>{fmt(totalToPay)}</div>
                  </div>
                </div>

                {showAdd && (
                  <form className="form-card" onSubmit={addPerson} style={{ marginBottom: 24, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <label className="form-label">Name</label>
                      <input className="form-input" required value={name} onChange={e => setName(e.target.value)} placeholder="Name" />
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <label className="form-label">Number</label>
                      <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" />
                    </div>
                    <button className="btn btn-primary" type="submit">Save</button>
                    {error && <p style={{ color: RED, width: "100%", fontSize: 13 }}>{error}</p>}
                  </form>
                )}

                <div className="form-card" style={{ padding: 0, overflow: "hidden" }}>
                  {loading ? (
                    <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>Loading...</div>
                  ) : people.length === 0 ? (
                    <div className="empty-state" style={{ padding: 48 }}>
                      <Wallet size={36} style={{ color: "var(--text-muted)", marginBottom: 12 }} />
                      <h3>No people yet</h3>
                      <p>Add a person to start tracking cash given or received.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="data-table">
                        <thead><tr><th>Name</th><th>Number</th><th>Balance</th><th></th></tr></thead>
                        <tbody>
                          {people.map(p => {
                            const b = balanceText(p.balance);
                            return (
                              <tr key={p.id} style={{ cursor: "pointer" }} onClick={() => { setError(""); openPerson(p.id); }}>
                                <td style={{ fontWeight: 800 }}>{p.name}</td>
                                <td>
                                  {p.phone ? <span className="flex-center gap-2" style={{ fontSize: 13 }}><Phone size={13} /> {p.phone}</span> : "—"}
                                </td>
                                <td style={{ color: b.color, fontWeight: 700 }}>{b.text}</td>
                                <td>
                                  <div style={{ display: "flex", gap: 6 }}>
                                    <button className="btn btn-xs btn-secondary" title="Edit"
                                      onClick={(e) => { e.stopPropagation(); setError(""); setEditing({ id: p.id, name: p.name, phone: p.phone }); }}>
                                      <Pencil size={12} />
                                    </button>
                                    <button className="btn btn-xs btn-secondary" title="Clear all transactions"
                                      onClick={(e) => { e.stopPropagation(); clearPerson(p); }}>
                                      <Eraser size={12} />
                                    </button>
                                    <button className="btn btn-xs btn-secondary" title="Delete" style={{ color: RED }}
                                    onClick={(e) => { e.stopPropagation(); removeFromList(p); }}>
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
              </>
            ) : (
              <>
                <button className="btn btn-secondary btn-sm" onClick={() => { setDetail(null); loadPeople(); }}
                  style={{ marginBottom: 16, display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <ArrowLeft size={14} /> Back
                </button>

                <div className="form-card" style={{ marginBottom: 24 }}>
                  <div className="flex-between" style={{ flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{detail.name}</h2>
                      <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 2 }}>{detail.phone || "No number"}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: balanceText(detail.balance).color }}>
                        {balanceText(detail.balance).text}
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end" }}>
                        {Math.abs(detail.balance) > 0.009 && (
                          <button className="btn btn-primary btn-sm" onClick={settle}
                            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <CheckCircle2 size={14} /> Settle
                          </button>
                        )}
                        <button className="btn btn-secondary btn-sm" title="Clear all transactions"
                          onClick={() => clearPerson(detail)} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <Eraser size={14} /> Clear
                        </button>
                        <button className="btn btn-secondary btn-sm" title="Edit"
                          onClick={() => { setError(""); setEditing({ id: detail.id, name: detail.name, phone: detail.phone }); }}>
                          <Pencil size={14} />
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={removePerson} style={{ color: RED }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <form className="form-card" onSubmit={addEntry} style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <button type="button" className={`btn btn-sm ${type === "GIVEN" ? "btn-primary" : "btn-secondary"}`} onClick={() => setType("GIVEN")}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <ArrowUpRight size={14} /> I gave cash
                    </button>
                    <button type="button" className={`btn btn-sm ${type === "RECEIVED" ? "btn-primary" : "btn-secondary"}`} onClick={() => setType("RECEIVED")}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <ArrowDownLeft size={14} /> I received cash
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <label className="form-label">Amount (₹)</label>
                      <input className="form-input" type="number" step="0.01" min="0" required value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>
                    <div style={{ flex: 2, minWidth: 200 }}>
                      <label className="form-label">Note (optional)</label>
                      <input className="form-input" value={note} onChange={e => setNote(e.target.value)} />
                    </div>
                    <button className="btn btn-primary" type="submit">Add</button>
                  </div>
                  {error && <p style={{ color: RED, fontSize: 13, marginTop: 8 }}>{error}</p>}
                </form>

                <div className="form-card" style={{ padding: 0, overflow: "hidden" }}>
                  {detail.entries.length === 0 ? (
                    <div className="empty-state" style={{ padding: 40 }}><p>No transactions yet.</p></div>
                  ) : (
                    <div className="table-responsive">
                      <table className="data-table">
                        <thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Note</th><th></th></tr></thead>
                        <tbody>
                          {detail.entries.map(en => (
                            <tr key={en.id}>
                              <td>{new Date(en.date).toLocaleDateString("en-IN")}</td>
                              <td style={{ color: en.type === "GIVEN" ? RED : GREEN, fontWeight: 700 }}>
                                {en.isSettlement ? "Settlement · " : ""}{en.type === "GIVEN" ? "I gave" : "I received"}
                              </td>
                              <td style={{ fontFamily: "monospace", fontWeight: 700 }}>{fmt(en.amount)}</td>
                              <td style={{ color: "var(--text-secondary)" }}>{en.note || "—"}</td>
                              <td>
                                <button className="btn btn-xs btn-secondary" onClick={() => removeEntry(en.id)} style={{ color: RED }}>
                                  <Trash2 size={12} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
