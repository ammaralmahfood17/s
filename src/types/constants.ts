// ============================================================
// DOKAN — Shared Constants
// ============================================================

import type { OrderStatus, OrderType } from './index';

export type GovernorateKey = 'Capital' | 'Muharraq' | 'Northern' | 'Southern';

export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { en: string; ar: string; color: string; bg: string }
> = {
  pending:    { en: 'Pending',        ar: 'في الانتظار',     color: '#92400e', bg: '#fef3c7' },
  confirmed:  { en: 'Confirmed',      ar: 'تم التأكيد',      color: '#1e40af', bg: '#dbeafe' },
  preparing:  { en: 'Preparing',      ar: 'يتم التحضير',     color: '#92400e', bg: '#fef3c7' },
  ready:      { en: 'Ready',          ar: 'جاهز',           color: '#065f46', bg: '#d1fae5' },
  delivered:  { en: 'Delivered',      ar: 'تم التسليم',      color: '#3730a3', bg: '#e0e7ff' },
  cancelled:  { en: 'Cancelled',      ar: 'ملغى',            color: '#991b1b', bg: '#fee2e2' },
};

export const ORDER_TYPE_LABELS: Record<OrderType, { en: string; ar: string }> = {
  table:    { en: 'Table Order',     ar: 'طلب طاولة' },
  car:      { en: 'Car Order',       ar: 'طلب سيارة' },
  external: { en: 'External Order',  ar: 'طلب من الخارج' },
  manual:   { en: 'Manual Order',    ar: 'طلب يدوي' },
};

export const GOVERNORATES: Record<GovernorateKey, { en: string; ar: string }> = {
  Capital:  { en: 'Capital Governorate',  ar: 'محافظة العاصمة' },
  Muharraq: { en: 'Muharraq Governorate', ar: 'محافظة المحرق' },
  Northern: { en: 'Northern Governorate', ar: 'المحافظة الشمالية' },
  Southern: { en: 'Southern Governorate', ar: 'المحافظة الجنوبية' },
};
