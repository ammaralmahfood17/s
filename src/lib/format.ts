/**
 * DOKAN — Formatting Utilities
 *
 * Specialised formatting helpers for Bahraini context (BHD currency,
 * Arabic locale, phone numbers, order numbers, durations, relative time).
 *
 * NOTE: General-purpose helpers (formatBHD with locale param, formatDate,
 * formatPhone, formatRelativeTime) also exist in @/lib/utils — this file
 * provides the exact API surface requested by the task spec.
 */

/**
 * Format a number as Bahraini Dinar (BHD).
 *
 * @example
 *   formatBHD(1.5)   // "1.500 د.ب"
 *   formatBHD(0)     // "٠٫٠٠٠ د.ب"
 */
export function formatBHD(amount: number): string {
  if (!isFinite(amount)) return '٠٫٠٠٠ د.ب';
  return `${amount.toFixed(3)} د.ب`;
}

/**
 * Format an ISO date string to a readable Bahraini-arabic date.
 *
 * @example
 *   formatDate('2024-12-25T10:00:00Z') // "25 ديسمبر 2024"
 */
export function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('ar-BH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format a Bahrain phone number.
 *
 * @example
 *   formatPhone('973xxxxxxxx') // "+973 xxxx xxxx"
 *   formatPhone('+973xxxxxxxx')
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 8) {
    // Local number: 12345678 → +973 1234 5678
    return `+973 ${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
  }
  if (cleaned.startsWith('973') && cleaned.length >= 11) {
    return `+973 ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
  }
  // Fallback — return as-is
  return phone;
}

/**
 * Format a numeric order number with leading zeros.
 *
 * @example
 *   formatOrderNumber(123)  // "#00123"
 *   formatOrderNumber(1)    // "#00001"
 */
export function formatOrderNumber(num: number): string {
  const padded = String(num).padStart(5, '0');
  return `#${padded}`;
}

/**
 * Format a duration in minutes as a human-readable Arabic string.
 *
 * @example
 *   formatDuration(45)  // "45 دقيقة"
 *   formatDuration(90)  // "1 ساعة و 30 دقيقة"
 *   formatDuration(120) // "2 ساعات"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 1) return 'أقل من دقيقة';

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return mins === 1 ? 'دقيقة واحدة' : `${mins} دقيقة`;
  }

  if (mins === 0) {
    const hourLabel = hours === 1 ? 'ساعة واحدة' : `${hours} ساعات`;
    return hourLabel;
  }

  const hourLabel = hours === 1 ? 'ساعة' : `${hours} ساعات`;
  return `${hourLabel} و ${mins} دقيقة`;
}

/**
 * Get a human-readable relative time string in Arabic.
 *
 * @example
 *   getRelativeTime(new Date(Date.now() - 300_000).toISOString()) // "منذ 5 دقائق"
 *   getRelativeTime(new Date(Date.now() - 86_400_000).toISOString()) // "منذ 1 يوم"
 */
export function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;

  if (diffMs < 0) return 'الآن';

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'الآن';
  if (minutes < 60) {
    return `منذ ${minutes} ${minutes === 1 ? 'دقيقة' : 'دقائق'}`;
  }
  if (hours < 24) {
    return `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`;
  }
  if (days < 7) {
    return `منذ ${days} ${days === 1 ? 'يوم' : 'أيام'}`;
  }
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `منذ ${weeks} ${weeks === 1 ? 'أسبوع' : 'أسابيع'}`;
  }

  // Fallback to formatted date
  return formatDate(dateStr);
}
