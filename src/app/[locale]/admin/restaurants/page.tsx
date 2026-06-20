import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Search, Store, ExternalLink } from 'lucide-react';

const STATUS_BADGE: Record<string, string> = {
  active:    'badge-confirmed',
  trialing:  'badge-preparing',
  past_due:  'badge-cancelled',
  cancelled: 'badge-cancelled',
  paused:    'badge-pending',
  free:      'badge-confirmed',
};

export default async function AdminRestaurantsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const isAr = locale === 'ar';
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
          <h1 className="text-xl font-bold text-[#fafaf9]">
            {isAr ? 'جميع العربات' : 'All Restaurants'}
          </h1>
          <p className="text-sm text-[#57534e]">
            {rows.length} {isAr ? 'مسجلة' : 'registered'}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto table-scroll">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-[#2a2825]">
                {[
                  isAr ? 'اسم العربة' : 'Restaurant',
                  isAr ? 'الرابط' : 'Slug',
                  isAr ? 'الخطة' : 'Plan',
                  isAr ? 'الاشتراك' : 'Status',
                  isAr ? 'ينتهي في' : 'Expires',
                  isAr ? 'مفتوح' : 'Open',
                  isAr ? 'إجراءات' : 'Actions',
                ].map(h => (
                  <th key={h} className="text-start text-xs font-semibold text-[#57534e]
                                         px-4 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => {
                const sub = r.subscriptions?.[0];
                const plan = sub?.plans;
                const expiresAt = sub?.current_period_end ?? sub?.trial_ends_at;
                const isExpired = expiresAt && new Date(expiresAt) < new Date();

                return (
                  <tr key={r.id} className="border-b border-[#1a1916] hover:bg-[#1a1916] transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#fafaf9]">
                        {isAr ? r.name_ar : r.name_en}
                      </div>
                      <div className="text-xs text-[#57534e]">{r.phone ?? '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-[#57534e] font-mono text-xs">
                      {r.slug}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-[#a8a29e]">
                        {plan ? (isAr ? plan.name_ar : plan.name_en) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${STATUS_BADGE[r.subscription_status] ?? 'badge-pending'}`}>
                        {r.subscription_status ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {expiresAt ? (
                        <span className={`text-xs ${isExpired ? 'text-red-400' : 'text-[#a8a29e]'}`}>
                          {new Date(expiresAt).toLocaleDateString('en-BH')}
                          {isExpired && ' ⚠️'}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${r.is_open ? 'text-green-400' : 'text-[#57534e]'}`}>
                        {r.is_open ? '● Open' : '● Closed'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/${locale}/admin/restaurants/${r.id}`}
                          className="text-xs text-brand-400 hover:text-brand-300">
                          {isAr ? 'إدارة' : 'Manage'}
                        </Link>
                        <a href={`/${locale}/r/${r.slug}`} target="_blank"
                          className="text-xs text-[#57534e] hover:text-[#a8a29e]">
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
            <div className="text-center py-16 text-[#57534e]">
              <Store size={40} className="mx-auto mb-3 text-[#3a3835]" />
              <p>{isAr ? 'لا توجد عربات مسجلة بعد' : 'No restaurants registered yet'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
