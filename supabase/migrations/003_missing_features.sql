-- ============================================================
-- DOKAN — Migration 003: Missing Features
-- Push notifications, stock, prep time, hours, multi-restaurant
-- ============================================================

-- ── 1. ITEMS: add stock tracking ────────────────────────────
ALTER TABLE items
  ADD COLUMN IF NOT EXISTS stock_enabled  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stock_count    int,
  ADD COLUMN IF NOT EXISTS sold_out       boolean NOT NULL DEFAULT false;

-- ── 2. RESTAURANTS: pause ordering + prep time + hours ──────
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS ordering_paused     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pause_reason_en     text,
  ADD COLUMN IF NOT EXISTS pause_reason_ar     text,
  ADD COLUMN IF NOT EXISTS prep_time_minutes   int NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS opening_hours       jsonb NOT NULL DEFAULT '{
    "sun": {"open": "08:00", "close": "23:00", "closed": false},
    "mon": {"open": "08:00", "close": "23:00", "closed": false},
    "tue": {"open": "08:00", "close": "23:00", "closed": false},
    "wed": {"open": "08:00", "close": "23:00", "closed": false},
    "thu": {"open": "08:00", "close": "23:00", "closed": false},
    "fri": {"open": "12:00", "close": "24:00", "closed": false},
    "sat": {"open": "08:00", "close": "24:00", "closed": false}
  }'::jsonb;

-- ── 3. PUSH SUBSCRIPTIONS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid REFERENCES orders(id) ON DELETE CASCADE,
  restaurant_id   uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  endpoint        text NOT NULL,
  p256dh          text NOT NULL,
  auth_key        text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(order_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_insert_push_sub"
  ON push_subscriptions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "staff_read_push_subs"
  ON push_subscriptions FOR SELECT
  USING (is_restaurant_staff(restaurant_id));

CREATE INDEX IF NOT EXISTS idx_push_subs_order ON push_subscriptions(order_id);

-- ── 4. REVIEWS: add public display flag ─────────────────────
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS reviewer_name text;

-- ── 5. ORDERS: add prep_time snapshot ───────────────────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS prep_time_minutes int;

-- ── 6. RESTAURANTS: support multi-restaurant per user ───────
-- Already handled by restaurant_staff table.
-- Add a "primary" restaurant concept for UI default:
ALTER TABLE restaurant_staff
  ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false;

-- ── 7. Enable realtime on new tables ────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE restaurants;
ALTER PUBLICATION supabase_realtime ADD TABLE reviews;
