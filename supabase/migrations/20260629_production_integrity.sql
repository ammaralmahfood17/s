-- ============================================================
-- DOKAN — Migration 012: Production Integrity
-- Enforce database-level constraints that the code assumes.
-- ============================================================

-- ============================================================
-- 1. RESTAURANTS: one restaurant per owner
--    The app assumes one restaurant per owner (dashboard, etc.)
-- ============================================================
ALTER TABLE restaurants
  DROP CONSTRAINT IF EXISTS restaurants_owner_id_key;

ALTER TABLE restaurants
  ADD CONSTRAINT restaurants_owner_id_key UNIQUE (owner_id);

-- ============================================================
-- 2. ORDERS: fix status CHECK constraint
--    The app uses 'delivered' but the original schema had 'completed'.
--    Keep both in CHECK during migration so existing data is valid,
--    then update old rows and tighten.
-- ============================================================
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

-- Update any legacy 'completed' rows to 'delivered'
UPDATE orders
  SET status = 'delivered'
  WHERE status = 'completed';

-- Re-add with 'delivered' instead of 'completed'
ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending','confirmed','preparing','ready','delivered','cancelled'
  ));

-- ============================================================
-- 3. PUSH SUBSCRIPTIONS: clean up + strengthen
--    - Remove unused tenant_id (restaurant_id already exists)
--    - Add unique index on (restaurant_id, user_id, endpoint)
-- ============================================================
ALTER TABLE push_subscriptions
  DROP COLUMN IF EXISTS tenant_id;

-- Drop old per-order index if it still exists
DROP INDEX IF EXISTS idx_push_subs_order;

-- Replace weak index with a strong unique constraint
-- Prevents duplicate subscriptions from same user+restaurant+device
DROP INDEX IF EXISTS push_subscriptions_user_id_endpoint_idx;
CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subs_unique
  ON push_subscriptions (restaurant_id, user_id, endpoint)
  WHERE user_id IS NOT NULL;

-- Index for restaurant-wide lookup (used by push dispatch)
CREATE INDEX IF NOT EXISTS idx_push_subs_restaurant
  ON push_subscriptions (restaurant_id)
  WHERE restaurant_id IS NOT NULL;

-- ============================================================
-- 4. ORDERS: enforce idempotency_key uniqueness
--    (migration 20260628 already adds the column + index)
--    Ensure the partial unique index exists
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_idx
  ON public.orders (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- ============================================================
-- 5. PUSH SUBSCRIPTIONS RLS
--    Staff can only subscribe to their own restaurant
-- ============================================================
DROP POLICY IF EXISTS "staff_read_push_subs" ON push_subscriptions;
CREATE POLICY "staff_read_push_subs"
  ON push_subscriptions FOR SELECT
  USING (
    is_restaurant_staff(restaurant_id)
    OR EXISTS (
      SELECT 1 FROM restaurants r
      WHERE r.id = restaurant_id AND r.owner_id = auth.uid()
    )
  );

-- Allow staff to insert their own subscriptions
DROP POLICY IF EXISTS "staff_insert_push_sub" ON push_subscriptions;
CREATE POLICY "staff_insert_push_sub"
  ON push_subscriptions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      is_restaurant_staff(restaurant_id)
      OR EXISTS (
        SELECT 1 FROM restaurants r
        WHERE r.id = restaurant_id AND r.owner_id = auth.uid()
      )
    )
  );

-- Staff can manage their own subscriptions
DROP POLICY IF EXISTS "users_manage_own_push_subs" ON push_subscriptions;
CREATE POLICY "users_manage_own_push_subs"
  ON push_subscriptions FOR ALL
  USING (user_id = auth.uid());

-- ============================================================
-- SUMMARY OF CHANGES:
-- 1. restaurants.owner_id — UNIQUE (one restaurant per owner)
-- 2. orders.status CHECK — 'completed' → 'delivered'
-- 3. push_subscriptions — drop dead tenant_id, add strong unique index
-- 4. orders.idempotency_key — ensure unique index
-- 5. push_subscriptions RLS — tighten to staff+owner of restaurant
-- ============================================================
