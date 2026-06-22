-- Fix: Add is_visible/is_available filters to public RLS policies
-- Staff policies still allow full access via OR combination
-- ============================================================

-- Categories: only show visible ones to public
drop policy if exists "public_read_categories" on categories;
create policy "public_read_categories"
  on categories for select
  using (is_visible = true);

-- Items: only show available ones to public  
drop policy if exists "public_read_items" on items;
create policy "public_read_items"
  on items for select
  using (is_available = true);