import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import SubscriptionsTable from '@/components/admin/SubscriptionsTable';
import type { Subscription } from '@/types';

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const supabase = createClient();

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
  const rows = (subs ?? []) as unknown as Subscription[];

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
          {rows.length} اشتراك
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

      <SubscriptionsTable rows={rows as any} />
    </div>
  );
}
