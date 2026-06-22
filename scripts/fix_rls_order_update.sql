-- ============================================================
-- Fix: Order update RLS — include restaurant owner
-- Owner is NOT automatically added to restaurant_staff,
-- so the update policy needs to also check restaurants.owner_id
-- ============================================================

drop policy if exists "staff_manage_orders" on orders;

create policy "staff_manage_orders"
  on orders for all
  using (
    is_restaurant_staff(restaurant_id)
    or
    exists (
      select 1 from restaurants
      where id = restaurant_id
        and owner_id = auth.uid()
    )
  );