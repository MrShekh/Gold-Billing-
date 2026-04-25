# Gold Billing System — New Features

## Files in this package

```
src/
├── app/
│   ├── api/
│   │   └── whatsapp/
│   │       ├── send/route.ts      ← Main WhatsApp send endpoint
│   │       └── test/route.ts      ← Test send (from Profile settings)
│   └── profile/
│       └── page.tsx               ← Full Profile + Settings + Backup page
├── components/
│   ├── Sidebar.tsx                ← Updated with Profile nav link
│   └── WhatsAppBillButton.tsx     ← Drop-in button for bill view page
supabase-migration.sql             ← Run in Supabase SQL Editor FIRST
WHATSAPP_INTEGRATION.md            ← How to add button to bill view
```

---

## Step 1 — Supabase Migration

Open your Supabase project → SQL Editor → paste and run `supabase-migration.sql`.

This creates 3 new tables:
- `profiles` — business info (name, address, GST, phone)
- `whatsapp_settings` — Meta API credentials per user
- `whatsapp_logs` — audit trail of every bill sent

---

## Step 2 — Environment Variables

Add to your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=...          (already have this)
NEXT_PUBLIC_SUPABASE_ANON_KEY=...     (already have this)
SUPABASE_SERVICE_ROLE_KEY=...         ← ADD THIS (from Supabase → Settings → API)
```

The service role key is used server-side ONLY in the API routes to verify
the user's JWT. It never goes to the browser.

---

## Step 3 — Copy Files

Copy all files from this package into your existing project, replacing Sidebar.tsx.

---

## Step 4 — Add WhatsApp Button to Bill View

See `WHATSAPP_INTEGRATION.md` for a 5-line code snippet to add the button.

---

## Step 5 — Set Up WhatsApp (Meta)

1. Go to developers.facebook.com → Create App → Add WhatsApp product
2. In Profile → WhatsApp Settings, enter:
   - Phone Number ID (from Meta dashboard)
   - Access Token (permanent token from System Users)
3. Click "Test Send" to verify it works
4. Enable the toggle

---

## Profile Section — What's Included

| Section | What it does |
|---|---|
| Business Information | Name, address, GST, phone — printed on bills |
| WhatsApp Auto-Bill | API credentials, enable/disable toggle, test send |
| Backup & Restore | Download JSON (full) or CSV (bills only), restore from JSON |
| Account | Sign out, change password |

---

## Backup System — How it Works

### Download Full Backup (.json)
- Fetches ALL tables for the current user from Supabase
- Packages into a single JSON file with metadata
- Downloads to device as `bhatija-backup-YYYY-MM-DD.json`
- Records last backup time in localStorage

### Download Bills Summary (.csv)
- Bills table joined with customer name/phone
- Opens in Excel, Google Sheets, or any spreadsheet app

### Restore from Backup
- User selects a `.json` backup file
- Confirms the overwrite warning
- Deletes all current user data
- Inserts all backup data with the current user_id
- Shows success with counts

**Security:** Restore only ever writes data owned by the current authenticated user.
No data from one user can ever appear under another user's account.

---

## WhatsApp Message Format

```
🏅 BHATIJA — Bill Summary
V.No: IR/00033 | Date: 10 Apr 2026
Customer: Ramesh Patel

ISSUE
1. PC BHUNGRI
   Gross: 45.830g | Net: 45.830g | Tunch: 65.50% | Fine: 30.019g
2. GOLD FINE
   Gross: 49.060g | Net: 49.060g | Tunch: 99.50% | Fine: 48.815g

RECEIVE
1. SCP
   Net: 209.310g | Tunch: 66.20% | Fine: 138.563g

─────────────────────
Bill Total Net Wt: 58.080 g
Bill Total Fine Gold: 95.202 g

Closing Jama (Fine Gold): 180.650 g

Thank you! 🙏
```
