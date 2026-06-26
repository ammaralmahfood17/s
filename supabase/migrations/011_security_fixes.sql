-- ============================================================
-- DOKAN — Migration 011: Security Fixes
-- Fixes open "using (true)" RLS policies that allowed anyone
-- to read all orders, order_items, and order_counters.
-- ============================================================

-- ============================================================
-- 1. ORDERS — fix "customer_read_own_order"
--    Previously: using (true)  ← anyone could read ALL orders
--    Now: customers can only read their own order via session_token
--         Staff/owner can read via existing staff_manage_orders policy
-- ============================================================

DROP POLICY IF EXISTS "customer_read_own_order" ON orders;

-- Customers read only their own order by session_token
CREATE POLICY "customer_read_own_order"
  ON orders FOR SELECT
  USING (
    -- Anonymous customer: must match session_token
    (auth.uid() IS NULL AND session_token IS NOT NULL AND session_token = current_setting('app.session_token', true))
    OR
    -- Authenticated staff/owner: handled by staff_manage_orders policy
    -- This policy also allows authenticated users to see their own manual orders
    (auth.uid() IS NOT NULL AND (
      created_by_user_id = auth.uid()
      OR is_restaurant_staff(restaurant_id)
      OR exists (
        select 1 from restaurants r
        where r.id = restaurant_id and r.owner_id = auth.uid()
      )
    ))
  );

-- ============================================================
-- 2. ORDER_ITEMS — fix "customer_read_own_order_items"
--    Previously: using (true)  ← anyone could read ALL order items
--    Now: only accessible through a valid order
-- ============================================================

DROP POLICY IF EXISTS "customer_read_own_order_items" ON order_items;

-- Customers can only read items that belong to their own order
CREATE POLICY "customer_read_own_order_items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
        AND (
          -- Anonymous: match session_token on parent order
          (auth.uid() IS NULL AND o.session_token IS NOT NULL AND o.session_token = current_setting('app.session_token', true))
          OR
          -- Authenticated: own manual order or staff
          (auth.uid() IS NOT NULL AND (
            o.created_by_user_id = auth.uid()
            OR is_restaurant_staff(o.restaurant_id)
            OR exists (
              select 1 from restaurants r
              where r.id = o.restaurant_id and r.owner_id = auth.uid()
            )
          ))
        )
    )
  );

-- ============================================================
-- 3. ORDER_COUNTERS — fix "counter_insert_update"
--    Previously: using (true)  ← anyone could read/modify counters
--    Now: only accessible via the security definer function
--         Direct access restricted to staff/owner only
-- ============================================================

DROP POLICY IF EXISTS "counter_insert_update" ON order_counters;

-- Only the internal function (security definer) or staff can touch counters
CREATE POLICY "staff_manage_order_counters"
  ON order_counters FOR ALL
  USING (
    is_restaurant_staff(restaurant_id)
    OR exists (
      select 1 from restaurants r
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  );

-- Allow the get_next_order_number() function (security definer) to insert/update
-- This is handled automatically since security definer functions bypass RLS

-- ============================================================
-- 4. Revoke public SELECT on order_counters entirely
--    No customer should ever see counter data
-- ============================================================
-- (Already handled by removing using(true) above)

-- ============================================================
-- SUMMARY OF CHANGES:
-- - orders: customers can only read their own order via session_token
-- - order_items: customers can only read items of their own order
-- - order_counters: restricted to staff/owner only (no public access)
-- ============================================================
