-- Fix: Make is_restaurant_staff() also return true for the restaurant owner
-- This fixes ALL RLS policies that depend on this function (tables, categories, items, etc.)
-- Owner is NOT automatically added to restaurant_staff, but owns the restaurant via restaurants.owner_id
-- ============================================================

create or replace function is_restaurant_staff(rid uuid)
returns boolean as $$
  select exists (
    select 1 from restaurant_staff
    where restaurant_id = rid
      and user_id = auth.uid()
  )
  or exists (
    select 1 from restaurants
    where id = rid
      and owner_id = auth.uid()
  );
$$ language sql security definer stable;

-- NOTE: This replaces the 007_rls_fix.sql policies since the function now handles both cases.
-- Keep 007_rls_fix.sql applied — it won't conflict, just redundant.