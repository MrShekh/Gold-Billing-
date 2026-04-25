# Gold Billing System - Developer Guide

Welcome to the Developer Guide for the **Gold Billing System**. This document outlines the project architecture, tech stack, core features, database schema, and a step-by-step guide to get started and modify the codebase.

## 1. Project Overview

The Gold Billing System is a cloud-ready, mobile-responsive application designed for managing customers, issuing/receiving jewellery, tracking weights (gross, AD weight, less, net, fine gold), maintaining running Jama (balance) accounts, and generating precise, print-ready bills. It is built as a web application with Next.js but is configured to be deployed as a mobile application using Capacitor.js.

## 2. Tech Stack

- **Frontend Framework:** Next.js (16.2.4) using App Router (`src/app`).
- **UI Library:** React 19.
- **Styling:** Tailwind CSS v4 alongside Vanilla CSS for custom components.
- **Icons:** `lucide-react`.
- **Backend & Database:** Supabase (PostgreSQL, Authentication).
- **Mobile Wrapper:** Capacitor.js (`@capacitor/core`, `@capacitor/android`, `@capacitor/ios`).
- **Printing:** `react-to-print` (for exact-match paper invoice printing).

## 3. Folder Structure

```
gold-billing/
├── android/                   # Capacitor Android project files
├── public/                    # Static assets (images, icons)
├── src/
│   ├── app/                   # Next.js App Router Pages
│   │   ├── bills/             # Bill management (view, edit, new)
│   │   ├── customers/         # Customer management (CRUD)
│   │   ├── login/             # Authentication page
│   │   ├── globals.css        # Global styles and Tailwind configuration
│   │   ├── layout.tsx         # Root layout with AuthProvider & Fonts
│   │   └── page.tsx           # Dashboard view
│   ├── components/            # Reusable UI Components
│   │   ├── AuthGuard.tsx      # Route protection
│   │   ├── BillPrint.tsx      # Print layout for invoices
│   │   └── Sidebar.tsx        # Application navigation sidebar
│   └── lib/                   # Utilities, Services, and Contexts
│       ├── AuthProvider.tsx   # React context for Supabase Auth
│       ├── db.ts              # Supabase Database CRUD functions & types
│       └── supabase.ts        # Supabase client initialization
├── capacitor.config.ts        # Capacitor configuration (com.goldapp.billing)
├── next.config.ts             # Next.js configurations
├── package.json               # Dependencies and scripts
└── tsconfig.json              # TypeScript configuration
```

## 4. Core Features

### 4.1. Authentication
Protected routes using Supabase Auth. Users must log in (via `/login`) to access the dashboard, bills, or customers. The `AuthGuard` component handles redirects if an unauthenticated user attempts to access protected routes.

### 4.2. Customer Management
Complete CRUD functionality for Customers:
- **Fields:** Name, Phone, Address, CreatedAt.
- **Location:** `src/app/customers` and `src/lib/db.ts`.

### 4.3. Billing & Invoices
Comprehensive billing system handling dual transaction types (`ISSUE` and `RECEIVE`).
- **Columns per item:** S.No, Amount, Item Name, Pcs, Gross Weight, AD Weight, Less Weight, Description, Net Weight, Tunch (Purity %), Rate, Fine Gold.
- **Auto-calculations:** Net Weight = Gross − AD − Less. Fine Gold = (Net × Tunch) / 100. Section totals and Bill Total (Issue − Receive) auto-compute.
- **Vouchers:** Auto-incrementing voucher generation (`IR/00001`).
- **Print Layout:** Exact paper-size printing using `BillPrint.tsx` and `react-to-print`. Columns are sized to fit values up to `100.001` without clipping.
- **Edit Bill:** Full edit support with all columns (AD Weight, Description, etc.) matching the create bill form.

### 4.4. Jama Balance System
Automatic running balance tracking per customer:
- **Fine Gold Jama:** Tracks cumulative fine gold outstanding (in grams).
- **Cash Jama:** Tracks cumulative cash outstanding (in ₹).
- On each new bill, previous Jama is fetched, this bill's net is added, and the closing Jama is saved.
- Jama balances are displayed on the bill creation form and printed on invoices.
- Stored in the `customer_balance` table with upsert on `(user_id, customer_id)`.

### 4.5. Dashboard
Quick overview of business metrics:
- Total Customers
- Total Bills
- Today's Bills
- Total Jama Gold (grams) and Jama Cash (₹) across all customers
- Recent Transactions and Customers tables.

## 5. Database Architecture (Supabase)

The system relies on a PostgreSQL database hosted on Supabase.

### 5.1 Tables
- **`customers`**
  - `id` (UUID, PK)
  - `user_id` (UUID, FK to auth.users)
  - `name` (String)
  - `phone` (String)
  - `address` (String)
  - `created_at` (Timestamp)
- **`bills`**
  - `id` (UUID, PK)
  - `user_id` (UUID, FK to auth.users)
  - `customer_id` (UUID, FK to customers)
  - `customer_name`, `voucher_no`, `date`
  - Total aggregations (`issue_total_gross`, `issue_total_less`, `issue_total_net`, `issue_total_fine`, `recv_total_gross`, `recv_total_less`, `recv_total_net`, `recv_total_fine`, `bill_total_gross`, `bill_total_less`, `bill_total_net`, `bill_total_fine`)
  - Balances (`previous_balance`, `closing_balance`, `dr_naam`, `paid_cash`, `receipt_cash`)
  - Jama fields (`prev_fine_gold`, `closing_fine_gold`)
- **`bill_items`**
  - `id` (UUID, PK)
  - `bill_id` (UUID, FK to bills)
  - `type` ("ISSUE" | "RECEIVE")
  - `sno`, `item_name`, `pcs`, `gross_weight`, `ad_weight`, `less_weight`, `description`, `net_weight`, `tunch`, `rate`, `fine_gold`, `amount`
- **`payment_entries`**
  - `id` (UUID, PK)
  - `bill_id` (UUID, FK to bills)
  - `type` ("paid" | "receipt" | "previous")
  - `amount`, `label`, `voucher_no`, `date`
- **`customer_balance`**
  - `id` (UUID, PK)
  - `user_id` (UUID, FK to auth.users)
  - `customer_id` (UUID, FK to customers)
  - `fine_gold_balance` (Numeric — grams outstanding)
  - `cash_balance` (Numeric — ₹ outstanding)
  - `updated_at` (Timestamp)
  - Unique constraint on `(user_id, customer_id)`

## 6. Step-by-Step Developer Setup

### Step 1: Environment Variables
Create a `.env.local` file in the root directory.
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 4: Mobile App Build (Capacitor)
To build the application for mobile (Android/iOS):
```bash
# Compile Next.js export (configured in next.config.ts)
npm run build

# Sync assets to Capacitor android/ios folders
npx cap sync

# Open Android Studio to build the APK
npx cap open android
```

## 7. Extending the Codebase (How-To)

### Adding a new Database Table/Feature:
1. Create the table in your Supabase SQL Editor.
2. Ensure Row Level Security (RLS) is enabled and policies are set to allow `auth.uid() = user_id`.
3. Go to `src/lib/db.ts` and add the TypeScript interface for your new model.
4. Create the corresponding CRUD wrapper functions in `src/lib/db.ts`.
5. Create a new directory in `src/app/` (e.g., `src/app/reports/page.tsx`).
6. Wrap the page content inside the `<AuthGuard>` component to keep it secure.
7. Update the `src/components/Sidebar.tsx` to include a navigation link to your new route.

### Modifying the Print Layout:
1. Open `src/components/BillPrint.tsx`.
2. This component uses percentage-based column widths (`width: "9%"`, etc.) with `tableLayout: "fixed"` for consistent rendering.
3. Ensure numeric columns (Gross, AD, Less, Net, Fine Gold) are wide enough to display values like `100.001` without clipping.
4. Test printing on actual paper or PDF preview, ensuring the margins and layout fit standard A4 landscape or custom invoice paper sizes.

### Column Width Reference:
All three bill pages (New, Edit, Print) share consistent column sizing:
| Column       | New/Edit (px) | Print (%) |
|--------------|---------------|----------|
| S.No         | 28            | 3%       |
| Amount       | 66            | 8%       |
| Item Name    | auto          | 16%      |
| Pcs          | 32            | 4%       |
| Gross Weight | 74            | 9%       |
| AD Weight    | 62            | 8%       |
| Less Weight  | 64            | 8%       |
| Description  | 90            | 11%      |
| Net Weight   | 74            | 9%       |
| Tunch %      | 56            | 7%       |
| Rate         | 52            | 7%       |
| Fine Gold    | 74            | 9%       |

---
*Last updated: 25 April 2026*
