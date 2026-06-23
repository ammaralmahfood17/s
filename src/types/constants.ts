// ============================================================
// DOKAN — Shared Constants
// ============================================================

import type { OrderStatus, OrderType } from './index';

export type GovernorateKey = 'Capital' | 'Muharraq' | 'Northern' | 'Southern';

export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { en: string; ar: string; color: string; bg: string }
> = {
  pending:    { en: 'Pending',        ar: 'في الانتظار',     color: '#a8a29e', bg: '#1c1917' },
  confirmed:  { en: 'Confirmed',      ar: 'تم التأكيد',      color: '#86efac', bg: '#1a2e1a' },
  preparing:  { en: 'Preparing',      ar: 'يتم التحضير',     color: '#fcd34d', bg: '#1c1406' },
  ready:      { en: 'Ready',          ar: 'جاهز',           color: '#5eead4', bg: '#0f2d2d' },
  delivered:  { en: 'Delivered',      ar: 'تم التسليم',      color: '#a5b4fc', bg: '#1a1a2e' },
  cancelled:  { en: 'Cancelled',      ar: 'ملغى',            color: '#fca5a5', bg: '#2a1010' },
};

export const ORDER_TYPE_LABELS: Record<OrderType, { en: string; ar: string }> = {
  table:   { en: 'Table Order',   ar: 'طلب طاولة' },
  car:     { en: 'Car Order',     ar: 'طلب سيارة' },
  manual:  { en: 'Manual Order',  ar: 'طلب يدوي' },
};

export const GOVERNORATES: Record<GovernorateKey, { en: string; ar: string }> = {
  Capital:  { en: 'Capital Governorate',  ar: 'محافظة العاصمة' },
  Muharraq: { en: 'Muharraq Governorate', ar: 'محافظة المحرق' },
  Northern: { en: 'Northern Governorate', ar: 'المحافظة الشمالية' },
  Southern: { en: 'Southern Governorate', ar: 'المحافظة الجنوبية' },
};
