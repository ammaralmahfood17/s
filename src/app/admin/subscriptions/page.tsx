import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { formatBHD } from '@/lib/utils';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { AdminQuickActions } from './AdminQuickActions';
import type { Subscription } from '@/types';

const STATUS_BADGE: Record<string, string> = {
  active:    'badge-confirmed',
  trialing:  'badge-preparing',
  past_due:  'badge-cancelled',
  cancelled: 'badge-cancelled',
  paused:    'badge-pending',
  free:      'badge-confirmed',
};

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  const supabase = createClient();
  const filter = searchParams.filter;

  let query = supabase
    .from('subscriptions')
    .select(`
      *, 
      plans(name_en, name_ar, price_bhd),
      restaurants(id, name_en, name_ar, slug, phone, owner_id)
    `)
    .order('current_period_end', { ascending: true });

  if (filter === 'past_due') query = query.eq('status', 'past_due');
  else if (filter === 'expiring') {
    const soon = new Date(); soon.setDate(soon.getDate() + 7);
    query = query.eq('status', 'active').lte('current_period_end', soon.toISOString());
  } else if (filter === 'trialing') query = query.eq('status', 'trialing');

  const { data: subs } = await query;
  const rows = subs ?? [];

  const tabs = [
    { key: '', label: 'الكل' },
    { key: 'active', label: 'نشط' },
    { key: 'trialing', label: 'تجريبي' },
    { key: 'past_due', label: 'متأخر' },
    { key: 'expiring', label: 'ينتهي قريباً' },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-6xl space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">
          الاشتراكات
        </h1>
        <p className="text-sm text-muted-foreground">
          {rows.length} اشتراك{filter ? ` · ${filter}` : ''}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <Link key={tab.key}
            href={`/admin/subscriptions${tab.key ? `?filter=${tab.key}` : ''}`}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
              (filter ?? '') === tab.key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground bg-card'
            }`}>
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto table-scroll">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-border">
                {['العربة', 'الخطة', 'الحالة', 'تاريخ الانتهاء', 'الأيام المتبقية', 'المبلغ', 'إجراءات'].map(h => (
                  <th key={h} className="text-start text-xs font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(rows ?? []).map((s: Subscription) => {
                const r = s.restaurants;
                const daysLeft = Math.ceil(
                  (new Date(s.current_period_end).getTime() - Date.now()) / 86400000
                );
                const isExpired = daysLeft < 0;
                const isUrgent = daysLeft <= 7 && daysLeft >= 0 && s.status === 'active';

                return (
                  <tr key={s.id} className={`border-b border-border hover:bg-card transition-colors ${isExpired ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{r?.name_ar ?? '—'}</div>
                      <div className="text-xs text-muted-foreground font-mono">{r?.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {s.plans?.name_ar ?? '—'}
                      <div className="text-muted-foreground">{s.plans?.price_bhd === 0 ? 'مجاني' : `${formatBHD(s.plans?.price_bhd ?? 0)}/شهر`}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${STATUS_BADGE[s.status] ?? 'badge-pending'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(s.current_period_end).toLocaleDateString('en-BH')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-bold ${
                        isExpired ? 'text-red-400' :
                        isUrgent  ? 'text-orange-400' :
                        'text-muted-foreground'
                      }`}>
                        {isExpired ? `منذ ${Math.abs(daysLeft)} يوم` : `${daysLeft} يوم`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {s.amount_bhd ? formatBHD(s.amount_bhd) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/restaurants/${r?.id}`}
                          className="text-xs text-primary">
                          إدارة
                        </Link>
                        <AdminQuickActions
                          subscriptionId={s.id}
                          restaurantId={r?.id ?? ''}
                          currentStatus={s.status}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {rows.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <p>لا توجد اشتراكات</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
