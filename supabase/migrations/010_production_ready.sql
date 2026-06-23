-- ============================================================
-- DOKAN — Migration 010: Production Ready
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     text,
  phone         text,
  avatar_url    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "superadmin_read_profiles" ON profiles FOR SELECT USING (is_super_admin());

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', new.email));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2. ORDERS: car fields + manual order support
ALTER TABLE orders ADD COLUMN IF NOT EXISTS car_number text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS car_color text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type text NOT NULL DEFAULT 'table';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES auth.users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_number_snapshot text;

-- Add constraint separately (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'orders_order_type_check') THEN
    ALTER TABLE orders ADD CONSTRAINT orders_order_type_check CHECK (order_type IN ('table', 'car', 'manual'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_car_number ON orders(car_number) WHERE car_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON orders(created_by_user_id);

-- 3. PUSH SUBSCRIPTIONS: add user_id + tenant_id
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE;
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS user_agent text;

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_push_subs_tenant ON push_subscriptions(tenant_id) WHERE tenant_id IS NOT NULL;

DROP POLICY IF EXISTS "anyone_insert_push_sub" ON push_subscriptions;
CREATE POLICY "anyone_insert_push_sub" ON push_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "users_manage_own_push_subs" ON push_subscriptions FOR ALL USING (user_id = auth.uid());

-- 4. CATEGORIES: add is_active
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- 5. TABLES: add qr_code
ALTER TABLE tables ADD COLUMN IF NOT EXISTS qr_code text;
UPDATE tables SET qr_code = qr_token WHERE qr_code IS NULL;

-- 6. SUBSCRIPTIONS: add billing_cycle_days
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS billing_cycle_days int NOT NULL DEFAULT 30;

-- 7. RESTAURANTS: add default_locale
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS default_locale text NOT NULL DEFAULT 'ar';

-- Add constraint separately
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'restaurants_default_locale_check') THEN
    ALTER TABLE restaurants ADD CONSTRAINT restaurants_default_locale_check CHECK (default_locale IN ('ar', 'en'));
  END IF;
END $$;

-- 8. ORDER_ITEMS: add product snapshots
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name_ar_snapshot text;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name_en_snapshot text;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS unit_price_snapshot numeric(10,3);

UPDATE order_items SET
  product_name_ar_snapshot = item_name_ar,
  product_name_en_snapshot = item_name_en,
  unit_price_snapshot = unit_price
WHERE product_name_ar_snapshot IS NULL;

-- 9. REALTIME
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
  EXCEPTION WHEN duplicate_object THEN
    -- already in publication
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE push_subscriptions;
  EXCEPTION WHEN duplicate_object THEN
    -- already in publication
  END;
END $$;
