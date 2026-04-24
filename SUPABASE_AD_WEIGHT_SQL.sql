-- ============================================================
-- AD WEIGHT FEATURE — Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add ad_weight column to existing bill_items table
ALTER TABLE bill_items
  ADD COLUMN IF NOT EXISTS ad_weight TEXT DEFAULT '';
