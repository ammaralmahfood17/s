'use client';

import { useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

export type WeekHours = Record<string, DayHours>;

const DAYS = [
  { key: 'sun', en: 'Sunday',    ar: 'الأحد' },
  { key: 'mon', en: 'Monday',    ar: 'الاثنين' },
  { key: 'tue', en: 'Tuesday',   ar: 'الثلاثاء' },
  { key: 'wed', en: 'Wednesday', ar: 'الأربعاء' },
  { key: 'thu', en: 'Thursday',  ar: 'الخميس' },
  { key: 'fri', en: 'Friday',    ar: 'الجمعة' },
  { key: 'sat', en: 'Saturday',  ar: 'السبت' },
];

const DEFAULT_HOURS: WeekHours = {
  sun: { open: '08:00', close: '23:00', closed: false },
  mon: { open: '08:00', close: '23:00', closed: false },
  tue: { open: '08:00', close: '23:00', closed: false },
  wed: { open: '08:00', close: '23:00', closed: false },
  thu: { open: '08:00', close: '23:00', closed: false },
  fri: { open: '12:00', close: '24:00', closed: false },
  sat: { open: '08:00', close: '24:00', closed: false },
};

export function parseHours(raw: unknown): WeekHours {
  if (!raw || typeof raw !== 'object') return DEFAULT_HOURS;
  return { ...DEFAULT_HOURS, ...(raw as WeekHours) };
}

export function isOpenNow(hours: WeekHours): boolean {
  const now = new Date();
  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const dayKey = dayKeys[now.getDay()];
  const day = hours[dayKey];
  if (!day || day.closed) return false;

  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return currentTime >= day.open && currentTime <= day.close;
}

export function getOpeningHoursText(hours: WeekHours, dayKey: string, locale: 'en' | 'ar'): string {
  const day = hours[dayKey];
  if (!day) return '';
  if (day.closed) return locale === 'ar' ? 'مغلق' : 'Closed';
  return `${day.open} – ${day.close}`;
}

interface Props {
  value: WeekHours;
  onChange: (hours: WeekHours) => void;
  locale: string;
}

export function OpeningHoursEditor({ value, onChange, locale }: Props) {
  const isAr = locale === 'ar';
  const hours = parseHours(value);

  const update = (dayKey: string, field: keyof DayHours, val: string | boolean) => {
    onChange({ ...hours, [dayKey]: { ...hours[dayKey], [field]: val } });
  };

  // Copy from previous day
  const copyFromPrev = (dayKey: string) => {
    const idx = DAYS.findIndex(d => d.key === dayKey);
    if (idx <= 0) return;
    const prevKey = DAYS[idx - 1].key;
    onChange({ ...hours, [dayKey]: { ...hours[prevKey] } });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Clock size={16} className="text-brand-400" />
        <span className="text-sm font-medium text-[#fafaf9]">
          {isAr ? 'ساعات العمل' : 'Opening Hours'}
        </span>
      </div>

      {DAYS.map((day) => {
        const dh = hours[day.key] ?? DEFAULT_HOURS[day.key];
        return (
          <div key={day.key}
            className={cn(
              'p-2.5 rounded-xl border transition-all space-y-2',
              dh.closed ? 'border-[#1a1916] opacity-60' : 'border-[#2a2825]'
            )}
          >
            {/* Row 1: day name + closed toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#a8a29e] font-medium">
                {isAr ? day.ar : day.en}
              </span>
              <button
                type="button"
                onClick={() => update(day.key, 'closed', !dh.closed)}
                className={cn(
                  'text-xs px-3 min-h-[36px] rounded-lg border transition-all touch-manipulation',
                  dh.closed
                    ? 'bg-red-950 border-red-900 text-red-400'
                    : 'bg-green-950 border-green-900 text-green-400'
                )}
              >
                {dh.closed ? (isAr ? 'مغلق' : 'Closed') : (isAr ? 'مفتوح' : 'Open')}
              </button>
            </div>

            {/* Row 2: time inputs */}
            {!dh.closed && (
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={dh.open}
                  onChange={e => update(day.key, 'open', e.target.value)}
                  className="input text-sm py-2 px-2.5 flex-1 min-w-0"
                />
                <span className="text-[#3a3835] text-xs flex-shrink-0">—</span>
                <input
                  type="time"
                  value={dh.close}
                  onChange={e => update(day.key, 'close', e.target.value)}
                  className="input text-sm py-2 px-2.5 flex-1 min-w-0"
                />
                {/* Copy from prev */}
                {DAYS.findIndex(d => d.key === day.key) > 0 && (
                  <button
                    type="button"
                    onClick={() => copyFromPrev(day.key)}
                    className="w-9 h-9 flex-shrink-0 flex items-center justify-center
                               text-[#57534e] active:text-[#a8a29e] active:bg-[#1a1916]
                               rounded-lg touch-manipulation"
                    title={isAr ? 'نسخ من اليوم السابق' : 'Copy from previous day'}
                  >
                    ↑
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Display component for customer-facing pages ────────────
export function OpeningHoursDisplay({
  hours,
  locale,
}: {
  hours: WeekHours;
  locale: string;
}) {
  const isAr = locale === 'ar';
  const [expanded, setExpanded] = useState(false);
  const todayIdx = new Date().getDay();
  const todayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][todayIdx];
  const todayHours = hours[todayKey];
  const open = isOpenNow(hours);

  return (
    <div className="text-xs">
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-1.5 text-[#a8a29e] hover:text-[#fafaf9] transition-colors"
      >
        <Clock size={12} />
        <span className={open ? 'text-green-400' : 'text-red-400'}>
          {open ? (isAr ? 'مفتوح الآن' : 'Open Now') : (isAr ? 'مغلق الآن' : 'Closed Now')}
        </span>
        {todayHours && !todayHours.closed && (
          <span className="text-[#57534e]">
            · {todayHours.open}–{todayHours.close}
          </span>
        )}
        <span className="text-[#3a3835]">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="mt-2 space-y-1 bg-[#1a1916] border border-[#2a2825] rounded-xl p-3">
          {DAYS.map((day) => {
            const dh = hours[day.key];
            const isToday = day.key === todayKey;
            return (
              <div key={day.key}
                className={cn(
                  'flex items-center justify-between',
                  isToday && 'text-brand-400 font-medium'
                )}
              >
                <span className={isToday ? 'text-brand-400' : 'text-[#57534e]'}>
                  {isAr ? day.ar : day.en}
                </span>
                <span className={dh?.closed ? 'text-red-500' : (isToday ? 'text-brand-400' : 'text-[#a8a29e]')}>
                  {getOpeningHoursText(hours, day.key, isAr ? 'ar' : 'en')}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
