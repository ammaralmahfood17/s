import { createClient } from '@/lib/supabase/server';
import { formatBHD } from '@/lib/utils';
import Link from 'next/link';
import {
  Store, CreditCard, TrendingUp, AlertCircle,
  UserCheck, Clock, CheckCircle, XCircle
} from 'lucide-react';
import { RevenueChart, SubscriptionPie } from '@/components/admin/AdminCharts';

async function getAdminStats() {
  const supabase = createClient();

  // Last 30 days range
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const firstOfMonth = new Date();
  firstOfMonth.setDate(1);
  firstOfMonth.setHours(0, 0, 0, 0);

  const [
    restaurants,
    subs,
    paymentsThisMonth,
    payments30d,
    ordersToday,
    pastDue,
    trialing,
  ] = await Promise.all([
    supabase.from('restaurants').select('id, name_en, name_ar, is_open, subscription_status, created_at').order('created_at', { ascending: false }),
    supabase.from('subscriptions').select('id, status, current_period_end, restaurant_id'),
    supabase.from('payments').select('amount_bhd').gte('paid_at', firstOfMonth.toISOString()),
    supabase.from('payments').select('amount_bhd, paid_at').gte('paid_at', thirtyDaysAgo.toISOString()).order('paid_at', { ascending: true }),
    supabase.from('orders').select('id', { count: 'exact' }).gte('created_at', new Date().toISOString().split('T')[0] + 'T00:00:00'),
    supabase.from('subscriptions').select('id', { count: 'exact' }).eq('status', 'past_due'),
    supabase.from('subscriptions').select('id', { count: 'exact' }).eq('status', 'trialing'),
  ]);

  const monthlyRevenue = (paymentsThisMonth.data ?? []).reduce(
    (s: number, p: { amount_bhd: number }) => s + Number(p.amount_bhd), 0
  );

  // Build daily revenue map for last 30 days
  const dailyMap = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split('T')[0];
    dailyMap.set(key, 0);
  }
  for (const p of (payments30d.data ?? []) as { amount_bhd: number; paid_at: string }[]) {
    const key = new Date(p.paid_at).toISOString().split('T')[0];
    if (dailyMap.has(key)) {
      dailyMap.set(key, (dailyMap.get(key) ?? 0) + Number(p.amount_bhd));
    }
  }
  const dailyRevenue = Array.from(dailyMap.entries()).map(([date, total]) => ({
    date,
    total: Math.round(total * 1000) / 1000,
  }));

  // Subscription breakdown
  const subData = (subs.data ?? []) as { status: string }[];
  const statusCounts = new Map<string, number>();
  for (const s of subData) {
    statusCounts.set(s.status, (statusCounts.get(s.status) ?? 0) + 1);
  }
  const subscriptionBreakdown = Array.from(statusCounts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Restaurants expiring in next 7 days
  const soon = new Date(); soon.setDate(soon.getDate() + 7);
  const expiringSoon = (subs.data ?? []).filter(s =>
    s.status === 'active' && new Date(s.current_period_end) <= soon
  ).length;

  return {
    totalRestaurants: restaurants.data?.length ?? 0,
    activeRestaurants: (restaurants.data ?? []).filter(r => r.subscription_status === 'active').length,
    trialingCount: trialing.count ?? 0,
    pastDueCount: pastDue.count ?? 0,
    monthlyRevenue,
    ordersToday: ordersToday.count ?? 0,
    expiringSoon,
    recentRestaurants: (restaurants.data ?? []).slice(0, 8),
    dailyRevenue,
    subscriptionBreakdown,
  };
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

export default async function AdminOverviewPage() {
  const stats = await getAdminStats();

  const statCards = [
    { icon: Store,        label: 'إجمالي العربات',       value: String(stats.totalRestaurants), color: 'text-primary' },
    { icon: CheckCircle,  label: 'اشتراكات نشطة',        value: String(stats.activeRestaurants), color: 'text-green-400' },
    { icon: Clock,        label: 'في التجربة',            value: String(stats.trialingCount),     color: 'text-yellow-400' },
    { icon: TrendingUp,   label: 'إيرادات هذا الشهر',    value: formatBHD(stats.monthlyRevenue), color: 'text-primary' },
    { icon: AlertCircle,  label: 'متأخرة الدفع',          value: String(stats.pastDueCount),     color: stats.pastDueCount > 0 ? 'text-red-400' : 'text-muted-foreground' },
    { icon: CreditCard,   label: 'تنتهي قريباً (7 أيام)', value: String(stats.expiringSoon),     color: stats.expiringSoon > 0 ? 'text-orange-400' : 'text-muted-foreground' },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          لوحة الإدارة
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          منصة دوكان · البحرين 🇧🇭
        </p>
      </div>

      {/* Alerts */}
      {stats.pastDueCount > 0 && (
        <div className="flex items-center gap-3 bg-red-950/40 border border-red-800 rounded-xl px-4 py-3">
          <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">
            {stats.pastDueCount} اشتراك متأخر في الدفع — يحتاج متابعة
          </p>
          <Link href="/admin/subscriptions?filter=past_due" className="ms-auto text-xs text-red-400 hover:text-red-300">
            عرض ←
          </Link>
        </div>
      )}

      {stats.expiringSoon > 0 && (
        <div className="flex items-center gap-3 bg-orange-950/40 border border-orange-800 rounded-xl px-4 py-3">
          <Clock size={18} className="text-orange-400 flex-shrink-0" />
          <p className="text-sm text-orange-300">
            {stats.expiringSoon} اشتراك ينتهي خلال 7 أيام
          </p>
          <Link href="/admin/subscriptions?filter=expiring" className="ms-auto text-xs text-orange-400 hover:text-orange-300">
            عرض ←
          </Link>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {statCards.map(s => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center gap-1.5 mb-1">
              <s.icon size={14} className={s.color} />
              <span className="stat-label text-xs">{s.label}</span>
            </div>
            <div className={`stat-value ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RevenueChart data={stats.dailyRevenue} />
        <SubscriptionPie data={stats.subscriptionBreakdown} />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { href: '/admin/restaurants', icon: Store, label: 'إدارة العربات' },
          { href: '/admin/subscriptions', icon: CreditCard, label: 'إدارة الاشتراكات' },
          { href: '/admin/payments', icon: TrendingUp, label: 'تسجيل دفعة' },
        ].map(a => (
          <Link key={a.href} href={a.href}
            className="card-hover flex items-center gap-3 py-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20
                            flex items-center justify-center flex-shrink-0">
              <a.icon size={18} className="text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground">
              {a.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Recent restaurants */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title mb-0">أحدث العربات</h2>
          <Link href="/admin/restaurants" className="text-xs text-primary hover:text-primary">
            عرض الكل ←
          </Link>
        </div>
        <div className="space-y-2">
          {stats.recentRestaurants.map((r: {
            id: string; name_en: string; name_ar: string;
            is_open: boolean; subscription_status: string; created_at: string;
          }) => (
            <Link key={r.id} href={`/admin/restaurants/${r.id}`}>
              <div className="card-hover flex items-center gap-3 py-2.5">
                <div className="w-9 h-9 rounded-xl bg-card flex items-center justify-center
                                flex-shrink-0 text-lg">
                  🏪
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {r.name_ar}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString('en-BH')}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`badge ${STATUS_BADGE[r.subscription_status] ?? 'badge-pending'}`}>
                    {STATUS_LABEL[r.subscription_status] ?? r.subscription_status}
                  </span>
                  <span className={`text-xs ${r.is_open ? 'text-green-400' : 'text-muted-foreground'}`}>
                    {r.is_open ? '● مفتوح' : '● مغلق'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
