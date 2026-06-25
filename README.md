# دكان · Dokan
### QR Ordering System for Bahrain Restaurants

> Customers scan → browse → order from their phone. Pay at the cashier. No apps, no payment gateway.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS (dark theme, RTL) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Realtime | Supabase Realtime |
| Row Security | Supabase RLS |
| Localization | Arabic (RTL) only |
| State | Zustand (cart) |
| QR Codes | qrcode + qrcode.react |
| Hosting | Vercel |

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/yourorg/dokan.git
cd dokan
npm install
```

### 2. Supabase Setup

1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy your project URL and anon key
3. Run migrations in **SQL Editor**:

```sql
-- Run in order:
-- supabase/migrations/001_init.sql   (schema + RLS)
-- supabase/migrations/002_storage.sql (buckets)
```

4. Enable **Realtime** on the `orders` table:
   - Database → Replication → `orders` ✓

### 3. Environment Variables

```bash
cp .env.local.example .env.local
```

Fill in:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run

```bash
npm run dev
# → http://localhost:3000
# → Redirects to /ar (Arabic default)
```

---

## Project Structure

```
src/
├── app/
│   ├── [locale]/
│   │   ├── page.tsx                    # Landing page
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx                # Main dashboard + stats
│   │   │   ├── orders/page.tsx         # Live orders (realtime)
│   │   │   ├── kitchen/page.tsx        # Kitchen display (kanban)
│   │   │   ├── menu/page.tsx           # Menu CRUD
│   │   │   ├── tables/page.tsx         # Tables + QR generator
│   │   │   ├── analytics/page.tsx      # Revenue charts
│   │   │   ├── team/page.tsx           # Staff management
│   │   │   └── settings/page.tsx       # Restaurant setup
│   │   └── r/[slug]/
│   │       ├── page.tsx                # Public storefront
│   │       └── t/[tableId]/page.tsx    # Customer QR menu
│   └── api/
│       ├── orders/route.ts             # Order placement API
│       └── auth/callback/route.ts      # Supabase auth callback
├── components/
│   └── dashboard/
│       └── DashboardShell.tsx          # Sidebar layout
├── hooks/
│   ├── useCart.ts                      # Zustand cart store
│   └── useRealtimeOrders.ts            # Supabase realtime
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # Browser client
│   │   └── server.ts                   # Server client
│   ├── i18n/
│   │   ├── request.ts
│   │   └── messages/
│   │       ├── en.json                 # English strings
│   │       └── ar.json                 # Arabic strings
│   └── utils.ts                        # BHD formatting, helpers
├── types/index.ts                      # All TypeScript types
└── middleware.ts                       # Auth + locale routing
```

---

## Customer Flow

```
Customer scans QR code on table
        ↓
/ar/r/{restaurant-slug}/t/{qr-token}
        ↓
Loads menu (Arabic default, toggle to English)
        ↓
Browses categories → taps item → selects size + addons
        ↓
Cart drawer → optional name + notes
        ↓
"Pay at cashier when you receive your order" notice
        ↓
Place Order → gets order number (e.g. D-042)
        ↓
Realtime status: Pending → Confirmed → Preparing → Ready
        ↓
"Your order is ready!" notification
        ↓
Customer collects + pays at cashier
```

## Restaurant Owner Flow

```
Register at /ar/register
        ↓
Settings → create restaurant + upload logo/cover
        ↓
Menu → add categories + items (AR + EN, images, variations, addons)
        ↓
Tables → add tables → generate QR codes → print/download
        ↓
Orders page → realtime incoming orders → accept → prepare → ready
        ↓ (or)
Kitchen Display → fullscreen kanban board per status
        ↓
Analytics → revenue, top items, daily chart
        ↓
Team → invite staff/managers
```

---

## Bahrain-Specific Details

| Feature | Detail |
|---|---|
| Currency | BHD — 3 decimal places (e.g. 2.500 BD) |
| Default language | Arabic (RTL) |
| Language toggle | Arabic ↔ English in every page |
| Governorates | Capital, Muharraq, Northern, Southern |
| Phone format | +973 prefix |
| Payment | Cash or card at cashier — NO online payment gateway |
| QR flow | Scan → order → pay in person |

---

## Database Schema (summary)

```
restaurants        → owner info, slug, logo, is_open
restaurant_staff   → roles: owner / manager / staff
tables             → each has unique qr_token
categories         → name_en + name_ar, emoji, sort_order
items              → price (numeric 10,3), images, tags, is_featured
variations         → Small/Medium/Large with price_modifier
addons             → Extra cheese +0.300 BHD
orders             → D-001 numbering, status flow, session_token
order_items        → snapshot of item at order time + addons JSONB
reviews            → 1-5 star rating per order
```

---

## Deployment (Vercel)

```bash
# Push to GitHub, connect to Vercel
# Add env vars in Vercel dashboard
# Set NEXT_PUBLIC_APP_URL to your production domain

vercel --prod
```

### Supabase Auth Settings
In Supabase → Auth → URL Configuration:
- Site URL: `https://yourdomain.com`
- Redirect URLs: `https://yourdomain.com/api/auth/callback`

---

## Key Commands

```bash
npm run dev          # Development
npm run build        # Production build
npm run type-check   # TypeScript check
npm run lint         # ESLint
```

---

## License

MIT — Build for Bahrain 🇧🇭
