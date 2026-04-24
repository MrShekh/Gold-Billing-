-- ============================================================
-- JAMA BALANCE FEATURE — Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add jama balance columns to existing bills table
ALTER TABLE bills
  ADD COLUMN IF NOT EXISTS prev_fine_gold    DECIMAL(10,3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS closing_fine_gold DECIMAL(10,3) DEFAULT 0;

-- 1b. Add description column to bill_items
ALTER TABLE bill_items
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- 2. Create the customer_balance tracking table
CREATE TABLE IF NOT EXISTS customer_balance (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users NOT NULL,
  customer_id     UUID REFERENCES customers(id) ON DELETE CASCADE,
  fine_gold_balance DECIMAL(10,3) DEFAULT 0,  -- grams outstanding
  cash_balance      DECIMAL(10,2) DEFAULT 0,  -- rupees outstanding
  updated_at      TIMESTAMP DEFAULT now()
);

-- 3. Enable Row Level Security
ALTER TABLE customer_balance ENABLE ROW LEVEL SECURITY;

-- 4. RLS policy — users can only see/modify their own records
DROP POLICY IF EXISTS "Users manage own balances" ON customer_balance;
CREATE POLICY "Users manage own balances" ON customer_balance
  FOR ALL USING (auth.uid() = user_id);

-- 5. Unique constraint: one row per (user, customer)
CREATE UNIQUE INDEX IF NOT EXISTS customer_balance_user_customer
  ON customer_balance(user_id, customer_id);
