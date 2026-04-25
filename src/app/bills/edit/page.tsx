"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { getCustomers, updateBill, getBillById, type Customer, type BillItem, type PaymentEntry } from "@/lib/db";
import { PlusCircle, Trash2, Save } from "lucide-react";

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function makeItem(type: "ISSUE" | "RECEIVE"): BillItem {
  return { id: uid(), type, sno: 1, itemName: "", grossWeight: "", adWeight: "", lessWeight: "", description: "", netWeight: "", tunch: "", rate: "", fineGold: "", pcs: "", amount: "" };
}
function makePayment(): PaymentEntry {
  return { id: uid(), amount: "", label: "", type: "paid" };
}

const th: React.CSSProperties = { border: "1px solid #000", padding: "3px 4px", background: "#f0f0f0", fontFamily: "Courier New, monospace", fontSize: 10.5, fontWeight: "bold", textAlign: "center", lineHeight: 1.2, verticalAlign: "middle" };
const td: React.CSSProperties = { border: "1px solid #000", padding: 0, margin: 0, verticalAlign: "middle" };
const inp: React.CSSProperties = { width: "100%", border: "none", outline: "none", background: "transparent", fontFamily: "Courier New, monospace", fontSize: 11.5, color: "#000", padding: "3px 4px", textAlign: "center" };
const totalTd: React.CSSProperties = { ...td, background: "#f7f7f7", fontWeight: "bold", fontFamily: "Courier New, monospace", fontSize: 13, textAlign: "center", padding: "4px 4px" };
const grandTd: React.CSSProperties = { ...td, background: "#e8e8e8", fontWeight: "bold", fontFamily: "Courier New, monospace", fontSize: 14, textAlign: "center", padding: "5px 4px" };

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function EditBillContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cid, setCid] = useState("");
  const [vno, setVno] = useState("");
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [issue, setIssue] = useState<BillItem[]>([makeItem("ISSUE")]);
  const [recv, setRecv] = useState<BillItem[]>([makeItem("RECEIVE")]);
  const [pays, setPays] = useState<PaymentEntry[]>([makePayment(), makePayment(), makePayment(), makePayment()]);
  
  // Total states
  const [iG, setIG] = useState(""); const [iA, setIA] = useState(""); const [iL, setIL] = useState(""); const [iN, setIN] = useState(""); const [iF, setIF] = useState("");
  const [rG, setRG] = useState(""); const [rA, setRA] = useState(""); const [rL, setRL] = useState(""); const [rN, setRN] = useState(""); const [rF, setRF] = useState("");
  const [tG, setTG] = useState(""); const [tA, setTA] = useState(""); const [tL, setTL] = useState(""); const [tN, setTN] = useState(""); const [tF, setTF] = useState("");

  const [paidCash, setPaidCash] = useState("");
  const [rcptCash, setRcptCash] = useState("");
  const [prevBal, setPrevBal] = useState("");
  const [closBal, setClosBal] = useState("");
  const [drNaam, setDrNaam] = useState("");
  const [err, setErr] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const custData = await getCustomers();
        setCustomers(custData);
        if (id) {
          const b = await getBillById(id as string);
          if (b) {
            setCid(b.customerId);
            setVno(b.voucherNo);
            setDate(b.date);
            if (b.items) {
               const i = b.items.filter(x => x.type === "ISSUE");
               if (i.length) setIssue(i);
               const r = b.items.filter(x => x.type === "RECEIVE");
               if (r.length) setRecv(r);
            }
            if (b.payments && b.payments.length) {
               setPays(b.payments.length < 4 ? [...b.payments, ...Array.from({length: 4 - b.payments.length}).map(() => makePayment())] : b.payments);
            }
            setPaidCash(b.paidCash || "");
            setRcptCash(b.receiptCash || "");
            setPrevBal(b.previousBalance || "");
            setClosBal(b.closingBalance || "");
            setDrNaam(b.drNaam || "");
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [id]);

  // Auto-calculate net & fine gold when a row field changes
  function calcRow(item: BillItem): BillItem {
    const gross = parseFloat(item.grossWeight ?? "") || 0;
    const ad    = parseFloat(item.adWeight    ?? "") || 0;
    const less  = parseFloat(item.lessWeight  ?? "") || 0;
    const tunch = parseFloat(item.tunch       ?? "") || 0;
    const net   = gross - ad - less;
    const fine  = net > 0 && tunch > 0 ? (net * tunch) / 100 : 0;
    return {
      ...item,
      netWeight: net  > 0 ? net.toFixed(3)  : item.netWeight,
      fineGold:  fine > 0 ? fine.toFixed(3) : item.fineGold,
    };
  }

  const upI = (i: number, f: keyof BillItem, v: string) =>
    setIssue(p => { const n = [...p]; n[i] = calcRow({ ...n[i], [f]: v }); return n; });
  const upR = (i: number, f: keyof BillItem, v: string) =>
    setRecv(p => { const n = [...p]; n[i] = calcRow({ ...n[i], [f]: v }); return n; });
  const upP = (i: number, f: keyof PaymentEntry, v: string) =>
    setPays(p => { const n = [...p]; n[i] = { ...n[i], [f]: v }; return n; });

  // Auto-sum section totals whenever rows change
  useEffect(() => {
    const sum = (arr: BillItem[], key: keyof BillItem) =>
      arr.reduce((acc, r) => acc + (parseFloat(r[key] as string) || 0), 0);
    const fmt = (n: number) => n > 0 ? n.toFixed(3) : "";
    const grossTotal = sum(issue, "grossWeight");
    const adTotal    = sum(issue, "adWeight");
    const lessTotal  = sum(issue, "lessWeight");
    setIG(fmt(grossTotal));
    setIA(fmt(adTotal));
    setIL(fmt(lessTotal));
    setIN(fmt(grossTotal - adTotal - lessTotal));
    setIF(fmt(sum(issue, "fineGold")));
  }, [issue]);

  useEffect(() => {
    const sum = (arr: BillItem[], key: keyof BillItem) =>
      arr.reduce((acc, r) => acc + (parseFloat(r[key] as string) || 0), 0);
    const fmt = (n: number) => n > 0 ? n.toFixed(3) : "";
    const grossTotal = sum(recv, "grossWeight");
    const adTotal    = sum(recv, "adWeight");
    const lessTotal  = sum(recv, "lessWeight");
    setRG(fmt(grossTotal));
    setRA(fmt(adTotal));
    setRL(fmt(lessTotal));
    setRN(fmt(grossTotal - adTotal - lessTotal));
    setRF(fmt(sum(recv, "fineGold")));
  }, [recv]);

  // Bill Total = Issue − Receive
  useEffect(() => {
    const diff = (a: string, b: string) => (parseFloat(a) || 0) - (parseFloat(b) || 0);
    const fmt  = (n: number) => n.toFixed(3);
    setTG(fmt(diff(iG, rG)));
    setTA(fmt(diff(iA, rA)));
    setTL(fmt(diff(iL, rL)));
    setTN(fmt(diff(iN, rN)));
    setTF(fmt(diff(iF, rF)));
  }, [iG, iA, iL, iN, iF, rG, rA, rL, rN, rF]);

  const tInp = (val: string | undefined, onChange: (v: string) => void, bold?: boolean, readOnly?: boolean) => (
    <input
      type="text"
      value={val ?? ""}
      onChange={e => onChange(e.target.value)}
      readOnly={readOnly}
      style={{ ...inp, fontWeight: bold ? "bold" : "normal", background: readOnly ? "#f0f7f0" : "transparent", cursor: readOnly ? "default" : "text" }}
    />
  );

  async function save() {
    const e: string[] = [];
    if (!cid) e.push("Select a customer");
    if (![...issue, ...recv].some(i => i.itemName.trim())) e.push("Add at least one item");
    if (e.length) { setErr(e); return; }
    setSaving(true);
    const cust = customers.find(c => c.id === cid)!;
    await updateBill(id as string, {
      customerId: cid, customerName: cust.name, voucherNo: vno, date,
      items: [
        ...issue.filter(i => i.itemName.trim()).map((i, idx) => ({ ...i, sno: idx + 1, type: "ISSUE" as const })),
        ...recv.filter(i => i.itemName.trim()).map((i, idx) => ({ ...i, sno: idx + 1, type: "RECEIVE" as const })),
      ],
      payments: pays.filter(p => p.label.trim() || p.amount),
      paidCash, receiptCash: rcptCash, previousBalance: prevBal, closingBalance: closBal, drNaam,
      issueTotalGross: iG, issueTotalLess: iL, issueTotalNet: iN, issueTotalFine: iF,
      recvTotalGross: rG, recvTotalLess: rL, recvTotalNet: rN, recvTotalFine: rF,
      billTotalGross: tG, billTotalLess: tL, billTotalNet: tN, billTotalFine: tF,
    });
    router.push("/bills");
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div className="main-layout" style={{ flex: 1 }}>
        <div className="page-header">
          <div className="flex-between" style={{ paddingBottom: 20 }}>
            <div><h2>Edit Bill</h2><p style={{ marginTop: 4 }}>Full manual text entry format</p></div>
            <button className="btn btn-primary" onClick={save} disabled={saving}><Save size={15} />{saving ? "Saving…" : "Update Bill"}</button>
          </div>
        </div>
        <div className="page-content">
          {err.length > 0 && <div style={{ background: "rgba(224,90,90,0.1)", border: "1px solid rgba(224,90,90,0.3)", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>{err.map((e, i) => <p key={i} style={{ color: "var(--danger)", fontSize: 13 }}>⚠️ {e}</p>)}</div>}

          {/* Paper Bill Wrapper */}
          <div className="table-responsive" style={{ paddingBottom: 16 }}>
            <div style={{ minWidth: 800, background: "#fff", border: "1px solid #bbb", borderRadius: 6, padding: "18px 22px", color: "#000", fontFamily: "Courier New, monospace", boxShadow: "0 4px 24px rgba(0,0,0,0.25)" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 9, color: "#888", marginBottom: 2 }}>CUSTOMER</div>
                <select value={cid} onChange={e => setCid(e.target.value)}
                  style={{ fontFamily: "Courier New, monospace", fontSize: 14, fontWeight: "bold", letterSpacing: 1, border: "none", borderBottom: "2px dashed #999", background: "transparent", outline: "none", cursor: "pointer", color: cid ? "#000" : "#aaa" }}>
                  <option value="">SELECT CUSTOMER ▾</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                </select>
              </div>
              <div style={{ textAlign: "right", fontSize: 11.5, lineHeight: 2.1 }}>
                <div>V.No.&nbsp;:&nbsp;<input type="text" value={vno} onChange={e => setVno(e.target.value)} style={{ ...inp, width: 100, borderBottom: "1px dashed #aaa", fontWeight: "bold", display: "inline" }} /></div>
                <div>Date&nbsp;&nbsp;:&nbsp;<input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inp, width: 120, borderBottom: "1px dashed #aaa", display: "inline" }} /></div>
              </div>
            </div>

            {/* Main Table */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
              <thead>
                <tr>
                  <th style={{ ...th, width: 28 }}>S.No</th>
                  <th style={{ ...th, width: 66 }}>Amount</th>
                  <th style={{ ...th, textAlign: "left" }}>Item Name</th>
                  <th style={{ ...th, width: 32 }}>Pcs</th>
                  <th style={{ ...th, width: 74 }}>Gross<br/>Weight</th>
                  <th style={{ ...th, width: 62 }}>AD<br/>Weight</th>
                  <th style={{ ...th, width: 64 }}>Less<br/>Weight</th>
                  <th style={{ ...th, width: 90, textAlign: "left" }}>Description</th>
                  <th style={{ ...th, width: 74 }}>Net<br/>Weight</th>
                  <th style={{ ...th, width: 56 }}>Tunch<br/>%</th>
                  <th style={{ ...th, width: 52 }}>Rate</th>
                  <th style={{ ...th, width: 74 }}>Fine<br/>Gold</th>
                  <th style={{ width: 24, border: "none", background: "#fff" }}></th>
                </tr>
              </thead>
              <tbody>
                {/* ISSUE label row */}
                <tr>
                  <td style={td}></td><td style={td}></td>
                  <td style={{ ...td, padding: "2px 6px" }}><span style={{ fontWeight: "bold", textDecoration: "underline" }}>ISSUE</span></td>
                  <td style={td}></td><td style={td}></td><td style={td}></td><td style={td}></td><td style={td}></td><td style={td}></td><td style={td}></td><td style={td}></td><td style={td}></td>
                  <td style={{ border: "none", textAlign: "center" }}>
                    <button type="button" onClick={() => setIssue(p => [...p, makeItem("ISSUE")])} style={{ background: "none", border: "none", cursor: "pointer", color: "#4caf7d" }}><PlusCircle size={15} /></button>
                  </td>
                </tr>
                {issue.map((item, idx) => (
                  <tr key={item.id}>
                    <td style={{ ...td, textAlign: "center", fontSize: 11, padding: "2px 2px" }}>{idx + 1}</td>
                    <td style={td}>{tInp(item.amount, v => upI(idx, "amount", v))}</td>
                    <td style={td}>{tInp(item.itemName, v => upI(idx, "itemName", v), true)}</td>
                    <td style={td}>{tInp(item.pcs, v => upI(idx, "pcs", v))}</td>
                    <td style={td}>{tInp(item.grossWeight, v => upI(idx, "grossWeight", v))}</td>
                    <td style={td}>{tInp(item.adWeight, v => upI(idx, "adWeight", v))}</td>
                    <td style={td}>{tInp(item.lessWeight, v => upI(idx, "lessWeight", v))}</td>
                    <td style={{ ...td, width: 90, maxWidth: 90, textAlign: "left" }}>{tInp(item.description, v => upI(idx, "description", v))}</td>
                    <td style={td}>{tInp(item.netWeight, v => upI(idx, "netWeight", v), false, true)}</td>
                    <td style={td}>{tInp(item.tunch, v => upI(idx, "tunch", v))}</td>
                    <td style={td}>{tInp(item.rate, v => upI(idx, "rate", v))}</td>
                    <td style={td}>{tInp(item.fineGold, v => upI(idx, "fineGold", v), false, true)}</td>
                    <td style={{ border: "none", textAlign: "center", padding: "0 2px" }}>
                      <button type="button" onClick={() => setIssue(p => p.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", cursor: "pointer", color: "#e05a5a", padding: 2 }}><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
                {/* Issue Total */}
                <tr>
                  <td style={totalTd}></td><td style={totalTd}></td>
                  <td colSpan={2} style={{ ...totalTd, textAlign: "right", padding: "4px 8px" }}>Issue - Total :</td>
                  <td style={td}><input type="text" value={iG} readOnly style={{ ...inp, background: "#e8f5e9", fontWeight: "bold", fontSize: 13, cursor: "default" }} /></td>
                  <td style={td}><input type="text" value={iA} readOnly style={{ ...inp, background: "#e8f5e9", fontWeight: "bold", fontSize: 13, cursor: "default" }} /></td>
                  <td style={td}><input type="text" value={iL} readOnly style={{ ...inp, background: "#e8f5e9", fontWeight: "bold", fontSize: 13, cursor: "default" }} /></td>
                  <td style={totalTd}></td>
                  <td style={td}><input type="text" value={iN} readOnly style={{ ...inp, background: "#e8f5e9", fontWeight: "bold", fontSize: 13, cursor: "default" }} /></td>
                  <td style={totalTd}></td><td style={totalTd}></td>
                  <td style={td}><input type="text" value={iF} readOnly style={{ ...inp, background: "#e8f5e9", fontWeight: "bold", fontSize: 13, cursor: "default" }} /></td>
                  <td style={{ border: "none" }}></td>
                </tr>

                {/* RECEIVE label row */}
                <tr>
                  <td style={td}></td><td style={td}></td>
                  <td style={{ ...td, padding: "2px 6px" }}><span style={{ fontWeight: "bold", textDecoration: "underline" }}>RECEIVE</span></td>
                  <td style={td}></td><td style={td}></td><td style={td}></td><td style={td}></td><td style={td}></td><td style={td}></td><td style={td}></td><td style={td}></td><td style={td}></td>
                  <td style={{ border: "none", textAlign: "center" }}>
                    <button type="button" onClick={() => setRecv(p => [...p, makeItem("RECEIVE")])} style={{ background: "none", border: "none", cursor: "pointer", color: "#e05a5a" }}><PlusCircle size={15} /></button>
                  </td>
                </tr>
                {recv.map((item, idx) => (
                  <tr key={item.id}>
                    <td style={{ ...td, textAlign: "center", fontSize: 11, padding: "2px 2px" }}>{idx + 1}</td>
                    <td style={td}>{tInp(item.amount, v => upR(idx, "amount", v))}</td>
                    <td style={td}>{tInp(item.itemName, v => upR(idx, "itemName", v), true)}</td>
                    <td style={td}>{tInp(item.pcs, v => upR(idx, "pcs", v))}</td>
                    <td style={td}>{tInp(item.grossWeight, v => upR(idx, "grossWeight", v))}</td>
                    <td style={td}>{tInp(item.adWeight, v => upR(idx, "adWeight", v))}</td>
                    <td style={td}>{tInp(item.lessWeight, v => upR(idx, "lessWeight", v))}</td>
                    <td style={{ ...td, textAlign: "left" }}>{tInp(item.description, v => upR(idx, "description", v))}</td>
                    <td style={td}>{tInp(item.netWeight, v => upR(idx, "netWeight", v), false, true)}</td>
                    <td style={td}>{tInp(item.tunch, v => upR(idx, "tunch", v))}</td>
                    <td style={td}>{tInp(item.rate, v => upR(idx, "rate", v))}</td>
                    <td style={td}>{tInp(item.fineGold, v => upR(idx, "fineGold", v), false, true)}</td>
                    <td style={{ border: "none", textAlign: "center", padding: "0 2px" }}>
                      <button type="button" onClick={() => setRecv(p => p.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", cursor: "pointer", color: "#e05a5a", padding: 2 }}><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
                {/* Receive Total */}
                <tr>
                  <td style={totalTd}></td><td style={totalTd}></td>
                  <td colSpan={2} style={{ ...totalTd, textAlign: "right", padding: "4px 8px" }}>Receive - Total :</td>
                  <td style={td}><input type="text" value={rG} readOnly style={{ ...inp, background: "#e8f5e9", fontWeight: "bold", fontSize: 13, cursor: "default" }} /></td>
                  <td style={td}><input type="text" value={rA} readOnly style={{ ...inp, background: "#e8f5e9", fontWeight: "bold", fontSize: 13, cursor: "default" }} /></td>
                  <td style={td}><input type="text" value={rL} readOnly style={{ ...inp, background: "#e8f5e9", fontWeight: "bold", fontSize: 13, cursor: "default" }} /></td>
                  <td style={totalTd}></td>
                  <td style={td}><input type="text" value={rN} readOnly style={{ ...inp, background: "#e8f5e9", fontWeight: "bold", fontSize: 13, cursor: "default" }} /></td>
                  <td style={totalTd}></td><td style={totalTd}></td>
                  <td style={td}><input type="text" value={rF} readOnly style={{ ...inp, background: "#e8f5e9", fontWeight: "bold", fontSize: 13, cursor: "default" }} /></td>
                  <td style={{ border: "none" }}></td>
                </tr>
                {/* Bill Total */}
                <tr>
                  <td style={grandTd}></td><td style={grandTd}></td>
                  <td colSpan={2} style={{ ...grandTd, textAlign: "right", padding: "5px 8px" }}>Bill Total :</td>
                  <td style={td}><input type="text" value={tG} readOnly style={{ ...inp, background: "#d4edda", fontWeight: "bold", fontSize: 14, cursor: "default" }} /></td>
                  <td style={td}><input type="text" value={tA} readOnly style={{ ...inp, background: "#d4edda", fontWeight: "bold", fontSize: 14, cursor: "default" }} /></td>
                  <td style={td}><input type="text" value={tL} readOnly style={{ ...inp, background: "#d4edda", fontWeight: "bold", fontSize: 14, cursor: "default" }} /></td>
                  <td style={grandTd}></td>
                  <td style={td}><input type="text" value={tN} readOnly style={{ ...inp, background: "#d4edda", fontWeight: "bold", fontSize: 14, cursor: "default" }} /></td>
                  <td style={grandTd}></td><td style={grandTd}></td>
                  <td style={td}><input type="text" value={tF} readOnly style={{ ...inp, background: "#d4edda", fontWeight: "bold", fontSize: 14, cursor: "default" }} /></td>
                  <td style={{ border: "none" }}></td>
                </tr>
              </tbody>
            </table>

            {/* Footer */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <tbody>
                <tr>
                  {/* Left payments */}
                  <td style={{ border: "1px solid #000", verticalAlign: "top", padding: 0, width: "55%" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <tbody>
                        {pays.map((p, i) => (
                          <tr key={p.id}>
                            <td style={{ borderRight: "1px solid #000", borderBottom: "1px solid #ddd", width: 72 }}>
                              <input type="text" value={p.amount} onChange={e => upP(i, "amount", e.target.value)} style={{ ...inp, textAlign: "right" }} placeholder="" />
                            </td>
                            <td style={{ borderBottom: "1px solid #ddd" }}>
                              <input type="text" value={p.label} onChange={e => upP(i, "label", e.target.value)} style={{ ...inp, textAlign: "left" }} placeholder="Name / description" />
                            </td>
                            <td style={{ borderBottom: "1px solid #ddd", borderLeft: "1px solid #ddd", width: 78 }}>
                              <input type="text" value={p.voucherNo || ""} onChange={e => upP(i, "voucherNo", e.target.value)} style={{ ...inp, textAlign: "left" }} placeholder="Ref no." />
                            </td>
                          </tr>
                        ))}
                        <tr><td colSpan={3} style={{ padding: "1px 6px" }}>
                          <button type="button" onClick={() => setPays(p => [...p, makePayment()])} style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: 10, fontFamily: "Courier New, monospace" }}>+ Add row</button>
                        </td></tr>
                      </tbody>
                    </table>
                  </td>
                  {/* Right balance */}
                  <td style={{ border: "1px solid #000", verticalAlign: "top", padding: 0, width: "45%" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <tbody>
                        {[
                          { label: "Paid Cash", val: paidCash, set: setPaidCash },
                          { label: "Receipt Cash", val: rcptCash, set: setRcptCash },
                          { label: "Previous Balance", val: prevBal, set: setPrevBal },
                        ].map(({ label, val, set }) => (
                          <tr key={label}>
                            <td style={{ padding: "2px 8px", borderBottom: "1px solid #ddd", fontFamily: "Courier New, monospace", fontSize: 11 }}>{label}</td>
                            <td style={{ padding: "1px 4px", borderBottom: "1px solid #ddd" }}>
                              <input type="text" value={val} onChange={e => set(e.target.value)} style={{ ...inp, textAlign: "right" }} />
                            </td>
                          </tr>
                        ))}
                        <tr style={{ background: "#f5f5f5" }}>
                          <td style={{ padding: "4px 8px", fontWeight: "bold", fontFamily: "Courier New, monospace", fontSize: 11.5 }}>Closing Balance</td>
                          <td style={{ padding: "2px 4px" }}>
                            <input type="text" value={closBal} onChange={e => setClosBal(e.target.value)} style={{ ...inp, textAlign: "right", fontWeight: "bold", fontSize: 12 }} />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Dr/Naam */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <tbody>
                <tr>
                  <td style={{ border: "1px solid #000", padding: "3px 8px", width: "20%", fontWeight: "bold", fontFamily: "Courier New, monospace" }}>Dr/Naam</td>
                  <td style={{ border: "1px solid #000", padding: 0 }}>
                    <input type="text" value={drNaam} onChange={e => setDrNaam(e.target.value)} style={{ ...inp, textAlign: "left" }} />
                  </td>
                  <td style={{ border: "1px solid #000", padding: "3px 8px", width: "20%", fontWeight: "bold", fontFamily: "Courier New, monospace", textAlign: "right" }}>Dr/Naam</td>
                </tr>
              </tbody>
            </table>
            </div>
          </div>

          <div className="flex-between" style={{ marginTop: 20, paddingBottom: 40 }}>
            <button className="btn btn-secondary" onClick={() => router.push("/bills")}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}><Save size={15} />{saving ? "Saving…" : "Update Bill"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function EditBillPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditBillContent />
    </Suspense>
  );
}