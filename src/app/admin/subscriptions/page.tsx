import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { formatBHD } from '@/lib/utils';
import { AlertCircle, Clock, CheckCircle, Search } from 'lucide-react';
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
  searchParams: { filter?: string; q?: string };
}) {
  const supabase = createClient();
  const filter = searchParams.filter ?? '';
  const query = searchParams.q ?? '';

  // ── Count per status for badge tabs ──
  const countQuery = supabase.from('subscriptions').select('status', { count: 'exact', head: true });
  const counts: Record<string, number> = { '': 0, active: 0, trialing: 0, past_due: 0, expiring: 0 };

  try {
    // Total count
    const { count: total } = await countQuery;
    counts[''] = total ?? 0;

    // Per status
    const { count: active } = await supabase
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');
    counts.active = active ?? 0;

    const { count: trialing } = await supabase
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'trialing');
    counts.trialing = trialing ?? 0;

    const { count: pastDue } = await supabase
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'past_due');
    counts.past_due = pastDue ?? 0;

    const soon = new Date(); soon.setDate(soon.getDate() + 7);
    const { count: expiring } = await supabase
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .lte('current_period_end', soon.toISOString());
    counts.expiring = expiring ?? 0;
  } catch (err) {
    console.error('[subscriptions] count query error:', err);
  }

  // ── Main data query ──
  let queryBuilder = supabase
    .from('subscriptions')
    .select(`
      *, 
      plans(name_en, name_ar, price_bhd),
      restaurants(id, name_en, name_ar, slug, phone, owner_id)
    `);

  // Apply filter
  if (filter === 'past_due') {
    queryBuilder = queryBuilder.eq('status', 'past_due');
  } else if (filter === 'expiring') {
    const soon = new Date(); soon.setDate(soon.getDate() + 7);
    queryBuilder = queryBuilder.eq('status', 'active').lte('current_period_end', soon.toISOString());
  } else if (filter === 'trialing') {
    queryBuilder = queryBuilder.eq('status', 'trialing');
  } else if (filter === 'active') {
    queryBuilder = queryBuilder.eq('status', 'active');
  }

  // Apply search filter on restaurant name
  if (query) {
    // First find restaurant IDs matching the search
    const { data: matchedRestaurants } = await supabase
      .from('restaurants')
      .select('id')
      .or(`name_ar.ilike.%${query}%,name_en.ilike.%${query}%`);
    const matchedIds = (matchedRestaurants ?? []).map(r => r.id);
    if (matchedIds.length > 0) {
      queryBuilder = queryBuilder.in('restaurant_id', matchedIds);
    } else {
      // No matches — return empty set
      queryBuilder = queryBuilder.in('restaurant_id', ['__none__']);
    }
  }

  queryBuilder = queryBuilder.order('current_period_end', { ascending: true });

  const { data: subs } = await queryBuilder;
  const rows = subs ?? [];

  const tabs = [
    { key: '',        label: 'الكل', count: counts[''] },
    { key: 'active',  label: 'نشط', count: counts.active },
    { key: 'trialing',label: 'تجريبي', count: counts.trialing },
    { key: 'past_due',label: 'متأخر', count: counts.past_due },
    { key: 'expiring',label: 'ينتهي قريباً', count: counts.expiring },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-6xl space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[#fafaf9]">
          الاشتراكات
        </h1>
        <p className="text-sm text-[#57534e]">
          {rows.length} اشتراك{filter ? ` · ${filter}` : ''}{query ? ` · بحث: ${query}` : ''}
        </p>
      </div>

      {/* Search */}
      <div className="relative flex-1 max-w-xs">
        <Search size={16} className="absolute end-3 top-1/2 -translate-y-1/2 text-[#57534e] pointer-events-none" />
        <form method="GET" action="/admin/subscriptions" id="subs-search-form">
          {filter && <input type="hidden" name="filter" value={filter} />}
          <input
            name="q"
            defaultValue={query}
            placeholder="بحث باسم العربة..."
            className="input w-full text-sm py-2.5 pe-9 ps-3"
            onChange={(e) => {
              const form = e.currentTarget.form;
              if (form) form.requestSubmit();
            }}
          />
        </form>
      </div>

      {/* Filter tabs with counts */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <Link
            key={tab.key}
            href={`/admin/subscriptions${tab.key || query ? '?' : ''}${
              tab.key ? `filter=${tab.key}` : ''
            }${tab.key && query ? '&' : ''}${query ? `q=${encodeURIComponent(query)}` : ''}`}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-sm font-medium transition-all inline-flex items-center gap-1.5 ${
              (filter ?? '') === tab.key
                ? 'bg-brand-500 text-[#0f0e0c]'
                : 'text-[#a8a29e] hover:text-[#fafaf9] bg-[#1a1916]'
            }`}
          >
            {tab.label}
            <span className={`text-xs rounded-full px-1.5 py-0.5 ${
              (filter ?? '') === tab.key
                ? 'bg-[#0f0e0c]/20 text-[#0f0e0c]'
                : 'bg-[#2a2825] text-[#a8a29e]'
            }`}>
              {tab.count}
            </span>
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto table-scroll">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-[#2a2825]">
                {['العربة', 'الخطة', 'الحالة', 'تاريخ الانتهاء', 'الأيام المتبقية', 'المبلغ', 'إجراءات'].map(h => (
                  <th key={h} className="text-start text-xs font-semibold text-[#57534e] px-4 py-3 whitespace-nowrap">
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
                  <tr key={s.id} className={`border-b border-[#1a1916] hover:bg-[#1a1916] transition-colors ${isExpired ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#fafaf9]">{r?.name_ar ?? '—'}</div>
                      <div className="text-xs text-[#57534e] font-mono">{r?.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#a8a29e]">
                      {s.plans?.name_ar ?? '—'}
                      <div className="text-[#57534e]">{s.plans?.price_bhd === 0 ? 'مجاني' : `${formatBHD(s.plans?.price_bhd ?? 0)}/شهر`}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${STATUS_BADGE[s.status] ?? 'badge-pending'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#a8a29e]">
                      {new Date(s.current_period_end).toLocaleDateString('en-BH')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-bold ${
                        isExpired ? 'text-red-400' :
                        isUrgent  ? 'text-orange-400' :
                        'text-[#a8a29e]'
                      }`}>
                        {isExpired ? `منذ ${Math.abs(daysLeft)} يوم` : `${daysLeft} يوم`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#a8a29e]">
                      {s.amount_bhd ? formatBHD(s.amount_bhd) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/restaurants/${r?.id}`}
                        className="text-xs text-brand-400 hover:text-brand-300">
                        إدارة ←
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {rows.length === 0 && (
            <div className="text-center py-16 text-[#57534e]">
              <p>{query ? 'لا توجد نتائج للبحث' : 'لا توجد اشتراكات'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
