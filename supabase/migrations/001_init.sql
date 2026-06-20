-- ============================================================
-- DOKAN - Full Database Schema + RLS
-- Bahrain QR Ordering System
-- Currency: BHD (3 decimal places)
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- RESTAURANTS
-- ============================================================
create table restaurants (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid references auth.users(id) on delete cascade not null,
  name_en       text not null,
  name_ar       text not null,
  slug          text unique not null,
  description_en text,
  description_ar text,
  logo_url      text,
  cover_url     text,
  phone         text,
  address_en    text,
  address_ar    text,
  governorate   text check (governorate in (
                  'Capital','Muharraq','Northern','Southern'
                )) default 'Capital',
  currency      text not null default 'BHD',
  is_open       boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- RESTAURANT STAFF
-- ============================================================
create table restaurant_staff (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  user_id       uuid references auth.users(id) on delete cascade not null,
  role          text not null check (role in ('owner','manager','staff')) default 'staff',
  invited_email text,
  created_at    timestamptz not null default now(),
  unique(restaurant_id, user_id)
);

-- ============================================================
-- TABLES
-- ============================================================
create table tables (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  name_en       text not null,
  name_ar       text not null,
  qr_token      text unique not null default encode(gen_random_bytes(16), 'hex'),
  is_active     boolean not null default true,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- MENU CATEGORIES
-- ============================================================
create table categories (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  name_en       text not null,
  name_ar       text not null,
  emoji         text,
  sort_order    int not null default 0,
  is_visible    boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- MENU ITEMS
-- ============================================================
create table items (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  category_id   uuid references categories(id) on delete set null,
  name_en       text not null,
  name_ar       text not null,
  description_en text,
  description_ar text,
  price         numeric(10,3) not null,  -- BHD: 3 decimal places
  image_url     text,
  is_available  boolean not null default true,
  is_featured   boolean not null default false,
  tags          text[] default '{}',     -- 'spicy','vegan','gluten-free', etc.
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- ITEM VARIATIONS (e.g. Small / Medium / Large)
-- ============================================================
create table variations (
  id            uuid primary key default gen_random_uuid(),
  item_id       uuid references items(id) on delete cascade not null,
  name_en       text not null,
  name_ar       text not null,
  price_modifier numeric(10,3) not null default 0,
  sort_order    int not null default 0
);

-- ============================================================
-- ITEM ADD-ONS (e.g. Extra Cheese +0.300 BHD)
-- ============================================================
create table addons (
  id            uuid primary key default gen_random_uuid(),
  item_id       uuid references items(id) on delete cascade not null,
  name_en       text not null,
  name_ar       text not null,
  price         numeric(10,3) not null default 0,
  sort_order    int not null default 0
);

-- ============================================================
-- ORDER NUMBER COUNTER (per restaurant per day)
-- ============================================================
create table order_counters (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  date          date not null default current_date,
  counter       int not null default 0,
  unique(restaurant_id, date)
);

-- Function to get next order number
create or replace function get_next_order_number(rid uuid)
returns text as $$
declare
  next_num int;
begin
  insert into order_counters (restaurant_id, date, counter)
  values (rid, current_date, 1)
  on conflict (restaurant_id, date)
  do update set counter = order_counters.counter + 1
  returning counter into next_num;
  return 'D-' || lpad(next_num::text, 3, '0');
end;
$$ language plpgsql security definer;

-- ============================================================
-- ORDERS
-- ============================================================
create table orders (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid references restaurants(id) on delete cascade not null,
  table_id       uuid references tables(id) on delete set null,
  order_number   text not null,
  status         text not null check (status in (
                   'pending','confirmed','preparing','ready','completed','cancelled'
                 )) default 'pending',
  customer_name  text,
  notes          text,
  subtotal       numeric(10,3) not null default 0,
  total          numeric(10,3) not null default 0,
  payment_method text not null default 'cashier',  -- always cashier for Dokan
  session_token  text,   -- anonymous customer session for tracking
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Auto-set order number on insert
create or replace function set_order_number()
returns trigger as $$
begin
  if new.order_number is null or new.order_number = '' then
    new.order_number := get_next_order_number(new.restaurant_id);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger before_order_insert
  before insert on orders
  for each row execute function set_order_number();

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger orders_updated_at
  before update on orders
  for each row execute function update_updated_at();

create trigger restaurants_updated_at
  before update on restaurants
  for each row execute function update_updated_at();

create trigger items_updated_at
  before update on items
  for each row execute function update_updated_at();

-- ============================================================
-- ORDER ITEMS
-- ============================================================
create table order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid references orders(id) on delete cascade not null,
  item_id         uuid references items(id) on delete set null,
  -- Snapshots at time of order (price may change later)
  item_name_en    text not null,
  item_name_ar    text not null,
  variation_id    uuid references variations(id) on delete set null,
  variation_name_en text,
  variation_name_ar text,
  quantity        int not null default 1 check (quantity > 0),
  unit_price      numeric(10,3) not null,
  addons          jsonb not null default '[]',
  -- [{"id": "uuid", "name_en": "Extra Cheese", "name_ar": "جبن إضافي", "price": 0.300}]
  notes           text,
  line_total      numeric(10,3) not null default 0,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- REVIEWS
-- ============================================================
create table reviews (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  order_id      uuid references orders(id) on delete set null,
  rating        int not null check (rating between 1 and 5),
  comment       text,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
create index idx_restaurants_slug on restaurants(slug);
create index idx_restaurants_owner on restaurants(owner_id);
create index idx_tables_restaurant on tables(restaurant_id);
create index idx_tables_qr_token on tables(qr_token);
create index idx_categories_restaurant on categories(restaurant_id);
create index idx_items_restaurant on items(restaurant_id);
create index idx_items_category on items(category_id);
create index idx_orders_restaurant on orders(restaurant_id);
create index idx_orders_status on orders(restaurant_id, status);
create index idx_orders_created on orders(restaurant_id, created_at desc);
create index idx_order_items_order on order_items(order_id);
create index idx_staff_restaurant on restaurant_staff(restaurant_id);
create index idx_staff_user on restaurant_staff(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table restaurants enable row level security;
alter table restaurant_staff enable row level security;
alter table tables enable row level security;
alter table categories enable row level security;
alter table items enable row level security;
alter table variations enable row level security;
alter table addons enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_counters enable row level security;
alter table reviews enable row level security;

-- Helper: check if current user is staff of a restaurant
create or replace function is_restaurant_staff(rid uuid)
returns boolean as $$
  select exists (
    select 1 from restaurant_staff
    where restaurant_id = rid
      and user_id = auth.uid()
  );
$$ language sql security definer stable;

-- Helper: check if current user owns a restaurant
create or replace function is_restaurant_owner(rid uuid)
returns boolean as $$
  select exists (
    select 1 from restaurants
    where id = rid and owner_id = auth.uid()
  );
$$ language sql security definer stable;

-- Helper: check if user is manager or owner
create or replace function is_restaurant_manager(rid uuid)
returns boolean as $$
  select exists (
    select 1 from restaurant_staff
    where restaurant_id = rid
      and user_id = auth.uid()
      and role in ('owner','manager')
  );
$$ language sql security definer stable;

-- RESTAURANTS policies
create policy "owners_manage_restaurant"
  on restaurants for all
  using (owner_id = auth.uid());

create policy "staff_read_restaurant"
  on restaurants for select
  using (is_restaurant_staff(id));

create policy "public_read_restaurant"
  on restaurants for select
  using (true);  -- needed for public storefront

-- STAFF policies
create policy "owners_manage_staff"
  on restaurant_staff for all
  using (is_restaurant_owner(restaurant_id));

create policy "staff_read_own"
  on restaurant_staff for select
  using (user_id = auth.uid());

-- TABLES policies
create policy "staff_manage_tables"
  on tables for all
  using (is_restaurant_staff(restaurant_id));

create policy "public_read_tables"
  on tables for select
  using (true);  -- customers need to verify QR token

-- CATEGORIES policies
create policy "staff_manage_categories"
  on categories for all
  using (is_restaurant_staff(restaurant_id));

create policy "public_read_categories"
  on categories for select
  using (true);

-- ITEMS policies
create policy "staff_manage_items"
  on items for all
  using (is_restaurant_staff(restaurant_id));

create policy "public_read_items"
  on items for select
  using (true);

-- VARIATIONS & ADDONS policies
create policy "staff_manage_variations"
  on variations for all
  using (
    exists (
      select 1 from items i
      where i.id = variations.item_id
        and is_restaurant_staff(i.restaurant_id)
    )
  );

create policy "public_read_variations"
  on variations for select
  using (true);

create policy "staff_manage_addons"
  on addons for all
  using (
    exists (
      select 1 from items i
      where i.id = addons.item_id
        and is_restaurant_staff(i.restaurant_id)
    )
  );

create policy "public_read_addons"
  on addons for select
  using (true);

-- ORDERS policies
create policy "anyone_insert_order"
  on orders for insert
  with check (true);  -- customers place orders without auth

create policy "staff_manage_orders"
  on orders for all
  using (is_restaurant_staff(restaurant_id));

create policy "customer_read_own_order"
  on orders for select
  using (true);  -- filtered by session_token in app layer

-- ORDER ITEMS policies
create policy "anyone_insert_order_items"
  on order_items for insert
  with check (true);

create policy "staff_read_order_items"
  on order_items for select
  using (
    exists (
      select 1 from orders o
      where o.id = order_items.order_id
        and is_restaurant_staff(o.restaurant_id)
    )
  );

create policy "customer_read_own_order_items"
  on order_items for select
  using (true);  -- filtered by order_id in app layer

-- ORDER COUNTERS policies
create policy "counter_insert_update"
  on order_counters for all
  using (true);  -- managed by function only

-- REVIEWS policies
create policy "anyone_insert_review"
  on reviews for insert
  with check (true);

create policy "public_read_reviews"
  on reviews for select
  using (true);

create policy "staff_manage_reviews"
  on reviews for all
  using (is_restaurant_staff(restaurant_id));

-- ============================================================
-- ENABLE REALTIME on orders table
-- ============================================================
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table order_items;

-- ============================================================
-- STORAGE BUCKETS (run via Supabase dashboard or API)
-- Bucket: "menu-images" → public
-- Bucket: "restaurant-assets" → public
-- ============================================================

-- ============================================================
-- SEED: Demo restaurant for testing
-- ============================================================
-- (Uncomment and fill owner_id after first signup)
-- insert into restaurants (owner_id, name_en, name_ar, slug, governorate)
-- values ('<your-user-id>', 'Demo Cafe', 'كافيه تجريبي', 'demo-cafe', 'Capital');
