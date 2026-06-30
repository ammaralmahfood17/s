// ============================================================
// DOKAN — Shared TypeScript Types (Updated for Production)
// ============================================================

export type Locale = 'ar' | 'en';

// ── User & Auth ───────────────────────────────────────────────

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// ── Restaurant (Tenant) ───────────────────────────────────────

export interface Restaurant {
  id: string;
  owner_id: string;
  name_en: string;
  name_ar: string;
  slug: string;
  description_en: string | null;
  description_ar: string | null;
  logo_url: string | null;
  cover_url: string | null;
  phone: string | null;
  address_en: string | null;
  address_ar: string | null;
  governorate: 'Capital' | 'Muharraq' | 'Northern' | 'Southern' | null;
  currency: string;
  is_open: boolean;
  ordering_paused: boolean;
  pause_reason_en: string | null;
  pause_reason_ar: string | null;
  prep_time_minutes: number;
  opening_hours: Record<string, { open: string; close: string; closed: boolean }>;
  default_locale: string;
  subscription_status: string;
  created_at: string;
  updated_at: string;
}

// ── Staff ─────────────────────────────────────────────────────

export interface RestaurantStaff {
  id: string;
  restaurant_id: string;
  user_id: string;
  role: 'owner' | 'manager' | 'staff';
  invited_email: string | null;
  is_primary: boolean;
  created_at: string;
}

// ── Tables ────────────────────────────────────────────────────

export interface Table {
  id: string;
  restaurant_id: string;
  name_en: string;
  name_ar: string;
  qr_token: string;
  qr_code: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

// ── Menu ──────────────────────────────────────────────────────

export interface Category {
  id: string;
  restaurant_id: string;
  name_en: string;
  name_ar: string;
  emoji: string | null;
  sort_order: number;
  is_visible: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Item {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name_en: string;
  name_ar: string;
  description_en: string | null;
  description_ar: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  tags: string[];
  sort_order: number;
  stock_enabled: boolean;
  stock_count: number | null;
  sold_out: boolean;
  created_at: string;
  updated_at: string;
}

export interface Variation {
  id: string;
  item_id: string;
  restaurant_id: string;
  name_en: string;
  name_ar: string;
  price_modifier: number;
  sort_order: number;
}

export interface Addon {
  id: string;
  item_id: string;
  restaurant_id: string;
  name_en: string;
  name_ar: string;
  price: number;
  sort_order: number;
}

// ── Orders ────────────────────────────────────────────────────

// Full status flow: pending → confirmed → preparing → ready → delivered
// Plus: cancelled (can happen at any stage)
export type OrderStatus =
  | 'pending'      // New order, not yet accepted
  | 'confirmed'    // Accepted by staff
  | 'preparing'    // Being prepared in kitchen
  | 'ready'        // Ready for pickup/delivery
  | 'delivered'    // Delivered to customer (final)
  | 'cancelled';   // Cancelled

export type OrderType = 'table' | 'car' | 'external' | 'manual';

export interface Order {
  id: string;
  restaurant_id: string;
  table_id: string | null;
  order_number: string;
  order_type: OrderType;
  status: OrderStatus;
  customer_name: string | null;
  notes: string | null;
  subtotal: number;
  total: number;
  payment_method: string;
  session_token: string | null;
  prep_time_minutes: number | null;
  // Car order fields
  car_number: string | null;
  car_color: string | null;
  // Manual order tracking
  created_by_user_id: string | null;
  // Snapshot
  table_number_snapshot: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  table?: Table;
  order_items?: OrderItem[];
}

export interface AddonSnapshot {
  id: string;
  name_en: string;
  name_ar: string;
  price: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_id: string | null;
  item_name_en: string;
  item_name_ar: string;
  variation_id: string | null;
  variation_name_en: string | null;
  variation_name_ar: string | null;
  quantity: number;
  unit_price: number;
  addons: AddonSnapshot[];
  notes: string | null;
  line_total: number;
  created_at: string;
  // PRD snapshots
  product_name_ar_snapshot: string | null;
  product_name_en_snapshot: string | null;
  unit_price_snapshot: number | null;
}

// ── Extended types with relations ─────────────────────────────

export interface ItemWithDetails extends Item {
  category?: Category;
  variations: Variation[];
  addons: Addon[];
}

export interface CategoryWithItems extends Category {
  items: ItemWithDetails[];
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
  table?: Table;
}

// ── Cart types (client-side only) ─────────────────────────────

export interface CartAddon {
  id: string;
  name_en: string;
  name_ar: string;
  price: number;
}

export interface CartItem {
  cartId: string;
  item: Item;
  variation: Variation | null;
  addons: CartAddon[];
  quantity: number;
  notes: string;
  unitPrice: number;
  lineTotal: number;
}

export interface Cart {
  restaurantId: string;
  tableId: string;
  items: CartItem[];
}

// ── Dashboard analytics ───────────────────────────────────────

export interface DailyRevenue {
  date: string;
  total: number;
  order_count: number;
}

export interface TopItem {
  item_name_en: string;
  item_name_ar: string;
  quantity_sold: number;
  revenue: number;
}

export interface Analytics {
  revenue_today: number;
  orders_today: number;
  orders_pending: number;
  revenue_week: DailyRevenue[];
  top_items: TopItem[];
  avg_order_value: number;
}

// ── Form types ────────────────────────────────────────────────

export interface RestaurantFormData {
  name_en: string;
  name_ar: string;
  slug: string;
  description_en?: string;
  description_ar?: string;
  phone?: string;
  address_en?: string;
  address_ar?: string;
  governorate: Restaurant['governorate'];
}

export interface ItemFormData {
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  price: number;
  category_id?: string;
  is_available: boolean;
  is_featured: boolean;
  tags: string[];
  image_url?: string;
}

export interface CategoryFormData {
  name_en: string;
  name_ar: string;
  emoji?: string;
  sort_order: number;
}

export interface PlaceOrderPayload {
  restaurant_id: string;
  table_id: string;
  order_type?: OrderType;
  customer_name?: string;
  notes?: string;
  session_token: string;
  // Car order fields
  car_number?: string;
  car_color?: string;
  items: {
    item_id: string;
    item_name_en: string;
    item_name_ar: string;
    variation_id?: string;
    variation_name_en?: string;
    variation_name_ar?: string;
    quantity: number;
    unit_price: number;
    addons: CartAddon[];
    notes?: string;
    line_total: number;
  }[];
}

// ── Manual order form ─────────────────────────────────────────

export interface ManualOrderForm {
  customer_name: string;
  notes: string;
  items: {
    item_id: string;
    variation_id: string | null;
    addons: string[]; // addon ids
    quantity: number;
    notes: string;
  }[];
}

// ── Reviews ───────────────────────────────────────────────────

export interface Review {
  id: string;
  restaurant_id: string;
  order_id: string | null;
  rating: number;
  comment: string | null;
  is_public: boolean;
  reviewer_name: string | null;
  created_at: string;
}

// ── Subscriptions & Payments ──────────────────────────────────

export interface Plan {
  id: string;
  name_en: string;
  name_ar: string;
  price_bhd: number;
  interval: string;
  is_active: boolean;
  features: string[];
  created_at: string;
}

export interface Subscription {
  id: string;
  restaurant_id: string;
  plan_id: string;
  status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'paused';
  amount_bhd: number;
  currency: string;
  current_period_start: string;
  current_period_end: string;
  trial_ends_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  admin_notes: string | null;
  billing_cycle_days: number;
  created_at: string;
  updated_at: string;
  // Relations
  plans?: Plan;
  restaurants?: Restaurant;
}

export interface Payment {
  id: string;
  subscription_id: string;
  restaurant_id: string;
  amount_bhd: number;
  payment_method: 'cash' | 'bank_transfer' | 'benefit' | 'other';
  reference: string | null;
  paid_at: string;
  period_from: string;
  period_to: string;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
  // Relations
  restaurants?: Restaurant;
}

// ── Push subscriptions ────────────────────────────────────────

export interface PushSubscription {
  id: string;
  restaurant_id: string | null;
  user_id: string | null;
  endpoint: string;
  p256dh: string;
  auth_key: string;
  user_agent: string | null;
  created_at: string;
}

// ── Re-exports from constants ────────────────────────────────
export type { GovernorateKey } from './constants';
export { ORDER_STATUS_CONFIG, ORDER_TYPE_LABELS, GOVERNORATES } from './constants';
