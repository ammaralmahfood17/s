'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Store, ExternalLink, X, Filter } from 'lucide-react';
import type { Restaurant } from '@/types';

interface RestaurantRow extends Restaurant {
  subscriptions?: {
    status: string;
    current_period_end: string;
    trial_ends_at: string | null;
    plan_id: string;
    plans?: { name_en: string; name_ar: string } | null;
  }[];
}

const STATUS_BADGE: Record<string, string> = {
  active:    'badge-confirmed',
  trialing:  'badge-preparing',
  past_due:  'badge-cancelled',
  cancelled: 'badge-cancelled',
  paused:    'badge-pending',
  free:      'badge-confirmed',
};

const STATUS_LABEL: Record<string, string> = {
  active:    'نشط',
  trialing:  'تجريبي',
  past_due:  'متأخر',
  cancelled: 'ملغي',
  paused:    'موقوف',
  free:      'مجاني',
};

export default function RestaurantsTable({ rows }: { rows: RestaurantRow[] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(r => {
      // Search match
      if (q) {
        const inNameAr = r.name_ar.toLowerCase().includes(q);
        const inNameEn = r.name_en.toLowerCase().includes(q);
        const inSlug   = r.slug.toLowerCase().includes(q);
        const inPhone  = (r.phone ?? '').toLowerCase().includes(q);
        if (!inNameAr && !inNameEn && !inSlug && !inPhone) return false;
      }
      // Status filter
      if (statusFilter && r.subscription_status !== statusFilter) return false;
      return true;
    });
  }, [rows, search, statusFilter]);

  const statuses = useMemo(() => {
    const set = new Set(rows.map(r => r.subscription_status).filter(Boolean));
    return Array.from(set);
  }, [rows]);

  return (
    <div className="space-y-4">
      {/* Search + Filter bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث باسم العربة، الرابط، أو رقم الهاتف..."
            className="input pr-9 text-sm"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>

        {statuses.length > 1 && (
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input w-auto min-w-[120px] text-sm"
          >
            <option value="">كل الحالات</option>
            {statuses.map(s => (
              <option key={s} value={s}>{STATUS_LABEL[s] ?? s}</option>
            ))}
          </select>
        )}
      </div>

      {/* Results count */}
      <div className="text-xs text-muted-foreground px-1">
        {filtered.length} من {rows.length} عربة
      </div>

      {/* Mobile: card view */}
      <div className="block md:hidden space-y-2">
        {filtered.map((r: RestaurantRow) => {
          const sub = r.subscriptions?.[0];
          const plan = sub?.plans;
          return (
            <Link key={r.id} href={`/admin/restaurants/${r.id}`}>
              <div className="card-hover">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center flex-shrink-0 text-lg">
                    🏪
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-foreground truncate">
                      {r.name_ar}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      /{r.slug}
                    </div>
                  </div>
                  <span className={`badge ${STATUS_BADGE[r.subscription_status] ?? 'badge-pending'}`}>
                    {STATUS_LABEL[r.subscription_status] ?? r.subscription_status}
                  </span>
                </div>

                {(r.phone || plan) && (
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {r.phone && <span>{r.phone}</span>}
                    {plan && <span>{plan.name_ar}</span>}
                    <span className={`me-auto ${r.is_open ? 'text-green-400' : 'text-muted-foreground'}`}>
                      {r.is_open ? '● مفتوح' : '● مغلق'}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
        {filtered.length === 0 && <div className="empty-state py-12">لا توجد نتائج للبحث</div>}
      </div>

      {/* Desktop: table */}
      <div className="card overflow-hidden p-0 hidden md:block">
        <div className="overflow-x-auto table-scroll">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-border">
                {['اسم العربة', 'الرابط', 'الخطة', 'الاشتراك', 'ينتهي في', 'مفتوح', 'إجراءات'].map(h => (
                  <th key={h} className="text-start text-xs font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r: RestaurantRow) => {
                const sub = r.subscriptions?.[0];
                const plan = sub?.plans;
                const expiresAt = sub?.current_period_end ?? sub?.trial_ends_at;
                const isExpired = expiresAt && new Date(expiresAt) < new Date();

                return (
                  <tr key={r.id} className="border-b border-border hover:bg-card transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{r.name_ar}</div>
                      <div className="text-xs text-muted-foreground">{r.phone ?? '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                      {r.slug}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">
                        {plan ? plan.name_ar : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${STATUS_BADGE[r.subscription_status] ?? 'badge-pending'}`}>
                        {STATUS_LABEL[r.subscription_status] ?? r.subscription_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {expiresAt ? (
                        <span className={`text-xs ${isExpired ? 'text-red-400' : 'text-muted-foreground'}`}>
                          {new Date(expiresAt).toLocaleDateString('en-BH')}
                          {isExpired && ' ⚠️'}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${r.is_open ? 'text-green-400' : 'text-muted-foreground'}`}>
                        {r.is_open ? '● مفتوح' : '● مغلق'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/restaurants/${r.id}`}
                          className="text-xs text-primary hover:text-primary font-semibold">
                          إدارة
                        </Link>
                        <a href={`/r/${r.slug}`} target="_blank"
                          className="text-muted-foreground hover:text-muted-foreground">
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Store size={40} className="mx-auto mb-3 text-muted-foreground/80" />
              <p>{search ? 'لا توجد نتائج للبحث' : 'لا توجد عربات مسجلة بعد'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
