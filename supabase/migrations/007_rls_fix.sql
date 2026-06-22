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

-- Also apply same fix to order_items staff read policy
drop policy if exists "staff_read_order_items" on order_items;

create policy "staff_read_order_items"
  on order_items for select
  using (
    exists (
      select 1 from orders o
      where o.id = order_items.order_id
        and (
          is_restaurant_staff(o.restaurant_id)
          or
          exists (
            select 1 from restaurants r
            where r.id = o.restaurant_id
              and r.owner_id = auth.uid()
          )
        )
    )
  );