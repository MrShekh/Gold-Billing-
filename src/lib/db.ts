// ─── Types ────────────────────────────────────────────────────────────────────
export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  createdAt: string;
}

export interface CustomerBalance {
  id: string;
  customer_id: string;
  fine_gold_balance: number;
  cash_balance: number;
  updated_at: string;
}

export interface Profile {
  id: string;
  business_name: string;
  owner_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  gst_no: string;
  updated_at: string;
}

export interface WhatsAppSettings {
  id: string;
  phone_number_id: string;
  access_token: string;
  template_name: string;
  template_language: string;
  enabled: boolean;
}

export interface BillItem {
  id: string;
  type: "ISSUE" | "RECEIVE";
  sno: number;
  amount?: string;
  itemName: string;
  pcs?: string;
  grossWeight?: string;
  adWeight?: string;
  lessWeight?: string;
  description?: string;
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
  time?: string;
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
  prevFineGold?: string;
  closingFineGold?: string;
  createdAt: string;
}

// ─── Helper ───────────────────────────────────────────────────────────────────
async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API error ${res.status}`);
  }
  return res.json();
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────
export async function getProfile(): Promise<Profile | null> {
  try { return await apiFetch("/api/profile"); }
  catch { return null; }
}

export async function updateProfile(data: Partial<Profile>): Promise<Profile | null> {
  try { return await apiFetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); }
  catch { return null; }
}

// WhatsApp — kept as stubs (no longer Supabase-backed, can be implemented separately)
export async function getWhatsAppSettings(): Promise<WhatsAppSettings | null> { return null; }
export async function updateWhatsAppSettings(_data: Partial<WhatsAppSettings>): Promise<WhatsAppSettings | null> { return null; }

// ─── CUSTOMERS ────────────────────────────────────────────────────────────────
export async function getCustomers(): Promise<Customer[]> {
  try { return await apiFetch("/api/customers"); }
  catch { return []; }
}

export async function addCustomer(data: Omit<Customer, "id" | "createdAt">): Promise<Customer | null> {
  try { return await apiFetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); }
  catch { return null; }
}

export async function updateCustomer(id: string, data: Partial<Customer>): Promise<Customer | null> {
  try { return await apiFetch(`/api/customers/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); }
  catch { return null; }
}

export async function deleteCustomer(id: string): Promise<void> {
  try { await apiFetch(`/api/customers/${id}`, { method: "DELETE" }); }
  catch { /* ignore */ }
}

export async function getCustomerById(id: string): Promise<Customer | undefined> {
  try { return await apiFetch(`/api/customers/${id}`); }
  catch { return undefined; }
}

// ─── BILLS ────────────────────────────────────────────────────────────────────
export async function getBills(): Promise<Bill[]> {
  try { return await apiFetch("/api/bills"); }
  catch { return []; }
}

export async function getBillById(id: string): Promise<Bill | undefined> {
  try { return await apiFetch(`/api/bills/${id}`); }
  catch { return undefined; }
}

export async function getBillsByCustomer(customerId: string): Promise<Bill[]> {
  const all = await getBills();
  return all.filter(b => b.customerId === customerId);
}

export async function addBill(data: Omit<Bill, "id" | "createdAt">): Promise<Bill | null> {
  try { return await apiFetch("/api/bills", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); }
  catch { return null; }
}

export async function updateBill(id: string, data: Omit<Bill, "id" | "createdAt">): Promise<Bill | null> {
  try { return await apiFetch(`/api/bills/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); }
  catch { return null; }
}

export async function deleteBill(id: string): Promise<void> {
  try { await apiFetch(`/api/bills/${id}`, { method: "DELETE" }); }
  catch { /* ignore */ }
}

// ─── JAMA BALANCE ─────────────────────────────────────────────────────────────
export async function getCustomerBalance(customerId: string): Promise<CustomerBalance | null> {
  try { return await apiFetch(`/api/balance?customerId=${customerId}`); }
  catch { return null; }
}

export async function recordPayment(customerId: string, paidFineGold: number, paidCash: number): Promise<void> {
  try { await apiFetch("/api/balance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customerId, paidFineGold, paidCash }) }); }
  catch { /* ignore */ }
}

// ─── VOUCHER NO ───────────────────────────────────────────────────────────────
export async function generateVoucherNo(): Promise<string> {
  try {
    const bills = await getBills();
    const num = bills.length + 1;
    return `IR/${String(num).padStart(5, "0")}`;
  } catch {
    return `IR/${String(Date.now()).slice(-5)}`;
  }
}

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────
export async function getDashboardStats() {
  try { return await apiFetch("/api/stats"); }
  catch { return { totalCustomers: 0, totalBills: 0, todayBills: 0, totalJamaGold: 0, totalJamaCash: 0 }; }
}
