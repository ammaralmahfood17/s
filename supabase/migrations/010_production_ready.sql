-- ============================================================
-- DOKAN — Migration 010: Production Ready
-- Aligns DB with full PRD requirements
-- ============================================================

-- ── 1. PROFILES TABLE ────────────────────────────────────────
-- PRD requires profiles table for user details
CREATE TABLE IF NOT EXISTS profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     text,
  phone         text,
  avatar_url    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own profile
CREATE POLICY "users_manage_own_profile"
  ON profiles FOR ALL
  USING (auth.uid() = id);

-- Super admins can read all profiles
CREATE POLICY "superadmin_read_profiles"
  ON profiles FOR SELECT
  USING (is_super_admin());

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists to allow re-running
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 2. ORDERS: Add car order fields + manual order support ────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS car_number      text,
  ADD COLUMN IF NOT EXISTS car_color       text,
  ADD COLUMN IF NOT EXISTS order_type      text NOT NULL DEFAULT 'table'
    CHECK (order_type IN ('table', 'car', 'manual')),
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES auth.users(id);

-- Add confirmed + ready to status check (already in 001_init, but ensure)
-- The status check in 001 already includes: pending, confirmed, preparing, ready, completed, cancelled

-- Index for car orders
CREATE INDEX IF NOT EXISTS idx_orders_car_number ON orders(car_number) WHERE car_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON orders(created_by_user_id);

-- ── 3. PUSH SUBSCRIPTIONS: Add user_id + tenant_id ────────────
-- PRD model: push_subscriptions has tenant_id + user_id (not order_id)
-- Keep order_id for backward compat but add the new columns
ALTER TABLE push_subscriptions
  ADD COLUMN IF NOT EXISTS user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS tenant_id       uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS user_agent      text;

-- Index for user-based lookups
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_push_subs_tenant ON push_subscriptions(tenant_id) WHERE tenant_id IS NOT NULL;

-- Update RLS: allow users to manage their own subscriptions
DROP POLICY IF EXISTS "anyone_insert_push_sub" ON push_subscriptions;
CREATE POLICY "anyone_insert_push_sub"
  ON push_subscriptions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "users_manage_own_push_subs"
  ON push_subscriptions FOR ALL
  USING (user_id = auth.uid());

-- ── 4. CATEGORIES: Add is_active (PRD uses is_active not is_visible) ──
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- ── 5. PRODUCTS (ITEMS): Ensure all PRD fields exist ─────────
-- PRD: name_ar, name_en, description_ar, description_en, price, image_url, is_active, sort_order
-- Already covered by 001_init + 003. Add is_active alias if needed.
-- items.is_available already exists — maps to PRD's is_active

-- ── 6. TABLES: Add qr_code field (PRD uses qr_code not qr_token) ──
-- qr_token already exists. Add qr_code as alias for backward compat.
ALTER TABLE tables
  ADD COLUMN IF NOT EXISTS qr_code text;

-- Sync qr_code with qr_token for existing records
UPDATE tables SET qr_code = qr_token WHERE qr_code IS NULL;

-- ── 7. SUBSCRIPTIONS: Add billing_cycle_days (PRD field) ──────
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS billing_cycle_days int NOT NULL DEFAULT 30;

-- ── 8. TENANT_USERS: PRD model has tenant_users junction ──────
-- restaurant_staff already serves this purpose. Add view for compatibility.
-- No new table needed — restaurant_staff is the implementation.

-- ── 9. SETTINGS: Add default_locale to restaurants ────────────
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS default_locale text NOT NULL DEFAULT 'ar'
    CHECK (default_locale IN ('ar', 'en'));

-- ── 10. ORDERS: Add table_number_snapshot (PRD field) ─────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS table_number_snapshot text;

-- ── 11. ORDER_ITEMS: Add product_name snapshots (PRD fields) ─
-- Already have item_name_en, item_name_ar — map to PRD's product_name_ar_snapshot etc.
-- Add aliases for clarity:
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS product_name_ar_snapshot text,
  ADD COLUMN IF NOT EXISTS product_name_en_snapshot text,
  ADD COLUMN IF NOT EXISTS unit_price_snapshot numeric(10,3);

-- Backfill from existing data
UPDATE order_items SET
  product_name_ar_snapshot = item_name_ar,
  product_name_en_snapshot = item_name_en,
  unit_price_snapshot = unit_price
WHERE product_name_ar_snapshot IS NULL;

-- ── 12. Enable realtime on new/updated tables ─────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS push_subscriptions;
