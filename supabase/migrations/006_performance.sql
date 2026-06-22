-- ============================================================
-- DOKAN - Performance Optimization Migration
-- 1. Add restaurant_id to variations and addons (eliminates N+1)
-- 2. Add missing indexes
-- 3. Update RLS policies to use direct restaurant_id
-- ============================================================

-- 1. Add restaurant_id to variations
alter table variations add column restaurant_id uuid references restaurants(id) on delete cascade;

-- Backfill existing data
update variations v
set restaurant_id = i.restaurant_id
from items i
where i.id = v.item_id;

-- Make it NOT NULL after backfill
alter table variations alter column restaurant_id set not null;

-- Add index
create index idx_variations_restaurant on variations(restaurant_id);
create index idx_variations_item on variations(item_id);

-- 2. Add restaurant_id to addons
alter table addons add column restaurant_id uuid references restaurants(id) on delete cascade;

-- Backfill existing data
update addons a
set restaurant_id = i.restaurant_id
from items i
where i.id = a.item_id;

-- Make it NOT NULL after backfill
alter table addons alter column restaurant_id set not null;

-- Add index
create index idx_addons_restaurant on addons(restaurant_id);
create index idx_addons_item on addons(item_id);

-- 3. Add missing indexes on order tables
create index if not exists idx_orders_session on orders(session_token);
create index if not exists idx_order_items_order on order_items(order_id);
create index if not exists idx_reviews_restaurant on reviews(restaurant_id);

-- 4. Update RLS policies for variations to use direct restaurant_id
drop policy if exists "staff_manage_variations" on variations;

create policy "staff_manage_variations"
  on variations for all
  using (is_restaurant_staff(restaurant_id));

-- Allow public read (needed for storefront)
drop policy if exists "public_read_variations" on variations;

create policy "public_read_variations"
  on variations for select
  using (true);

-- 5. Update RLS policies for addons to use direct restaurant_id
drop policy if exists "staff_manage_addons" on addons;

create policy "staff_manage_addons"
  on addons for all
  using (is_restaurant_staff(restaurant_id));

-- Allow public read
drop policy if exists "public_read_addons" on addons;

create policy "public_read_addons"
  on addons for select
  using (true);