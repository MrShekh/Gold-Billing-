# Gold Billing System - Developer Guide

Welcome to the Developer Guide for the **Gold Billing System**. This document outlines the project architecture, tech stack, core features, database schema, and a step-by-step guide to get started and modify the codebase.

## 1. Project Overview

The Gold Billing System is a cloud-ready, mobile-responsive application designed for managing customers, issuing/receiving jewellery, tracking weights (gross, less, net, fine gold), and generating precise, print-ready bills. It is built as a web application with Next.js but is configured to be deployed as a mobile application using Capacitor.js.

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
- Calculations include: Gross Weight, Less Weight, Net Weight, Tunch (Purity), and Fine Gold.
- **Vouchers:** Auto-incrementing voucher generation (`IR/00001`).
- **Payments:** Support for Cash Paid, Cash Received, Previous Balance, and Closing Balance.
- **Print Layout:** Exact paper-size printing using `BillPrint.tsx` and `react-to-print`.

### 4.4. Dashboard
Quick overview of business metrics:
- Total Customers
- Total Bills
- Today's Bills
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
  - Total aggregations (`issue_total_gross`, `recv_total_fine`, etc.)
  - Balances (`previous_balance`, `closing_balance`, `dr_naam`, `paid_cash`, `receipt_cash`)
- **`bill_items`**
  - `id` (UUID, PK)
  - `bill_id` (UUID, FK to bills)
  - `type` ("ISSUE" | "RECEIVE")
  - `item_name`, `pcs`, `gross_weight`, `less_weight`, `net_weight`, `tunch`, `rate`, `fine_gold`, `amount`
- **`payment_entries`**
  - `id` (UUID, PK)
  - `bill_id` (UUID, FK to bills)
  - `type` ("paid" | "receipt" | "previous")
  - `amount`, `label`, `voucher_no`, `date`

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
2. This component uses absolute CSS units (`cm`, `mm`, `pt`) and strict `@media print` rules. Modify classes cautiously.
3. Test printing on actual paper or PDF preview, ensuring the margins and layout fit standard A4 or custom invoice paper sizes.

---
*End of document.*
