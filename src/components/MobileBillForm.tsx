"use client";
import { PlusCircle, Trash2, ChevronDown, Save } from "lucide-react";
import type { BillItem, Customer, CustomerBalance } from "@/lib/db";

/**
 * Phone presentation of the bill-entry form (New Bill + Edit Bill).
 *
 * It is purely presentational: every value, calculation and handler comes from
 * the page that renders it, so there is a single source of truth and the
 * desktop paper sheet is untouched. Shown only at <= 768px (see .mobile-bill-form).
 */

export type Kind = "ISSUE" | "RECEIVE";

export interface BillTotals {
  iG: string; iA: string; iL: string; iN: string; iF: string;
  rG: string; rA: string; rL: string; rN: string; rF: string;
  tG: string; tA: string; tL: string; tN: string; tF: string;
}

export interface JamaFigures {
  prev: number;
  issue: number;
  totalDue: number;
  recv: number;
  closing: number;
}

interface Props {
  customers: Customer[];
  cid: string;
  onCustomerSelect: (id: string) => void;
  vno: string;
  setVno: (v: string) => void;
  date: string;
  setDate: (v: string) => void;
  time: string;
  setTime: (v: string) => void;
  jamaBalance: CustomerBalance | null;
  jamaLoading: boolean;
  issue: BillItem[];
  recv: BillItem[];
  onAdd: (kind: Kind) => void;
  onRemove: (kind: Kind, idx: number) => void;
  onUpdate: (kind: Kind, idx: number, field: keyof BillItem, value: string) => void;
  totals: BillTotals;
  cash: JamaFigures;
  gold: JamaFigures;
  onSave?: () => void;
  saving?: boolean;
}

type Tone = "adv" | "due" | "clear";

const goldTone = (v: number): Tone => (v < -0.0001 ? "adv" : v > 0.0001 ? "due" : "clear");
const cashTone = (v: number): Tone => (v < -0.01 ? "adv" : v > 0.01 ? "due" : "clear");
const toneLabel: Record<Tone, string> = { adv: "Advance", due: "Due", clear: "Cleared" };

const fmtG = (v: number) => `${Math.abs(v).toFixed(3)} g`;
const fmtC = (v: number) =>
  `₹${Math.abs(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Bill totals: a negative net (more received than issued) is shown as "R", as on the desktop sheet.
const fmtBillNet = (s: string) => {
  const n = parseFloat(s);
  return n < 0 ? `${Math.abs(n).toFixed(3)} R` : s || "0.000";
};

function Field({
  label, value, onChange, placeholder, numeric, decimal = true, full,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  numeric?: boolean;
  decimal?: boolean;
  full?: boolean;
}) {
  return (
    <div className={full ? "mb-field mb-full" : "mb-field"}>
      <label className="mb-label">{label}</label>
      <input
        className="mb-input"
        type={numeric ? "number" : "text"}
        inputMode={numeric ? (decimal ? "decimal" : "numeric") : undefined}
        step={numeric ? "any" : undefined}
        enterKeyHint="next"
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function ItemCard({
  kind, idx, item, onUpdate, onRemove,
}: {
  kind: Kind;
  idx: number;
  item: BillItem;
  onUpdate: Props["onUpdate"];
  onRemove: Props["onRemove"];
}) {
  const up = (f: keyof BillItem) => (v: string) => onUpdate(kind, idx, f, v);
  return (
    <div className={`mb-item ${kind === "RECEIVE" ? "recv" : ""}`}>
      <div className="mb-item-head">
        <span className="mb-item-title">Item {String(idx + 1).padStart(2, "0")}</span>
        <button
          type="button"
          className="mb-icon-btn danger"
          aria-label={`Remove item ${idx + 1}`}
          onClick={() => onRemove(kind, idx)}
        >
          <Trash2 size={15} />
        </button>
      </div>
      <div className="mb-grid">
        <Field full label="Item Name" value={item.itemName} onChange={up("itemName")} placeholder="Enter item name" />
        <Field numeric label="Amount" value={item.amount} onChange={up("amount")} placeholder="0.00" />
        <Field numeric decimal={false} label="Pieces" value={item.pcs} onChange={up("pcs")} placeholder="0" />
        <Field numeric label="Gross Weight" value={item.grossWeight} onChange={up("grossWeight")} placeholder="0.000" />
        <Field numeric label="AD Weight" value={item.adWeight} onChange={up("adWeight")} placeholder="0.000" />
        <Field numeric label="Less Weight" value={item.lessWeight} onChange={up("lessWeight")} placeholder="0.000" />
        <Field numeric label="Tunch %" value={item.tunch} onChange={up("tunch")} placeholder="0.00" />
        <Field numeric label="Rate" value={item.rate} onChange={up("rate")} placeholder="0.00" />
        <Field full label="Description" value={item.description} onChange={up("description")} placeholder="Description" />
      </div>
      <div className={`mb-calc ${kind === "RECEIVE" ? "recv" : ""}`} aria-label="Calculated values">
        <div>
          <span>Net Weight</span>
          <strong>{item.netWeight || "0.000"} g</strong>
        </div>
        <div>
          <span>Fine Gold</span>
          <strong>{item.fineGold || "0.000"} g</strong>
        </div>
      </div>
    </div>
  );
}

function TotalsBlock({
  title, g, a, l, n, f, kind,
}: {
  title: string; g: string; a: string; l: string; n: string; f: string; kind?: "recv" | "bill";
}) {
  const cell = (label: string, v: string, strong?: boolean) => (
    <div className={strong ? "strong" : ""}>
      <span>{label}</span>
      <strong>{v}</strong>
    </div>
  );
  return (
    <div className={`mb-totals ${kind ?? ""}`}>
      <div className="mb-totals-title">{title}</div>
      <div className="mb-totals-grid">
        {cell("Gross", g || "0.000")}
        {cell("AD", a || "0.000")}
        {cell("Less", l || "0.000")}
        {cell("Net", n || "0.000", true)}
        {cell("Fine", f || "0.000", true)}
      </div>
    </div>
  );
}

function JamaRow({ label, value, tone, strong }: { label: string; value: string; tone?: Tone; strong?: boolean }) {
  return (
    <div className={`mb-row ${strong ? "strong" : ""}`}>
      <span>{label}</span>
      <span className={tone ? `tone-${tone}` : ""}>{value}</span>
    </div>
  );
}

export default function MobileBillForm(p: Props) {
  const { totals: t } = p;
  const prevTone = goldTone(p.jamaBalance?.fine_gold_balance ?? 0);

  const closingGoldTone = goldTone(p.gold.closing);
  const closingCashTone = cashTone(p.cash.closing);

  const section = (kind: Kind, items: BillItem[]) => (
    <>
      <div className={`mb-section-head ${kind === "RECEIVE" ? "recv" : ""}`}>
        <h3>{kind === "ISSUE" ? "ISSUE" : "RECEIVE"}</h3>
        <button type="button" className="mb-add" onClick={() => p.onAdd(kind)}>
          <PlusCircle size={14} /> Add Item
        </button>
      </div>
      {items.length === 0 && (
        <div className="mb-hint">
          {kind === "ISSUE" ? "Add the jewellery issued to the customer." : "Use the same item-entry layout for received jewellery."}
        </div>
      )}
      {items.map((item, idx) => (
        <ItemCard key={item.id} kind={kind} idx={idx} item={item} onUpdate={p.onUpdate} onRemove={p.onRemove} />
      ))}
    </>
  );

  return (
    <div className="mobile-bill-form">
      {/* Bill header */}
      <div className="mb-card">
        <label className="mb-label" htmlFor="mb-customer">Customer</label>
        <div className="mb-select-wrap">
          <select
            id="mb-customer"
            className="mb-input mb-select"
            value={p.cid}
            onChange={(e) => p.onCustomerSelect(e.target.value)}
          >
            <option value="">Select Customer</option>
            {p.customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <ChevronDown size={16} className="mb-select-icon" />
        </div>

        {p.jamaLoading && <div className="mb-muted">Loading balance…</div>}
        {!p.jamaLoading && p.cid && p.jamaBalance && (
          <div className={`mb-alert tone-box-${prevTone === "adv" ? "adv" : "due"}`}>
            <strong>{prevTone === "adv" ? "Advance in Stock" : "Previous Due"}</strong>
            <span>
              {fmtG(p.jamaBalance.fine_gold_balance ?? 0)} &nbsp;·&nbsp; {fmtC(p.jamaBalance.cash_balance ?? 0)}
            </span>
          </div>
        )}

        <div className="mb-grid" style={{ marginTop: 10 }}>
          <Field full label="Voucher No" value={p.vno} onChange={p.setVno} />
          <div className="mb-field">
            <label className="mb-label">Date</label>
            <input className="mb-input" type="date" value={p.date} onChange={(e) => p.setDate(e.target.value)} />
          </div>
          <div className="mb-field">
            <label className="mb-label">Time</label>
            <input className="mb-input" type="time" value={p.time} onChange={(e) => p.setTime(e.target.value)} />
          </div>
        </div>
      </div>

      {section("ISSUE", p.issue)}
      <TotalsBlock title="Issue Total" g={t.iG} a={t.iA} l={t.iL} n={t.iN} f={t.iF} />

      {section("RECEIVE", p.recv)}
      <TotalsBlock title="Receive Total" kind="recv" g={t.rG} a={t.rA} l={t.rL} n={t.rN} f={t.rF} />

      <div className="mb-totals bill">
        <div className="mb-totals-title">Bill Total (Issue − Receive)</div>
        <div className="mb-totals-grid">
          <div><span>Gross</span><strong>{fmtBillNet(t.tG)}</strong></div>
          <div><span>AD</span><strong>{fmtBillNet(t.tA)}</strong></div>
          <div><span>Less</span><strong>{fmtBillNet(t.tL)}</strong></div>
          <div className="strong"><span>Net</span><strong>{fmtBillNet(t.tN)}</strong></div>
          <div className="strong"><span>Fine</span><strong>{fmtBillNet(t.tF)}</strong></div>
        </div>
      </div>

      {/* Jama: compact summary first, full breakdown below */}
      <div className="mb-jama-summary">
        <div className={`tone-box-${closingCashTone}`}>
          <span>CASH JAMA</span>
          <strong>{fmtC(p.cash.closing)}</strong>
          <em>{toneLabel[closingCashTone]}</em>
        </div>
        <div className={`tone-box-${closingGoldTone}`}>
          <span>FINE GOLD JAMA</span>
          <strong>{fmtG(p.gold.closing)}</strong>
          <em>{toneLabel[closingGoldTone]}</em>
        </div>
      </div>

      <div className="mb-card">
        <div className="mb-card-title">Cash Jama</div>
        <JamaRow label="Previous Balance" value={fmtC(p.cash.prev)} tone={cashTone(p.cash.prev)} />
        <JamaRow label="This Bill Issue Cash" value={fmtC(p.cash.issue)} />
        <JamaRow label="Total Cash Due" value={fmtC(p.cash.totalDue)} />
        <JamaRow label="Received Cash" value={fmtC(p.cash.recv)} />
        <JamaRow
          strong
          label="Closing Cash"
          value={`${fmtC(p.cash.closing)} ${toneLabel[closingCashTone]}`}
          tone={closingCashTone}
        />
      </div>

      <div className="mb-card">
        <div className="mb-card-title">Fine Gold Jama</div>
        <JamaRow label="Previous Balance" value={fmtG(p.gold.prev)} tone={goldTone(p.gold.prev)} />
        <JamaRow label="This Bill Issue" value={fmtG(p.gold.issue)} />
        <JamaRow label="Total Fine Due" value={fmtG(p.gold.totalDue)} />
        <JamaRow label="Received Fine" value={fmtG(p.gold.recv)} />
        <JamaRow
          strong
          label="Closing Fine Gold"
          value={`${fmtG(p.gold.closing)} ${toneLabel[closingGoldTone]}`}
          tone={closingGoldTone}
        />
      </div>

      {p.onSave && (
        <div style={{ marginTop: 16, marginBottom: 40 }}>
          <button
            type="button"
            className="mb-save-btn"
            onClick={p.onSave}
            disabled={p.saving}
          >
            <Save size={18} />
            {p.saving ? "Saving Bill…" : "Save Bill"}
          </button>
        </div>
      )}
    </div>
  );
}
