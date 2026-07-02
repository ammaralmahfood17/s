'use client';

import Link from 'next/link';
import { formatBHD } from '@/lib/utils';
import { AdminQuickActions } from '@/app/admin/subscriptions/AdminQuickActions';

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

export default function SubscriptionsTable({ rows }: { rows: Record<string, any>[] }) {
  return (
    <>
      {/* Mobile cards */}
      <div className="block md:hidden space-y-2">
        {rows.map(s => {
          const r = s.restaurants;
          const daysLeft = Math.ceil(
            (new Date(s.current_period_end).getTime() - Date.now()) / 86400000
          );
          const isExpired = daysLeft < 0;
          const isUrgent = daysLeft <= 7 && daysLeft >= 0 && s.status === 'active';

          return (
            <div key={s.id} className={`card-hover ${isExpired ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <Link href={`/admin/restaurants/${r?.id}`} className="text-sm font-bold text-foreground truncate">
                  {r?.name_ar ?? '—'}
                </Link>
                <span className={`badge ${STATUS_BADGE[s.status] ?? 'badge-pending'}`}>
                  {STATUS_LABEL[s.status] ?? s.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  <span className="block">الخطة</span>
                  <span className="text-foreground font-medium">{s.plans?.name_ar ?? '—'}</span>
                </div>
                <div>
                  <span className="block">المبلغ</span>
                  <span className="text-foreground font-medium">{s.amount_bhd ? formatBHD(s.amount_bhd) : '—'}</span>
                </div>
                <div>
                  <span className="block">ينتهي</span>
                  <span className="text-foreground font-medium">{new Date(s.current_period_end).toLocaleDateString('en-BH')}</span>
                </div>
                <div>
                  <span className="block">المتبقي</span>
                  <span className={`font-bold ${
                    isExpired ? 'text-red-400' : isUrgent ? 'text-orange-400' : 'text-foreground'
                  }`}>
                    {isExpired ? `منذ ${Math.abs(daysLeft)} يوم` : `${daysLeft} يوم`}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border justify-between">
                <Link href={`/admin/restaurants/${r?.id}`}
                  className="text-xs text-primary hover:text-primary font-semibold">
                  إدارة العربة ←
                </Link>
                <AdminQuickActions
                  subscriptionId={s.id}
                  restaurantId={r?.id ?? ''}
                  currentStatus={s.status}
                />
              </div>
            </div>
          );
        })}

        {rows.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p>لا توجد اشتراكات</p>
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="card overflow-hidden p-0 hidden md:block">
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
              {rows.map(s => {
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
                    <td className="px-4 py-3 text-xs">
                      <span className="text-foreground font-medium">{s.plans?.name_ar ?? '—'}</span>
                      <div className="text-muted-foreground">{s.plans?.price_bhd === 0 ? 'مجاني' : `${formatBHD(s.plans?.price_bhd ?? 0)}/شهر`}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${STATUS_BADGE[s.status] ?? 'badge-pending'}`}>
                        {STATUS_LABEL[s.status] ?? s.status}
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
                          className="text-xs text-primary hover:text-primary font-semibold">
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
    </>
  );
}
