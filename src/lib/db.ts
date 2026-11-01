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

// ─── PROFILE CACHE ────────────────────────────────────────────────────────────
const PROFILE_CACHE_KEY = "goldbill_profile";

// ─── DATA CACHE (stale-while-revalidate) ──────────────────────────────────────
// Last-known list data is kept in localStorage so pages can paint instantly
// while fresh data is fetched in the background.
const DATA_CACHE_PREFIX = "gb_cache_";

export function peekCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DATA_CACHE_PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeCache(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(DATA_CACHE_PREFIX + key, JSON.stringify(value)); } catch {}
}

export function clearDataCache() {
  if (typeof window === "undefined") return;
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(DATA_CACHE_PREFIX) || k === PROFILE_CACHE_KEY)
      .forEach((k) => localStorage.removeItem(k));
  } catch {}
}

async function cachedFetch<T>(key: string, url: string): Promise<T> {
  const data = await apiFetch(url);
  writeCache(key, data);
  return data as T;
}

export function getCachedProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCachedProfile(p: Profile | null) {
  if (typeof window === "undefined") return;
  try {
    if (p) localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(p));
    else localStorage.removeItem(PROFILE_CACHE_KEY);
  } catch {}
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────
export async function getProfile(): Promise<Profile | null> {
  const cached = getCachedProfile();
  try {
    const res = await apiFetch("/api/profile");
    if (res) setCachedProfile(res);
    return res || cached;
  } catch {
    return cached;
  }
}

export async function updateProfile(data: Partial<Profile>): Promise<Profile | null> {
  try {
    const res = await apiFetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res) setCachedProfile(res);
    return res;
  } catch {
    return null;
  }
}

// WhatsApp — kept as stubs (no longer Supabase-backed, can be implemented separately)
export async function getWhatsAppSettings(): Promise<WhatsAppSettings | null> { return null; }
export async function updateWhatsAppSettings(_data: Partial<WhatsAppSettings>): Promise<WhatsAppSettings | null> { return null; }

// ─── CUSTOMERS ────────────────────────────────────────────────────────────────
export async function getCustomers(): Promise<Customer[]> {
  try { return await cachedFetch<Customer[]>("customers", "/api/customers"); }
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
  try { return await cachedFetch<Bill[]>("bills", "/api/bills"); }
  catch { return []; }
}

export async function getBillById(id: string): Promise<Bill | undefined> {
  try { return await apiFetch(`/api/bills/${id}`); }
  catch { return undefined; }
}

export async function getBillsByCustomer(customerId: string): Promise<Bill[]> {
  try {
    return await apiFetch(`/api/bills?customerId=${customerId}`);
  } catch {
    return [];
  }
}

export async function addBill(data: Omit<Bill, "id" | "createdAt">): Promise<Bill | null> {
  try {
    return await apiFetch("/api/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {
    return null;
  }
}

export async function updateBill(id: string, data: Partial<Bill>): Promise<Bill | null> {
  try {
    return await apiFetch(`/api/bills/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {
    return null;
  }
}

export async function deleteBill(id: string): Promise<void> {
  try {
    await apiFetch(`/api/bills/${id}`, { method: "DELETE" });
  } catch {
    /* ignore */
  }
}

// ─── JAMA BALANCE ─────────────────────────────────────────────────────────────
export async function getAllCustomerBalances(): Promise<CustomerBalance[]> {
  try { return await cachedFetch<CustomerBalance[]>("balances", "/api/balance"); }
  catch { return []; }
}

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
    const res = await apiFetch("/api/bills?vno=1");
    if (res && res.nextVno) return res.nextVno;
    const bills = await getBills();
    const num = bills.length + 1;
    return `IR/${String(num).padStart(5, "0")}`;
  } catch {
    return `IR/${String(Date.now()).slice(-5)}`;
  }
}

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────
export async function getDashboardStats() {
  try { return await cachedFetch<any>("stats", "/api/stats"); }
  catch { return { totalCustomers: 0, totalBills: 0, todayBills: 0, totalJamaGold: 0, totalJamaCash: 0, totalAdvanceGold: 0, totalAdvanceCash: 0, advanceCustomerCount: 0 }; }
}
