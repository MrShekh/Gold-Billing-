import { supabase } from "./supabase";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  createdAt: string;
}

export interface BillItem {
  id: string;
  type: "ISSUE" | "RECEIVE";
  sno: number;
  amount?: string;
  itemName: string;
  pcs?: string;
  grossWeight?: string;
  lessWeight?: string;
  netWeight?: string;
  tunch?: string;
  rate?: string;
  fineGold?: string;
}

export interface PaymentEntry {
  id: string;
  amount: string;
  label: string;
  type: "paid" | "receipt" | "previous";
  voucherNo?: string;
  date?: string;
}

export interface Bill {
  id: string;
  customerId: string;
  customerName: string;
  voucherNo: string;
  date: string;
  items: BillItem[];
  payments: PaymentEntry[];
  paidCash?: string;
  receiptCash?: string;
  previousBalance?: string;
  closingBalance?: string;
  drNaam?: string;
  issueTotalGross?: string;
  issueTotalLess?: string;
  issueTotalNet?: string;
  issueTotalFine?: string;
  recvTotalGross?: string;
  recvTotalLess?: string;
  recvTotalNet?: string;
  recvTotalFine?: string;
  billTotalGross?: string;
  billTotalLess?: string;
  billTotalNet?: string;
  billTotalFine?: string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// ─── CUSTOMERS ────────────────────────────────────────────────────────────────
export async function getCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) { console.error(error); return []; }
  return (data ?? []).map(r => ({
    id: r.id, name: r.name, phone: r.phone ?? "",
    address: r.address ?? "", createdAt: r.created_at,
  }));
}

export async function addCustomer(data: Omit<Customer, "id" | "createdAt">): Promise<Customer | null> {
  const userId = await getUserId();
  if (!userId) return null;
  const { data: row, error } = await supabase
    .from("customers")
    .insert({ user_id: userId, name: data.name, phone: data.phone, address: data.address })
    .select()
    .single();
  if (error) { console.error(error); return null; }
  return { id: row.id, name: row.name, phone: row.phone, address: row.address, createdAt: row.created_at };
}

export async function updateCustomer(id: string, data: Partial<Customer>): Promise<Customer | null> {
  const { data: row, error } = await supabase
    .from("customers")
    .update({ name: data.name, phone: data.phone, address: data.address })
    .eq("id", id).select().single();
  if (error) { console.error(error); return null; }
  return { id: row.id, name: row.name, phone: row.phone, address: row.address, createdAt: row.created_at };
}

export async function deleteCustomer(id: string): Promise<void> {
  await supabase.from("customers").delete().eq("id", id);
}

export async function getCustomerById(id: string): Promise<Customer | undefined> {
  const { data, error } = await supabase.from("customers").select("*").eq("id", id).single();
  if (error || !data) return undefined;
  return { id: data.id, name: data.name, phone: data.phone, address: data.address, createdAt: data.created_at };
}

// ─── BILLS ────────────────────────────────────────────────────────────────────
function mapBillRow(row: Record<string, string>, items: BillItem[], payments: PaymentEntry[]): Bill {
  return {
    id: row.id, customerId: row.customer_id, customerName: row.customer_name,
    voucherNo: row.voucher_no, date: row.date, createdAt: row.created_at,
    paidCash: row.paid_cash, receiptCash: row.receipt_cash,
    previousBalance: row.previous_balance, closingBalance: row.closing_balance,
    drNaam: row.dr_naam,
    issueTotalGross: row.issue_total_gross, issueTotalLess: row.issue_total_less,
    issueTotalNet: row.issue_total_net,     issueTotalFine: row.issue_total_fine,
    recvTotalGross: row.recv_total_gross,   recvTotalLess: row.recv_total_less,
    recvTotalNet: row.recv_total_net,       recvTotalFine: row.recv_total_fine,
    billTotalGross: row.bill_total_gross,   billTotalLess: row.bill_total_less,
    billTotalNet: row.bill_total_net,       billTotalFine: row.bill_total_fine,
    items, payments,
  };
}

function mapItemRow(r: Record<string, string>): BillItem {
  return {
    id: r.id, type: r.type as "ISSUE" | "RECEIVE", sno: Number(r.sno),
    itemName: r.item_name, pcs: r.pcs, grossWeight: r.gross_weight,
    lessWeight: r.less_weight, netWeight: r.net_weight,
    tunch: r.tunch, rate: r.rate, fineGold: r.fine_gold, amount: r.amount,
  };
}

function mapPayRow(r: Record<string, string>): PaymentEntry {
  return { id: r.id, amount: r.amount, label: r.label, type: r.type as PaymentEntry["type"], voucherNo: r.voucher_no, date: r.date };
}

export async function getBills(): Promise<Bill[]> {
  const { data: bills, error } = await supabase.from("bills").select("*").order("created_at", { ascending: false });
  if (error || !bills) return [];

  const billIds = bills.map(b => b.id);
  const [{ data: items }, { data: pays }] = await Promise.all([
    supabase.from("bill_items").select("*").in("bill_id", billIds),
    supabase.from("payment_entries").select("*").in("bill_id", billIds),
  ]);

  return bills.map(b => mapBillRow(
    b,
    (items ?? []).filter(i => i.bill_id === b.id).map(mapItemRow),
    (pays  ?? []).filter(p => p.bill_id === b.id).map(mapPayRow),
  ));
}

export async function getBillById(id: string): Promise<Bill | undefined> {
  const { data: b, error } = await supabase.from("bills").select("*").eq("id", id).single();
  if (error || !b) return undefined;
  const [{ data: items }, { data: pays }] = await Promise.all([
    supabase.from("bill_items").select("*").eq("bill_id", id),
    supabase.from("payment_entries").select("*").eq("bill_id", id),
  ]);
  return mapBillRow(b, (items ?? []).map(mapItemRow), (pays ?? []).map(mapPayRow));
}

export async function getBillsByCustomer(customerId: string): Promise<Bill[]> {
  const all = await getBills();
  return all.filter(b => b.customerId === customerId);
}

export async function addBill(data: Omit<Bill, "id" | "createdAt">): Promise<Bill | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data: row, error } = await supabase.from("bills").insert({
    user_id: userId,
    customer_id: data.customerId,    customer_name: data.customerName,
    voucher_no: data.voucherNo,      date: data.date,
    paid_cash: data.paidCash,        receipt_cash: data.receiptCash,
    previous_balance: data.previousBalance, closing_balance: data.closingBalance,
    dr_naam: data.drNaam,
    issue_total_gross: data.issueTotalGross, issue_total_less: data.issueTotalLess,
    issue_total_net: data.issueTotalNet,     issue_total_fine: data.issueTotalFine,
    recv_total_gross: data.recvTotalGross,   recv_total_less: data.recvTotalLess,
    recv_total_net: data.recvTotalNet,       recv_total_fine: data.recvTotalFine,
    bill_total_gross: data.billTotalGross,   bill_total_less: data.billTotalLess,
    bill_total_net: data.billTotalNet,       bill_total_fine: data.billTotalFine,
  }).select().single();
  if (error) { console.error(error); return null; }

  if (data.items.length > 0) {
    await supabase.from("bill_items").insert(data.items.map(i => ({
      bill_id: row.id, type: i.type, sno: i.sno, item_name: i.itemName,
      pcs: i.pcs, gross_weight: i.grossWeight, less_weight: i.lessWeight,
      net_weight: i.netWeight, tunch: i.tunch, rate: i.rate,
      fine_gold: i.fineGold, amount: i.amount,
    })));
  }
  if (data.payments.length > 0) {
    await supabase.from("payment_entries").insert(data.payments.map(p => ({
      bill_id: row.id, amount: p.amount, label: p.label,
      type: p.type, voucher_no: p.voucherNo, date: p.date,
    })));
  }
  return getBillById(row.id) as Promise<Bill>;
}

export async function updateBill(id: string, data: Omit<Bill, "id" | "createdAt">): Promise<Bill | null> {
  const { error: err1 } = await supabase.from("bills").update({
    customer_id: data.customerId,    customer_name: data.customerName,
    voucher_no: data.voucherNo,      date: data.date,
    paid_cash: data.paidCash,        receipt_cash: data.receiptCash,
    previous_balance: data.previousBalance, closing_balance: data.closingBalance,
    dr_naam: data.drNaam,
    issue_total_gross: data.issueTotalGross, issue_total_less: data.issueTotalLess,
    issue_total_net: data.issueTotalNet,     issue_total_fine: data.issueTotalFine,
    recv_total_gross: data.recvTotalGross,   recv_total_less: data.recvTotalLess,
    recv_total_net: data.recvTotalNet,       recv_total_fine: data.recvTotalFine,
    bill_total_gross: data.billTotalGross,   bill_total_less: data.billTotalLess,
    bill_total_net: data.billTotalNet,       bill_total_fine: data.billTotalFine,
  }).eq("id", id);
  if (err1) { console.error(err1); return null; }

  await Promise.all([
    supabase.from("bill_items").delete().eq("bill_id", id),
    supabase.from("payment_entries").delete().eq("bill_id", id)
  ]);

  if (data.items.length > 0) {
    await supabase.from("bill_items").insert(data.items.map(i => ({
      bill_id: id, type: i.type, sno: i.sno, item_name: i.itemName,
      pcs: i.pcs, gross_weight: i.grossWeight, less_weight: i.lessWeight,
      net_weight: i.netWeight, tunch: i.tunch, rate: i.rate,
      fine_gold: i.fineGold, amount: i.amount,
    })));
  }
  if (data.payments.length > 0) {
    await supabase.from("payment_entries").insert(data.payments.map(p => ({
      bill_id: id, amount: p.amount, label: p.label,
      type: p.type, voucher_no: p.voucherNo, date: p.date,
    })));
  }
  return getBillById(id) as Promise<Bill>;
}

export async function deleteBill(id: string): Promise<void> {
  await supabase.from("bills").delete().eq("id", id);
}

export async function generateVoucherNo(): Promise<string> {
  const { count } = await supabase.from("bills").select("*", { count: "exact", head: true });
  const num = (count ?? 0) + 1;
  return `IR/${String(num).padStart(5, "0")}`;
}

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────
export async function getDashboardStats() {
  const today = new Date().toISOString().slice(0, 10);
  const [{ count: totalCustomers }, { count: totalBills }, { count: todayBills }] = await Promise.all([
    supabase.from("customers").select("*", { count: "exact", head: true }),
    supabase.from("bills").select("*", { count: "exact", head: true }),
    supabase.from("bills").select("*", { count: "exact", head: true }).eq("date", today),
  ]);
  return {
    totalCustomers: totalCustomers ?? 0,
    totalBills:     totalBills     ?? 0,
    todayBills:     todayBills     ?? 0,
  };
}
