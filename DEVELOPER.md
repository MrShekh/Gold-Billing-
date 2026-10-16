# Gold Billing System - Developer Guide

Developer reference for the **Gold Billing System**: architecture, tech stack, every feature, data model, API surface, end-to-end workflows, setup, and how to extend the code.

## 1. Project Overview

A **desktop-first** web app (Next.js), with a responsive mobile layout, for jewellers to manage customers, create ISSUE/RECEIVE jewellery bills with weight and purity maths, keep a running per-customer **Jama** (gold + cash) ledger, track **Advance Stock**, manage a separate **Cash** ledger for third parties, print or WhatsApp invoices, and back up data. It can be wrapped as an Android/iOS app with Capacitor.

> [!NOTE]
> The project originally used Supabase. It now runs on **MongoDB (Mongoose) + custom JWT auth**. `SUPABASE_*.sql` files and `Addtions/` docs are legacy; Supabase is not used at runtime.

## 2. Tech Stack

| Area | Technology |
|------|-----------|
| Framework | Next.js 16.2.4 (App Router, `src/app`), React 19, TypeScript 5 |
| Styling | Tailwind CSS v4 + custom CSS (`globals.css`), light/dark theme via `data-theme` |
| Icons | `lucide-react` |
| Database | MongoDB via `mongoose` 9 (cached connection in `src/lib/mongoose.ts`) |
| Auth | `bcryptjs` (hashing, cost 12), `jsonwebtoken` (30-day JWT in `auth_token` httpOnly cookie) |
| Email | `nodemailer` with Gmail SMTP (password-reset OTP) |
| Printing / PDF | `react-to-print`, `html2canvas`, `html2pdf.js`, `jspdf` |
| WhatsApp | External WhatsApp service (`WHATSAPP_SERVICE_URL`, default `http://localhost:5001`) |
| Mobile | Capacitor (`com.goldapp.billing`, app name "Gold Billing") |

## 3. Folder Structure

```
gold-billing/
├── android/                    # Capacitor Android project
├── Addtions/                   # Legacy/extra docs (WhatsApp notes, old Supabase SQL)
├── public/                     # Static assets (Assests/AppIcon.png)
├── src/
│   ├── app/
│   │   ├── page.tsx            # Dashboard
│   │   ├── login/              # Login / first-time setup / forgot password (OTP)
│   │   ├── customers/          # Customer list (CRUD) + [id]/ ledger page
│   │   ├── bills/              # list, new/, edit/, view/ (print)
│   │   ├── stock/              # Advance Stock
│   │   ├── cash/               # Third-party Cash ledger
│   │   ├── profile/            # Business profile, theme, backup, logout (Settings)
│   │   ├── dev/                # Developer portal (protected by DEV_SECRET)
│   │   ├── api/                # Route handlers (see section 7)
│   │   ├── layout.tsx          # Root layout (AuthProvider, fonts)
│   │   └── globals.css
│   ├── components/
│   │   ├── AuthGuard.tsx       # Redirects unauthenticated users to /login
│   │   ├── Sidebar.tsx         # Desktop nav
│   │   ├── BottomNav.tsx       # Mobile nav
│   │   ├── BillPrint.tsx       # Print layout for invoices
│   │   └── WhatsAppBillButton.tsx
│   ├── lib/
│   │   ├── db.ts               # Client-side API wrapper (apiFetch) + types
│   │   ├── AuthProvider.tsx    # React auth context
│   │   ├── authHelper.ts       # getAuthUserId(req) - JWT cookie -> userId
│   │   ├── mongoose.ts         # connectDB() with cache + one-time migration
│   │   ├── migrateUserId.ts    # Stamps userId on legacy docs
│   │   ├── recalcLedger.ts     # recalculateCustomerLedger()
│   │   ├── email.ts            # sendOtpEmail()
│   │   └── supabase.ts         # Legacy
│   └── models/                 # Mongoose models (see section 6)
├── capacitor.config.ts
├── next.config.ts              # images.unoptimized; dynamic rendering (API routes)
└── package.json
```

## 4. Features

### 4.1 Authentication & Accounts
- **First-run setup:** if no user exists, `/login` shows the setup form (`POST /api/auth/setup`). It works only while the `users` collection is empty.
- **Login:** by email or username (`POST /api/auth/login`), returns a 30-day JWT cookie. Logout: `POST /api/auth/logout`. Session check: `GET /api/auth/me`.
- **Invite-only registration:** `POST /api/auth/register` needs a valid invite code (`XXXX-XXXX-XXXX`) that is not expired and is under its `maxUses`. Passwords must be at least 8 characters. Email and username must be unique.
- **Invite code admin:** `/api/admin/invite-codes` (GET list, POST create with `maxUses`, `expiryDays`, `note`, DELETE revoke). It requires a logged-in user.
- **Forgot password:** email -> 6-digit OTP via Gmail (valid 10 minutes) -> `reset-password` with email, OTP and new password. The forgot response never reveals whether an email exists.
- **Route protection:** `AuthGuard` on pages, `getAuthUserId()` on APIs. All data is scoped by `userId` (multi-tenant).

### 4.2 Dashboard (`/`)
Total customers, total bills, today's bills, total Jama gold (g) and cash (₹), recent bills and customers. Data comes from `GET /api/stats`.

### 4.3 Customer Management (`/customers`, `/customers/[id]`)
- CRUD: name (required), phone (required), address.
- **Customer ledger page:** profile, current Jama balance, all bills (sort asc/desc, expandable item details), links to view/print, and a **Record Payment** modal (gold and/or cash).
- Deleting a customer also deletes their bills and balance.

### 4.4 Billing (`/bills`, `/bills/new`, `/bills/edit`, `/bills/view`)
- Two transaction types per bill: **ISSUE** (given to customer) and **RECEIVE** (taken from customer).
- Item columns: S.No, Amount, Item Name, Pcs, Gross, AD Weight, Less, Description, Net, Tunch %, Rate, Fine Gold.
- **Auto-calculations:**
  - Net = Gross − AD − Less
  - Fine = Net × Tunch / 100
  - Section totals (issue, receive) and bill totals (Issue − Receive)
- Voucher numbers follow `IR/00001`, generated by `generateVoucherNo()` (bill count + 1).
- Extra cash fields: `paidCash`, `receiptCash`, `drNaam`, and `payments[]` entries (`paid` | `receipt` | `previous`).
- Edit, delete, search and list bills. Printing uses `BillPrint` with fixed paper-size column widths.
- Bills store `date` (YYYY-MM-DD) and optional `time`. Numeric values are stored as **strings**.

### 4.5 Jama Ledger (running balance)
- Per customer: `fineGoldBalance` (g, 3 decimals) and `cashBalance` (₹, 2 decimals).
- **Sign convention:** positive = *Due* (customer owes shop); negative = *Advance* (customer has deposited extra).
- Balances are never patched incrementally. After every bill create/edit/delete, `recalculateCustomerLedger(userId, customerId)` replays all of the customer's bills sorted by `date` then `createdAt`:
  - per bill: `billFineNet = ΣISSUE fine − ΣRECEIVE fine` and `billCashNet = ΣISSUE amount − ΣRECEIVE amount`
  - it writes `prevFineGold`, `closingFineGold`, `previousBalance`, `closingBalance`, `billTotalFine` onto each bill
  - it upserts `CustomerBalance`
- Editing or deleting an old bill therefore cascades to all later bills. If a bill moves to another customer, both ledgers are recalculated.
- **Record Payment** (`POST /api/balance`): subtracts `paidFineGold` and `paidCash` from the customer's balance.
- **`POST /api/cleanup`:** one-off tool that rebuilds all balances from bills.

### 4.6 Advance Stock (`/stock`)
Aggregates customers whose balance is negative (they hold advance with the shop). It shows total **Advance Gold Stock** (g) and **Advance Cash Stock** (₹), with a per-customer breakdown.

### 4.7 Cash Ledger (`/cash`)
A separate ledger of third-party people, independent of customer bills.
- `CashPerson` (name, phone) with `CashEntry` rows: `GIVEN` (client gave cash to the person) or `RECEIVED`.
- Balance = Σ GIVEN − Σ RECEIVED. Positive means the person owes the client; negative means the client owes the person.
- **Settle** (`POST /api/cash/[id]` with `{settle:true, amount?}`) creates an `isSettlement` entry that zeroes the balance.
- Edit person (PUT), delete a single entry (`DELETE ?entryId=`), clear all transactions (keeps person), or delete the person.

### 4.8 WhatsApp Integration
- `WhatsAppBillButton` generates the bill PDF in the browser and posts it to `POST /api/whatsapp/send`.
- The server strips the phone to digits, forwards to `{WHATSAPP_SERVICE_URL}/send-bill`, and records a `WhatsAppLog` (`sent` or `failed` plus `errorMsg`).
- `POST /api/whatsapp/test` checks connectivity. The button is disabled when the customer has no phone.

### 4.9 Settings / Profile (`/profile`)
- Business profile: business name, owner, phone, email, address, city, GST no.
- Theme toggle (light/dark, persisted in `localStorage`).
- **Local backup:** downloads a JSON export from `GET /api/backup`.
- Logout.

### 4.10 Developer Portal (`/dev`)
Protected by the `x-dev-secret` header, which must match `DEV_SECRET`. Via `/api/dev/users` it can list users (passwords masked), reset any user's password (POST), create a user (PUT), and delete a user (DELETE). Use it for onboarding and support.

### 4.11 Navigation
- Desktop `Sidebar`: Dashboard, Customers, Bills, New Bill, Advance Stock, Cash, Settings.
- Mobile `BottomNav`: Home, Customers, **New Bill** (highlighted), Bills, Settings.

## 5. Key Workflows

### 5.1 First-time onboarding
1. Set env vars and start the app.
2. Open `/login`. With an empty DB it shows **Setup**. Create the owner account (auto-logged in).
3. The owner generates invite codes (`/api/admin/invite-codes`) for more users, who register with them.
4. `connectDB()` runs `migrateUserIds()` once per process. It stamps legacy docs that lack `userId` with the first user's id.

### 5.2 Create a bill
1. `/bills/new`: pick a customer. The current Jama balance is fetched and shown.
2. Add ISSUE and RECEIVE rows. Net, fine and totals compute live.
3. Add cash or payment entries if needed. The voucher number is auto-assigned.
4. Save: `POST /api/bills` creates the bill, then `recalculateCustomerLedger` fills previous/closing balances and updates `CustomerBalance`.
5. Redirect to view. From there: **Print** or **Send on WhatsApp**.

### 5.3 Edit or delete a bill
`PUT/DELETE /api/bills/[id]` -> save change -> recalculate the customer's whole ledger (and the old customer's if the customer changed).

### 5.4 Receive a payment from a customer
Customer ledger -> **Record Payment** -> enter gold and/or cash -> `POST /api/balance` -> balance reduces. Negative results show as Advance and appear in Advance Stock.

### 5.5 Password reset
`/login` -> Forgot -> enter email -> receive OTP (10 min) -> enter OTP and new password -> log in.

### 5.6 Send bill on WhatsApp
Bill view -> WhatsApp button -> PDF built client-side -> `/api/whatsapp/send` -> WhatsApp service -> log saved.

### 5.7 Backup and recovery
Settings -> Download backup (JSON). Run `/api/cleanup` if balances ever look inconsistent.

## 6. UI Design & Responsiveness

The software is designed **primarily for desktop** (a counter or shop PC). The primary experience is a wide, dense, keyboard-friendly layout for entering bill rows. A mobile layout is added below 768px via CSS media queries, with no separate mobile codebase. All styling is in `src/app/globals.css`, plus inline styles and CSS grid in pages.

### 6.1 Design language
- **Look:** premium dark UI by default (near-black backgrounds, charcoal cards) with a **gold accent**, matching the jewellery theme. A light theme is available.
- **Fonts** (Google Fonts, loaded in `layout.tsx`): `Inter` (300–800) for UI text and `Courier Prime` / `Courier New` monospace for bills, voucher numbers and weights, so numbers align.
- **Theming:** CSS variables on `:root`, overridden by `[data-theme="light"]`. An inline script in `<head>` reads `localStorage.theme` before paint (no flash). The toggle is in Settings.

| Token | Dark | Light |
|-------|------|-------|
| `--bg-primary` | `#0a0a0f` | `#f4f5f7` |
| `--bg-secondary` (sidebar/header) | `#111118` | `#ffffff` |
| `--bg-card` | `#16161f` | `#ffffff` |
| `--border` | `#2a2a3a` | `#e5e7eb` |
| `--text-primary` / `--text-secondary` | `#f0f0f8` / `#8888a8` | `#111827` / `#4b5563` |
| `--accent` (gold) | `#d4a843` | `#b8860b` |
| `--danger` / `--success` / `--info` | `#e05a5a` / `#4caf7d` / `#5a9ae0` | `#ef4444` / `#10b981` / `#3b82f6` |

Always use these variables (`var(--accent)`, etc.) instead of hard-coded colours so both themes keep working.

### 6.2 Desktop layout (default, above 768px)
```
┌──────────┬─────────────────────────────────────────┐
│ Sidebar  │ .page-header  (title + subtitle)        │
│ 240px    ├─────────────────────────────────────────┤
│ fixed    │ .page-content (padding 28px 32px)       │
│ left     │  stat cards / tables / bill form        │
└──────────┴─────────────────────────────────────────┘
```
- **`.sidebar`**: 240px wide, `position: fixed` full-height, with logo block and `.nav-item` links (the active item is gold-highlighted). Rendered by `Sidebar.tsx`.
- **`.main-layout`**: `margin-left: 240px`, so content never sits under the sidebar.
- **`.page-header`** (title, description, bottom border) and **`.page-content`** are the standard page skeleton. Every page is built as `<Sidebar/>` + `<div className="main-layout">`.
- **Components:** `.stat-card` (hover lift, gold glow, icon), `.btn` with `-primary`/`-secondary`/`-danger` and `-sm`/`-xs` sizes, `.badge` (`-gold`, `-green`), `.modal-overlay` + `.modal-box`, `.search-bar`, `.bills-filter-bar`, `.grid-2` helper.
- **Dashboard grid:** `repeat(auto-fit, minmax(240px, 1fr))`, so cards reflow automatically with width.
- **Tables** (customers, bills, recent lists) are full width, wrapped in `.table-responsive` (`overflow-x: auto`) so they scroll horizontally instead of breaking.
- **Bill entry** uses a wide multi-column row (see the column width table in section 10): Amount, Item, Pcs, Gross, AD, Less, Description, Net, Tunch, Rate, Fine. It shows a live totals panel and the customer's Jama balance. Narrow fixed-pixel columns allow all 12 fields on one line on a desktop screen.

### 6.3 Responsive behaviour (mobile and tablet)
| Breakpoint | Behaviour |
|-----------|-----------|
| `> 768px` | Desktop: fixed sidebar, 32px content padding, multi-column grids |
| `≤ 768px` | Sidebar slides off-canvas (`translateX(-100%)`, opens via `.sidebar.open` with a `.sidebar-overlay`). `.main-layout` margin-left becomes 0, with `padding-bottom: 80px` to clear the bottom nav. A `.mobile-header` (hamburger) and fixed **`.bottom-nav`** (62px, blurred background) appear. Smaller `page-header` padding, stat cards, buttons and values. A `.mobile-save-bar` appears on bill forms. |
| `≤ 480px` | Tighter padding (14px). Bill item fields stack to one column (`.mobile-item-fields`), section totals become 2 columns, and the bill header row stacks. |

- **Bottom nav (`BottomNav.tsx`)**: Home, Customers, **New Bill** (highlighted centre action), Bills, Settings. Hidden on desktop.
- **Bill form on mobile:** the wide row becomes stacked per-item cards (`.mobile-item-fields`), and a sticky save bar keeps the action reachable.
- The viewport meta uses `width=device-width, initial-scale=1, maximum-scale=1` (no pinch zoom), with iOS/Android web-app meta tags and `theme-color: #0a0a0f`.
- When adding a page, test at 1440px, 768px and 375px.

### 6.4 Print / PDF layout
- `@media print` hides everything (`body * { visibility: hidden }`) except `.print-area`, which is positioned fixed at full width on a white background. Add `.no-print` to any element that must not print (buttons, nav).
- The invoice (`BillPrint.tsx`, `.bill-print-container`, `.bill-table`) is always white and monospace regardless of the app theme. It uses fixed table layout with percentage column widths so it is paper-exact. The same component feeds the WhatsApp PDF capture (`html2canvas` / `html2pdf.js`).

### 6.5 UI conventions for contributors
1. Build pages from the existing classes (`page-header`, `page-content`, `stat-card`, `btn`, `modal-*`) before writing inline styles.
2. Design for desktop first, then add overrides inside the existing `@media (max-width: 768px)` / `480px` blocks.
3. Wrap wide tables in `.table-responsive`.
4. Use `var(--token)` colours and check both themes.
5. Show numbers in the monospace font; gold in 3 decimals, cash in 2 decimals.
6. Mark non-printable controls with `no-print`.

## 7. Database (MongoDB collections)

All user data documents carry `userId` (string) and use timestamps.

| Model | Key fields |
|-------|-----------|
| `User` | email (unique, lowercase), username (unique), password (bcrypt), phone?, resetOtp?, resetOtpExpiry? |
| `InviteCode` | code (unique), createdBy, expiresAt, maxUses, usedCount, usedBy[], note |
| `Profile` | userId (unique), businessName, ownerName, phone, email, address, city, gstNo |
| `Customer` | userId, name, phone, address |
| `Bill` | userId, customerId, customerName, voucherNo, date, time, `items[]`, `payments[]`, paidCash, receiptCash, drNaam, previousBalance, closingBalance, prevFineGold, closingFineGold, issue/recv/bill totals (Gross, Less, Net, Fine) |
| `Bill.items[]` | type (`ISSUE`/`RECEIVE`), sno, itemName, pcs, grossWeight, adWeight, lessWeight, description, netWeight, tunch, rate, fineGold, amount |
| `Bill.payments[]` | type (`paid`/`receipt`/`previous`), amount, label, voucherNo, date |
| `CustomerBalance` | userId, customerId, fineGoldBalance, cashBalance. Unique index `(userId, customerId)` |
| `CashPerson` | userId, name, phone |
| `CashEntry` | userId, personId, type (`GIVEN`/`RECEIVED`), amount (≥ 0.01), note, isSettlement, date |
| `WhatsAppLog` | userId, billId, customerId?, phone, messageId?, status, errorMsg? |

## 8. API Reference (`src/app/api`)

| Route | Methods | Purpose |
|-------|---------|---------|
| `auth/setup` | POST | Create first user (only if none exist) |
| `auth/register` | POST | Register with invite code |
| `auth/login` / `logout` / `me` | POST / POST / GET | Session management |
| `auth/forgot-password` / `reset-password` | POST | OTP reset flow |
| `admin/invite-codes` | GET, POST, DELETE | Manage invite codes |
| `customers`, `customers/[id]` | GET, POST / GET, PUT, DELETE | Customer CRUD |
| `bills`, `bills/[id]` | GET, POST / GET, PUT, DELETE | Bill CRUD + ledger recalc |
| `balance` | GET, POST | List balances / record payment |
| `cash`, `cash/[id]` | GET, POST / GET, POST, PUT, DELETE | Cash people, entries, settle |
| `stats` | GET | Dashboard metrics |
| `profile` | GET, POST | Business profile |
| `backup` | GET | JSON export |
| `cleanup` | POST | Rebuild all balances |
| `whatsapp/send`, `whatsapp/test` | POST | Send PDF / test service |
| `dev/users` | GET, POST, PUT, DELETE | Developer user admin (`x-dev-secret`) |

Client code does not call these directly. It uses the wrappers in `src/lib/db.ts` (`getCustomers`, `addBill`, `recordPayment`, `getDashboardStats`, etc.) built on `apiFetch`.

## 9. Developer Setup

### Environment variables (`.env.local`)
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=long_random_string          # required in production (a weak fallback exists in code)
DEV_SECRET=secret_for_/dev_portal
GMAIL_USER=you@gmail.com               # OTP emails
GMAIL_APP_PASSWORD=gmail_app_password
WHATSAPP_SERVICE_URL=http://localhost:5001
```

### Commands
```bash
npm install
npm run dev        # next dev --webpack  -> http://localhost:3000
npm run build      # production build
npm run start
npm run lint
npm run cap-build  # next build && npx cap sync
npx cap open android
```

> [!WARNING]
> `next.config.ts` has static export disabled because API routes need a server. The Capacitor `webDir` is `out`, so a mobile build must either load the hosted web app (server URL) or use a static-export setup. Check this before shipping an APK.

## 10. Extending the Codebase

### Add a new feature or collection
1. Create `src/models/MyThing.ts` (Mongoose model with `userId` indexed).
2. Add API routes in `src/app/api/mything/route.ts`. Call `getAuthUserId(req)` (return 401 if null), `connectDB()`, and **always filter by `userId`**.
3. Add the types and wrapper functions in `src/lib/db.ts`.
4. Create the page in `src/app/mything/page.tsx` wrapped in `AuthGuard`.
5. Add the link to `Sidebar.tsx` (and `BottomNav.tsx` if it is a primary mobile item).

### Changing billing maths or ledger
- Per-row maths lives in `bills/new` and `bills/edit` pages. Server-side balance logic lives only in `recalcLedger.ts`.
- Any code that changes bills must call `recalculateCustomerLedger` afterwards.
- Keep the sign convention (+ Due, − Advance) consistent, because Stock, Dashboard and the customer ledger all depend on it.

### Modifying the print layout
Edit `src/components/BillPrint.tsx`. It uses percentage column widths with `tableLayout: "fixed"`. Keep numeric columns wide enough for `100.001`, and test on A4 or PDF preview.

| Column       | New/Edit (px) | Print (%) |
|--------------|---------------|-----------|
| S.No         | 28            | 3%        |
| Amount       | 66            | 8%        |
| Item Name    | auto          | 16%       |
| Pcs          | 32            | 4%        |
| Gross Weight | 74            | 9%        |
| AD Weight    | 62            | 8%        |
| Less Weight  | 64            | 8%        |
| Description  | 90            | 11%       |
| Net Weight   | 74            | 9%        |
| Tunch %      | 56            | 7%        |
| Rate         | 52            | 7%        |
| Fine Gold    | 74            | 9%        |

## 11. Known Notes and Caveats
- Weights and amounts are stored as strings in `Bill`, so parse them with `parseFloat` and round (3 decimals for gold, 2 for cash).
- `generateVoucherNo()` uses the bill count + 1, so voucher numbers can collide after deletions. Consider a counter collection.
- `/api/cleanup` rebuilds the balance records for all customers, not only the current user's.
- `/api/admin/invite-codes` allows any authenticated user, not only admins.
- `reset-password` accepts 6+ characters, while registration requires 8+.
- `JWT_SECRET` falls back to a hard-coded default if unset, so always set it.
- `WhatsAppSettings` in `db.ts` is a stub (returns `null`). WhatsApp config is the env URL only.

---
*Last updated: 16 October 2026*
