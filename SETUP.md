# Dokan — Setup & Deployment Guide
## دكان — دليل الإعداد والنشر

---

## Step 1 — Supabase Project

1. Go to **https://supabase.com** → New Project
2. Name it: `dokan-prod`
3. Choose region closest to Bahrain: **Singapore** or **Mumbai**
4. Copy your credentials:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service Role Key → `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 2 — Run Migrations

Go to Supabase → **SQL Editor** → run each file in order:

```
supabase/migrations/001_init.sql
supabase/migrations/002_storage.sql
supabase/migrations/003_missing_features.sql
supabase/migrations/004_saas.sql
```

---

## Step 3 — Enable Realtime

Supabase → **Database** → **Replication** → Enable for:
- ✅ `orders`
- ✅ `order_items`
- ✅ `restaurants`
- ✅ `reviews`

---

## Step 4 — Storage Buckets

Migration 002 creates them automatically. Verify in Supabase → **Storage**:
- `menu-images` (public)
- `restaurant-assets` (public)

---

## Step 5 — Auth Settings

Supabase → **Auth** → **URL Configuration**:
- Site URL: `https://yourdomain.com`
- Redirect URLs: `https://yourdomain.com/api/auth/callback`

---

## Step 6 — Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Push Notifications (optional — skip for now)
# Generate: npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=mailto:admin@dokan.bh
```

---

## Step 7 — Deploy to Vercel

```bash
npm install
npx vercel          # follow prompts
# Add env vars in Vercel dashboard → Settings → Environment Variables
```

---

## Step 8 — Make Yourself Super Admin

After your first signup:

1. Go to Supabase → **SQL Editor**
2. Run:
```sql
-- First get your user ID
SELECT id, email FROM auth.users WHERE email = 'your@email.com';

-- Then insert as super admin
INSERT INTO super_admins (user_id) VALUES ('<your-user-id-here>');
```

3. Go to `https://yourdomain.com/ar/admin` — you should see the Admin Panel.

---

## Step 9 — Onboard Estikaneh (Free Pilot)

1. Ask your friend to sign up at `https://yourdomain.com/ar/register`
2. He creates his restaurant in Settings
3. You go to Admin → Restaurants → click his restaurant
4. Click **"🎁 Set FREE for 1 Year (Pilot)"**
5. Done — he's on a free subscription for 12 months

Then he:
1. Adds his menu (Arabic + English)
2. Creates 15 tables → downloads QR codes
3. Prints QR codes and puts them on tables
4. Kitchen display on a tablet: `/ar/dashboard/kitchen`

---

## Step 10 — Test the Full Flow

Before going live, test this exact flow:

```
1. Open: /ar/r/estikaneh/t/{qr-token}  ← customer phone
2. Browse menu → add item → place order
3. Open: /ar/dashboard/kitchen ← staff tablet
4. Confirm order → Start preparing → Mark ready
5. Customer sees "جاهز" in real-time
6. Staff tells customer order is ready
7. Customer pays at cashier
```

---

## Multi-tenant Flow (For New Restaurants)

When a new restaurant signs up:
1. They go to `/ar/register` → create account
2. Go to Dashboard → Settings → create restaurant
3. ✅ **14-day trial starts automatically** (trigger in migration 004)
4. They get full access during trial
5. After 14 days → status changes to `trialing` warning
6. You contact them → they pay 5 BHD → you go to Admin → record payment → extend 1 month

---

## Admin Panel Routes

| URL | What it does |
|---|---|
| `/ar/admin` | Overview — stats, alerts, recent restaurants |
| `/ar/admin/restaurants` | All restaurants table |
| `/ar/admin/restaurants/[id]` | Single restaurant — manage subscription, record payment |
| `/ar/admin/subscriptions` | All subscriptions, filter by status |
| `/ar/admin/payments` | Full payment history, monthly revenue |

---

## Revenue Tracking

All payments are manual — you record them when you receive cash/transfer:

1. Admin → Restaurants → click restaurant
2. Fill: Amount (5.000 BHD), Method (Cash/Transfer/Benefit), Reference
3. Click "Record Payment & Extend"
4. Subscription automatically extends by chosen months

---

## Customer URL Structure

```
/ar/r/{restaurant-slug}              → Public storefront (table selector)
/ar/r/{restaurant-slug}/t/{qr-token} → Customer menu (after QR scan)
```

Example for Estikaneh:
```
/ar/r/estikaneh/t/{table-1-token}
```

---

## Pricing Model

| Plan | Price | Notes |
|---|---|---|
| Free (Pilot) | 0 BHD/year | For Estikaneh + early partners |
| Starter | 5 BHD/month | Standard plan for all restaurants |

No payment gateway needed — you collect manually (cash, bank transfer, Benefit).
