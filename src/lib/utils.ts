import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { nanoid } from 'nanoid';
import type { Locale } from '@/types';

// ── CSS class merging ──────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── BHD currency formatting ────────────────────────────────
export function formatBHD(amount: number, locale: Locale = 'ar'): string {
  const formatted = amount.toFixed(3);
  if (locale === 'ar') {
    return `${formatted} د.ب.`;
  }
  return `BHD ${formatted}`;
}

// ── Localized text helper ──────────────────────────────────
export function t(
  item: { name_en: string; name_ar: string } | { [key: string]: string },
  field: string,
  locale: Locale
): string {
  const key = `${field}_${locale}`;
  return (item as Record<string, string>)[key] || (item as Record<string, string>)[`${field}_en`] || '';
}

// ── Generate session token for anonymous orders ────────────
export function generateSessionToken(): string {
  return nanoid(21);
}

// ── Get or create session token ───────────────────────────
export function getOrCreateSessionToken(): string {
  if (typeof window === 'undefined') return generateSessionToken();
  const key = 'dokan_session';
  let token = sessionStorage.getItem(key);
  if (!token) {
    token = generateSessionToken();
    sessionStorage.setItem(key, token);
  }
  return token;
}

// ── Date formatting for Bahrain ───────────────────────────
export function formatDate(dateStr: string, locale: Locale = 'ar'): string {
  return new Date(dateStr).toLocaleDateString(
    locale === 'ar' ? 'ar-BH' : 'en-BH',
    { day: 'numeric', month: 'short', year: 'numeric' }
  );
}

export function formatTime(dateStr: string, locale: Locale = 'ar'): string {
  return new Date(dateStr).toLocaleTimeString(
    locale === 'ar' ? 'ar-BH' : 'en-BH',
    { hour: '2-digit', minute: '2-digit' }
  );
}

export function formatRelativeTime(dateStr: string, locale: Locale = 'ar'): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return locale === 'ar' ? 'الآن' : 'Just now';
  if (diffMin < 60) return locale === 'ar' ? `${diffMin} دقيقة` : `${diffMin}m ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return locale === 'ar' ? `${diffHours} ساعة` : `${diffHours}h ago`;

  return formatDate(dateStr, locale);
}

// ── Slug generation ────────────────────────────────────────
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\u0600-\u06FF]/g, '') // strip Arabic for slug
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

// ── Phone formatting for Bahrain ──────────────────────────
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('973')) {
    return `+973 ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

// ── Order status utilities ─────────────────────────────────
export function getNextStatus(
  current: string
): 'confirmed' | 'preparing' | 'ready' | 'completed' | null {
  const flow = {
    pending:   'confirmed',
    confirmed: 'preparing',
    preparing: 'ready',
    ready:     'completed',
  } as const;
  return (flow as Record<string, 'confirmed' | 'preparing' | 'ready' | 'completed'>)[current] ?? null;
}

export function getNextStatusLabel(current: string, locale: Locale): string {
  const labels: Record<string, { en: string; ar: string }> = {
    pending:   { en: 'Accept Order',     ar: 'قبول الطلب' },
    confirmed: { en: 'Start Preparing',  ar: 'بدء التحضير' },
    preparing: { en: 'Mark Ready',       ar: 'تحديد كجاهز' },
    ready:     { en: 'Mark Completed',   ar: 'تحديد كمكتمل' },
  };
  return labels[current]?.[locale] ?? '';
}

// ── Image URL helpers ──────────────────────────────────────
export function getPublicImageUrl(path: string | null, bucket: string = 'menu-images'): string {
  if (!path) return '/placeholder-food.jpg';
  if (path.startsWith('http')) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

// ── Cart calculations ──────────────────────────────────────
export function calcLineTotal(
  basePrice: number,
  variationModifier: number,
  addonPrices: number[],
  quantity: number
): number {
  const unitPrice = basePrice + variationModifier;
  const addonsTotal = addonPrices.reduce((sum, p) => sum + p, 0);
  return (unitPrice + addonsTotal) * quantity;
}
