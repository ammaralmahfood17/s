-- ============================================================
-- DOKAN — Migration 013: External/Takeaway Order Type
-- ============================================================

-- ============================================================
-- 1. Add 'external' to order_type CHECK constraint
-- ============================================================
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_order_type_check;

UPDATE orders
  SET order_type = 'table'
  WHERE order_type NOT IN ('table', 'car', 'external', 'manual');

ALTER TABLE orders
  ADD CONSTRAINT orders_order_type_check
  CHECK (order_type IN ('table', 'car', 'external', 'manual'));

-- ============================================================
-- 2. Create External Pickup table for existing restaurants
--    that don't already have one
-- ============================================================
INSERT INTO tables (restaurant_id, name_en, name_ar, sort_order, is_active)
SELECT
  r.id,
  'External Pickup',
  'طلب من الخارج',
  1,
  true
FROM restaurants r
WHERE NOT EXISTS (
  SELECT 1 FROM tables t
  WHERE t.restaurant_id = r.id
    AND t.name_en = 'External Pickup'
);

-- ============================================================
-- 3. Update 14-day trials to 30 days for existing subscriptions
-- ============================================================
UPDATE subscriptions
SET
  trial_ends_at = CASE
    WHEN trial_ends_at IS NOT NULL
      THEN LEAST(trial_ends_at + INTERVAL '16 days', now() + INTERVAL '30 days')
    ELSE NULL
  END,
  current_period_end = CASE
    WHEN current_period_end IS NOT NULL
      THEN LEAST(current_period_end + INTERVAL '16 days', now() + INTERVAL '30 days')
    ELSE NULL
  END
WHERE status = 'trialing';
