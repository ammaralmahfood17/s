// ============================================================
// DOKAN — Shared TypeScript Types
// ============================================================

export type Locale = 'en' | 'ar';

// ── Database row types ───────────────────────────────────────

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
  governorate: 'Capital' | 'Muharraq' | 'Northern' | 'Southern';
  currency: string;
  is_open: boolean;
  ordering_paused: boolean;
  pause_reason_en: string | null;
  pause_reason_ar: string | null;
  prep_time_minutes: number;
  opening_hours: Record<string, { open: string; close: string; closed: boolean }>;
  created_at: string;
  updated_at: string;
}

export interface RestaurantStaff {
  id: string;
  restaurant_id: string;
  user_id: string;
  role: 'owner' | 'manager' | 'staff';
  invited_email: string | null;
  is_primary?: boolean;
  created_at: string;
}

export interface Table {
  id: string;
  restaurant_id: string;
  name_en: string;
  name_ar: string;
  qr_token: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Category {
  id: string;
  restaurant_id: string;
  name_en: string;
  name_ar: string;
  emoji: string | null;
  sort_order: number;
  is_visible: boolean;
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
  stock_enabled?: boolean;
  stock_count?: number | null;
  sold_out?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Variation {
  id: string;
  item_id: string;
  name_en: string;
  name_ar: string;
  price_modifier: number;
  sort_order: number;
}

export interface Addon {
  id: string;
  item_id: string;
  name_en: string;
  name_ar: string;
  price: number;
  sort_order: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export interface Order {
  id: string;
  restaurant_id: string;
  table_id: string | null;
  order_number: string;
  status: OrderStatus;
  customer_name: string | null;
  notes: string | null;
  subtotal: number;
  total: number;
  payment_method: string;
  session_token: string | null;
  prep_time_minutes?: number | null;
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
}

export interface Review {
  id: string;
  restaurant_id: string;
  order_id: string | null;
  rating: number;
  comment: string | null;
  is_public?: boolean;
  reviewer_name?: string | null;
  created_at: string;
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
  cartId: string;           // nanoid for React key
  item: Item;
  variation: Variation | null;
  addons: CartAddon[];
  quantity: number;
  notes: string;
  unitPrice: number;        // base + variation modifier
  lineTotal: number;        // unitPrice * quantity + addons
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
  customer_name?: string;
  notes?: string;
  session_token: string;
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

// ── Utility ───────────────────────────────────────────────────

export type GovernorateKey = 'Capital' | 'Muharraq' | 'Northern' | 'Southern';

export const GOVERNORATES: Record<GovernorateKey, { en: string; ar: string }> = {
  Capital:  { en: 'Capital Governorate',  ar: 'محافظة العاصمة' },
  Muharraq: { en: 'Muharraq Governorate', ar: 'محافظة المحرق' },
  Northern: { en: 'Northern Governorate', ar: 'المحافظة الشمالية' },
  Southern: { en: 'Southern Governorate', ar: 'المحافظة الجنوبية' },
};

export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { en: string; ar: string; color: string; bg: string }
> = {
  pending:   { en: 'Pending',    ar: 'في الانتظار',     color: '#a8a29e', bg: '#1c1917' },
  confirmed: { en: 'Confirmed',  ar: 'تم التأكيد',      color: '#86efac', bg: '#1a2e1a' },
  preparing: { en: 'Preparing',  ar: 'يتم التحضير',     color: '#fcd34d', bg: '#1c1406' },
  ready:     { en: 'Ready',      ar: 'جاهز للاستلام',   color: '#5eead4', bg: '#0f2d2d' },
  completed: { en: 'Completed',  ar: 'مكتمل',           color: '#a5b4fc', bg: '#1a1a2e' },
  cancelled: { en: 'Cancelled',  ar: 'ملغى',            color: '#fca5a5', bg: '#2a1010' },
};
