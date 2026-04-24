"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { getCustomers, addBill, generateVoucherNo, getCustomerBalance, type Customer, type CustomerBalance, type BillItem } from "@/lib/db";
import { PlusCircle, Trash2, Save, Scale } from "lucide-react";

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function makeItem(type: "ISSUE" | "RECEIVE"): BillItem {
  return { id: uid(), type, sno: 1, itemName: "", grossWeight: "", lessWeight: "", description: "", netWeight: "", tunch: "", rate: "", fineGold: "", pcs: "", amount: "" };
}

const th: React.CSSProperties = { border: "1px solid #000", padding: "3px 4px", background: "#f0f0f0", fontFamily: "Courier New, monospace", fontSize: 10.5, fontWeight: "bold", textAlign: "center", lineHeight: 1.2, verticalAlign: "middle" };
const td: React.CSSProperties = { border: "1px solid #000", padding: 0, margin: 0, verticalAlign: "middle" };
const inp: React.CSSProperties = { width: "100%", border: "none", outline: "none", background: "transparent", fontFamily: "Courier New, monospace", fontSize: 11.5, color: "#000", padding: "3px 4px", textAlign: "center" };
const totalTd: React.CSSProperties = { ...td, background: "#f7f7f7", fontWeight: "bold", fontFamily: "Courier New, monospace", fontSize: 13, textAlign: "center", padding: "4px 4px" };
const grandTd: React.CSSProperties = { ...td, background: "#e8e8e8", fontWeight: "bold", fontFamily: "Courier New, monospace", fontSize: 14, textAlign: "center", padding: "5px 4px" };

export default function NewBillPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cid, setCid] = useState("");
  const [vno, setVno] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [issue, setIssue] = useState<BillItem[]>([makeItem("ISSUE")]);
  const [recv, setRecv] = useState<BillItem[]>([makeItem("RECEIVE")]);

  
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
  const [jamaBalance, setJamaBalance] = useState<CustomerBalance | null>(null);
  const [jamaLoading, setJamaLoading] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const custData = await getCustomers();
        setCustomers(custData);
        const vnoData = await generateVoucherNo();
        setVno(vnoData);
      } catch (e) {
        console.error(e);
      }
    }
    init();
  }, []);

  async function onCustomerSelect(customerId: string) {
    setCid(customerId);
    setJamaBalance(null);
    setPrevBal("");
    if (!customerId) return;
    setJamaLoading(true);
    try {
      const bal = await getCustomerBalance(customerId);
      setJamaBalance(bal);
      // Auto-fill cash previous balance from Jama
      if (bal && bal.cash_balance > 0) {
        setPrevBal(bal.cash_balance.toFixed(2));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setJamaLoading(false);
    }
  }

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

  // Jama fine gold & cash = previous (from DB) + this bill's net amount
  const prevJamaGold    = jamaBalance?.fine_gold_balance ?? 0;
  const currentBillGold = parseFloat(tF) || 0;
  const closingJamaGold = prevJamaGold + currentBillGold;

  const prevJamaCash    = jamaBalance?.cash_balance ?? 0;
  const currentBillCash = issue.reduce((sum, item) => sum + (parseFloat(item.amount ?? "0") || 0), 0) - recv.reduce((sum, item) => sum + (parseFloat(item.amount ?? "0") || 0), 0);
  const closingJamaCash = prevJamaCash + currentBillCash;

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
    await addBill({
      customerId: cid, customerName: cust.name, voucherNo: vno, date,
      items: [
        ...issue.filter(i => i.itemName.trim()).map((i, idx) => ({ ...i, sno: idx + 1, type: "ISSUE" as const })),
        ...recv.filter(i => i.itemName.trim()).map((i, idx) => ({ ...i, sno: idx + 1, type: "RECEIVE" as const })),
      ],
      payments: [],
      paidCash: "", receiptCash: "", previousBalance: "", closingBalance: "", drNaam,
      issueTotalGross: iG, issueTotalLess: iL, issueTotalNet: iN, issueTotalFine: iF,
      recvTotalGross: rG, recvTotalLess: rL, recvTotalNet: rN, recvTotalFine: rF,
      billTotalGross: tG, billTotalLess: tL, billTotalNet: tN, billTotalFine: tF,
      // Jama fine gold — passed explicitly so addBill can also read them
      prevFineGold: prevJamaGold.toFixed(3),
      closingFineGold: closingJamaGold.toFixed(3),
    });
    router.push("/bills");
  }

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div className="main-layout" style={{ flex: 1 }}>
        <div className="page-header">
          <div className="flex-between" style={{ paddingBottom: 20 }}>
            <div><h2>Create New Bill</h2><p style={{ marginTop: 4 }}>Full manual text entry format</p></div>
            <button className="btn btn-primary" onClick={save} disabled={saving}><Save size={15} />{saving ? "Saving…" : "Save Bill"}</button>
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
                <select value={cid} onChange={e => onCustomerSelect(e.target.value)}
                  style={{ fontFamily: "Courier New, monospace", fontSize: 14, fontWeight: "bold", letterSpacing: 1, border: "none", borderBottom: "2px dashed #999", background: "transparent", outline: "none", cursor: "pointer", color: cid ? "#000" : "#aaa" }}>
                  <option value="">SELECT CUSTOMER ▾</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                </select>

                {/* Jama Balance Banner */}
                {jamaLoading && (
                  <div style={{ marginTop: 6, fontSize: 11, color: "#b8860b", fontFamily: "Courier New, monospace" }}>Loading jama balance…</div>
                )}
                {!jamaLoading && cid && (
                  <div style={{
                    marginTop: 8, padding: "6px 10px", borderRadius: 6,
                    background: jamaBalance && (jamaBalance.fine_gold_balance > 0 || jamaBalance.cash_balance > 0)
                      ? "#fff8e1" : "#f0fff4",
                    border: jamaBalance && (jamaBalance.fine_gold_balance > 0 || jamaBalance.cash_balance > 0)
                      ? "1px solid #f59e0b" : "1px solid #6ee7b7",
                    display: "flex", gap: 18, alignItems: "center"
                  }}>
                    <Scale size={14} style={{ color: "#b8860b", flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 9, color: "#92400e", fontWeight: "bold", letterSpacing: 0.5 }}>JAMA BALANCE (PREVIOUS DUE)</div>
                      <div style={{ display: "flex", gap: 16, marginTop: 2 }}>
                        <div>
                          <span style={{ fontSize: 9, color: "#78350f" }}>Fine Gold: </span>
                          <strong style={{ fontSize: 13, color: jamaBalance && jamaBalance.fine_gold_balance > 0 ? "#b45309" : "#166534" }}>
                            {(jamaBalance?.fine_gold_balance ?? 0).toFixed(3)} g
                          </strong>
                        </div>
                        <div>
                          <span style={{ fontSize: 9, color: "#78350f" }}>Cash: </span>
                          <strong style={{ fontSize: 13, color: jamaBalance && jamaBalance.cash_balance > 0 ? "#b45309" : "#166534" }}>
                            ₹{(jamaBalance?.cash_balance ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
                  <th style={{ ...th, width: 58 }}>Amount</th>
                  <th style={{ ...th, textAlign: "left" }}>Item Name</th>
                  <th style={{ ...th, width: 32 }}>Pcs</th>
                  <th style={{ ...th, width: 62 }}>Gross<br/>Weight</th>
                  <th style={{ ...th, width: 42 }}>AD<br/>Weight</th>
                  <th style={{ ...th, width: 52 }}>Less<br/>Weight</th>
                  <th style={{ ...th, width: 90, textAlign: "left" }}>Description</th>
                  <th style={{ ...th, width: 62 }}>Net<br/>Weight</th>
                  <th style={{ ...th, width: 52 }}>Tunch<br/>%</th>
                  <th style={{ ...th, width: 44 }}>Rate</th>
                  <th style={{ ...th, width: 62 }}>Fine<br/>Gold</th>
                  <th style={{ width: 24, border: "none", background: "#fff" }}></th>
                </tr>
              </thead>
              <tbody>
                {/* ISSUE label row */}
                <tr>
                  <td style={td}></td><td style={td}></td>
                  <td style={{ ...td, padding: "2px 6px" }}><span style={{ fontWeight: "bold", textDecoration: "underline" }}>ISSUE</span></td>
                  <td style={td}></td><td style={td}></td><td style={td}></td><td style={td}></td><td style={td}></td><td style={td}></td><td style={td}></td><td style={td}></td>
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

            {/* Footer — Jama Balance only */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <tbody>
                <tr>
                  <td style={{ border: "1px solid #000", verticalAlign: "top", padding: 0, width: "50%" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <tbody>
                        <tr>
                          <td colSpan={2} style={{ padding: "2px 10px", background: "#f0fdf4", borderBottom: "1px solid #ddd", fontFamily: "Courier New, monospace", fontSize: 10, fontWeight: "bold", color: "#166534", letterSpacing: 0.5 }}>CASH JAMA (₹)</td>
                        </tr>
                        <tr>
                          <td style={{ padding: "2px 10px", borderBottom: "1px solid #ddd", fontFamily: "Courier New, monospace", fontSize: 11, width: "60%" }}>Previous Jama</td>
                          <td style={{ padding: "1px 6px", borderBottom: "1px solid #ddd" }}>
                            <input type="text" value={prevJamaCash > 0 ? prevJamaCash.toFixed(2) : "0.00"} readOnly style={{ ...inp, textAlign: "right", background: "#f0fdf4", cursor: "default", color: prevJamaCash > 0 ? "#15803d" : "#666" }} />
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: "2px 10px", borderBottom: "1px solid #ddd", fontFamily: "Courier New, monospace", fontSize: 11 }}>This Bill Net Cash</td>
                          <td style={{ padding: "1px 6px", borderBottom: "1px solid #ddd" }}>
                            <input type="text" value={(currentBillCash >= 0 ? "+" : "") + currentBillCash.toFixed(2)} readOnly style={{ ...inp, textAlign: "right", background: "#e8f5e9", cursor: "default", color: currentBillCash >= 0 ? "#166534" : "#b91c1c" }} />
                          </td>
                        </tr>
                        <tr style={{ background: "#dcfce7" }}>
                          <td style={{ padding: "4px 10px", fontWeight: "bold", fontFamily: "Courier New, monospace", fontSize: 11.5, color: "#166534" }}>Closing Jama Cash</td>
                          <td style={{ padding: "2px 6px" }}>
                            <input type="text" value={closingJamaCash.toFixed(2)} readOnly style={{ ...inp, textAlign: "right", fontWeight: "bold", fontSize: 12, background: "#dcfce7", cursor: "default", color: "#166534" }} />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                  <td style={{ border: "1px solid #000", verticalAlign: "top", padding: 0, width: "50%" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <tbody>
                        <tr>
                          <td colSpan={2} style={{ padding: "2px 10px", background: "#fef9e7", borderBottom: "1px solid #ddd", fontFamily: "Courier New, monospace", fontSize: 10, fontWeight: "bold", color: "#92400e", letterSpacing: 0.5 }}>FINE GOLD JAMA (grams)</td>
                        </tr>
                        <tr>
                          <td style={{ padding: "2px 10px", borderBottom: "1px solid #ddd", fontFamily: "Courier New, monospace", fontSize: 11, width: "60%" }}>Previous Jama</td>
                          <td style={{ padding: "1px 6px", borderBottom: "1px solid #ddd" }}>
                            <input type="text" value={prevJamaGold > 0 ? prevJamaGold.toFixed(3) : "0.000"} readOnly style={{ ...inp, textAlign: "right", background: "#fef9e7", cursor: "default", color: prevJamaGold > 0 ? "#b45309" : "#666" }} />
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: "2px 10px", borderBottom: "1px solid #ddd", fontFamily: "Courier New, monospace", fontSize: 11 }}>This Bill Fine Gold</td>
                          <td style={{ padding: "1px 6px", borderBottom: "1px solid #ddd" }}>
                            <input type="text" value={tF || "0.000"} readOnly style={{ ...inp, textAlign: "right", background: "#e8f5e9", cursor: "default" }} />
                          </td>
                        </tr>
                        <tr style={{ background: "#fff3cd" }}>
                          <td style={{ padding: "4px 10px", fontWeight: "bold", fontFamily: "Courier New, monospace", fontSize: 13, color: "#856404" }}>Closing Jama Gold</td>
                          <td style={{ padding: "2px 6px" }}>
                            <input type="text" value={closingJamaGold.toFixed(3)} readOnly style={{ ...inp, textAlign: "right", fontWeight: "bold", fontSize: 14, background: "#fff3cd", cursor: "default", color: "#856404" }} />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>


            </div>
          </div>

          <div className="flex-between" style={{ marginTop: 20, paddingBottom: 40 }}>
            <button className="btn btn-secondary" onClick={() => router.push("/bills")}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}><Save size={15} />{saving ? "Saving…" : "Save Bill"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
