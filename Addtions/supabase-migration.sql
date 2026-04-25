-- ═══════════════════════════════════════════════════════════════
-- Gold Billing System — New Tables Migration
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. profiles ─────────────────────────────────────────────────────────
-- Stores business info shown on printed bills and in profile settings.
CREATE TABLE IF NOT EXISTS profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name    TEXT DEFAULT '',
  owner_name       TEXT DEFAULT '',
  phone            TEXT DEFAULT '',
  email            TEXT DEFAULT '',
  address          TEXT DEFAULT '',
  city             TEXT DEFAULT '',
  gst_no           TEXT DEFAULT '',
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profile"
  ON profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── 2. whatsapp_settings ────────────────────────────────────────────────
-- One row per user storing their Meta WhatsApp Cloud API credentials.
CREATE TABLE IF NOT EXISTS whatsapp_settings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number_id   TEXT NOT NULL DEFAULT '',
  access_token      TEXT NOT NULL DEFAULT '',
  template_name     TEXT DEFAULT 'gold_bill_summary',
  template_language TEXT DEFAULT 'en',
  enabled           BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE whatsapp_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own WhatsApp settings"
  ON whatsapp_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── 3. whatsapp_logs ────────────────────────────────────────────────────
-- Audit log of every WhatsApp bill send (success or fail).
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bill_id      UUID REFERENCES bills(id) ON DELETE SET NULL,
  customer_id  UUID REFERENCES customers(id) ON DELETE SET NULL,
  phone        TEXT NOT NULL,
  message_id   TEXT,           -- WhatsApp message ID returned by Meta
  status       TEXT DEFAULT 'sent', -- 'sent' | 'failed'
  error_msg    TEXT,
  sent_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own WhatsApp logs"
  ON whatsapp_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── 4. Index for faster lookups ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_bill_id    ON whatsapp_logs(bill_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_customer_id ON whatsapp_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id          ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_settings_user_id ON whatsapp_settings(user_id);

-- ─── 5. Auto-update updated_at timestamps ─────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER whatsapp_settings_updated_at
  BEFORE UPDATE ON whatsapp_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── 6. Verify existing tables have correct RLS ──────────────────────────
-- Run these to check — they should all return rows if RLS is working:
-- SELECT * FROM customers LIMIT 1;
-- SELECT * FROM bills LIMIT 1;
-- SELECT * FROM customer_balance LIMIT 1;

-- ─── Done! ────────────────────────────────────────────────────────────────
-- New tables created:
--   profiles              (business info)
--   whatsapp_settings     (Meta API credentials)
--   whatsapp_logs         (send audit trail)
