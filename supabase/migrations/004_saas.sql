-- ============================================================
-- DOKAN — Migration 004: Multi-tenant SaaS + Subscriptions
-- ============================================================

-- ── 1. PLANS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plans (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en     text NOT NULL,
  name_ar     text NOT NULL,
  price_bhd   numeric(10,3) NOT NULL DEFAULT 5.000,
  interval    text NOT NULL DEFAULT 'monthly' CHECK (interval IN ('monthly','yearly','lifetime')),
  is_active   boolean NOT NULL DEFAULT true,
  features    jsonb NOT NULL DEFAULT '[]',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Insert default plan
INSERT INTO plans (name_en, name_ar, price_bhd, interval, features) VALUES
  ('Starter', 'المبتدئ', 5.000, 'monthly', '["QR ordering","Realtime kitchen","Analytics","Push notifications","Arabic + English"]'),
  ('Free (Pilot)', 'مجاني (تجريبي)', 0.000, 'monthly', '["QR ordering","Realtime kitchen","Analytics","Push notifications","Arabic + English","Priority support"]')
ON CONFLICT DO NOTHING;

-- ── 2. SUBSCRIPTIONS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  plan_id         uuid REFERENCES plans(id) NOT NULL,
  status          text NOT NULL DEFAULT 'trialing'
                  CHECK (status IN ('active','trialing','past_due','cancelled','paused')),
  -- Manual payment tracking
  amount_bhd      numeric(10,3) NOT NULL DEFAULT 5.000,
  currency        text NOT NULL DEFAULT 'BHD',
  -- Billing period
  current_period_start  timestamptz NOT NULL DEFAULT now(),
  current_period_end    timestamptz NOT NULL DEFAULT (now() + INTERVAL '1 month'),
  -- Trial
  trial_ends_at   timestamptz,
  -- Cancellation
  cancelled_at    timestamptz,
  cancel_reason   text,
  -- Notes (for manual tracking)
  admin_notes     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id)
);

CREATE INDEX IF NOT EXISTS idx_subs_restaurant ON subscriptions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_subs_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subs_period_end ON subscriptions(current_period_end);

-- ── 3. PAYMENT RECORDS (manual) ─────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE CASCADE NOT NULL,
  restaurant_id   uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  amount_bhd      numeric(10,3) NOT NULL,
  payment_method  text NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash','bank_transfer','benefit','other')),
  reference       text,          -- transfer ref / receipt number
  paid_at         timestamptz NOT NULL DEFAULT now(),
  period_from     timestamptz NOT NULL,
  period_to       timestamptz NOT NULL,
  notes           text,
  recorded_by     uuid REFERENCES auth.users(id),  -- admin who recorded it
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_restaurant ON payments(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_payments_sub ON payments(subscription_id);

-- ── 4. SUPER ADMINS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS super_admins (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Helper function: is current user a super admin?
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM super_admins WHERE user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── 5. ADD subscription_status to restaurants (convenience) ──
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS subscription_status text
    DEFAULT 'trialing'
    CHECK (subscription_status IN ('active','trialing','past_due','cancelled','paused','free'));

-- ── 6. RLS ──────────────────────────────────────────────────
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- Plans: public read
CREATE POLICY "public_read_plans" ON plans FOR SELECT USING (true);
CREATE POLICY "superadmin_manage_plans" ON plans FOR ALL USING (is_super_admin());

-- Subscriptions: owner can read own, super admin manages all
CREATE POLICY "owner_read_own_sub" ON subscriptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid())
  );
CREATE POLICY "superadmin_all_subs" ON subscriptions FOR ALL USING (is_super_admin());

-- Payments: owner read own, super admin all
CREATE POLICY "owner_read_own_payments" ON payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid())
  );
CREATE POLICY "superadmin_all_payments" ON payments FOR ALL USING (is_super_admin());

-- Super admins: only super admins can read/manage
CREATE POLICY "superadmin_read_self" ON super_admins
  FOR SELECT USING (user_id = auth.uid() OR is_super_admin());
CREATE POLICY "superadmin_manage_all" ON super_admins FOR ALL USING (is_super_admin());

-- Restaurants: super admin can see all
CREATE POLICY "superadmin_all_restaurants" ON restaurants FOR ALL USING (is_super_admin());

-- ── 7. TRIGGER: sync subscription_status to restaurants ──────
CREATE OR REPLACE FUNCTION sync_restaurant_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE restaurants
  SET subscription_status = NEW.status
  WHERE id = NEW.restaurant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sub_status_sync
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION sync_restaurant_subscription_status();

-- Auto-update updated_at
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 8. FUNCTION: create subscription on restaurant creation ──
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
DECLARE
  starter_plan_id uuid;
BEGIN
  SELECT id INTO starter_plan_id FROM plans WHERE name_en = 'Starter' LIMIT 1;
  IF starter_plan_id IS NOT NULL THEN
    INSERT INTO subscriptions (
      restaurant_id, plan_id, status,
      current_period_start, current_period_end,
      trial_ends_at
    ) VALUES (
      NEW.id, starter_plan_id, 'trialing',
      now(), now() + INTERVAL '14 days',
      now() + INTERVAL '14 days'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER new_restaurant_subscription
  AFTER INSERT ON restaurants
  FOR EACH ROW EXECUTE FUNCTION create_default_subscription();

-- ── SEED: make yourself super admin ──────────────────────────
-- After signup, run:
-- INSERT INTO super_admins (user_id) VALUES ('<your-user-id>');
