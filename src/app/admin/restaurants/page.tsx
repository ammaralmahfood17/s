import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Search, Store, ExternalLink } from 'lucide-react';
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

export default async function AdminRestaurantsPage() {
  const supabase = createClient();

  const { data: restaurants } = await supabase
    .from('restaurants')
    .select(`
      *,
      subscriptions(status, current_period_end, trial_ends_at, plan_id,
        plans(name_en, name_ar))
    `)
    .order('created_at', { ascending: false });

  const rows = restaurants ?? [];

  return (
    <div className="p-4 sm:p-6 max-w-6xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            جميع العربات
          </h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} مسجلة
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto table-scroll">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-border">
                {[
                  'اسم العربة',
                  'الرابط',
                  'الخطة',
                  'الاشتراك',
                  'ينتهي في',
                  'مفتوح',
                  'إجراءات',
                ].map(h => (
                  <th key={h} className="text-start text-xs font-semibold text-muted-foreground
                                         px-4 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r: RestaurantRow) => {
                const sub = r.subscriptions?.[0];
                const plan = sub?.plans;
                const expiresAt = sub?.current_period_end ?? sub?.trial_ends_at;
                const isExpired = expiresAt && new Date(expiresAt) < new Date();

                return (
                  <tr key={r.id} className="border-b border-border hover:bg-card transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {r.name_ar}
                      </div>
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
                        {r.subscription_status ?? '—'}
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
                          className="text-xs text-primary hover:text-primary">
                          إدارة
                        </Link>
                        <a href={`/r/${r.slug}`} target="_blank"
                          className="text-xs text-muted-foreground hover:text-muted-foreground">
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {rows.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Store size={40} className="mx-auto mb-3 text-muted-foreground/80" />
              <p>لا توجد عربات مسجلة بعد</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
