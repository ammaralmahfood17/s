import { createClient } from '@/lib/supabase/server';
import { formatBHD } from '@/lib/utils';
import Link from 'next/link';
import {
  Store, CreditCard, TrendingUp, AlertCircle,
  UserCheck, Clock, CheckCircle, XCircle
} from 'lucide-react';

async function getAdminStats() {
  const supabase = createClient();

  const [
    restaurants,
    subs,
    paymentsThisMonth,
    ordersToday,
    pastDue,
    trialing,
  ] = await Promise.all([
    supabase.from('restaurants').select('id, name_en, name_ar, is_open, subscription_status, created_at').order('created_at', { ascending: false }),
    supabase.from('subscriptions').select('id, status, current_period_end, restaurant_id'),
    supabase.from('payments').select('amount_bhd').gte('paid_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    supabase.from('orders').select('id', { count: 'exact' }).gte('created_at', new Date().toISOString().split('T')[0] + 'T00:00:00'),
    supabase.from('subscriptions').select('id', { count: 'exact' }).eq('status', 'past_due'),
    supabase.from('subscriptions').select('id', { count: 'exact' }).eq('status', 'trialing'),
  ]);

  const monthlyRevenue = (paymentsThisMonth.data ?? []).reduce(
    (s: number, p: { amount_bhd: number }) => s + Number(p.amount_bhd), 0
  );

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
  active:    'Active',
  trialing:  'Trial',
  past_due:  'Past Due',
  cancelled: 'Cancelled',
  paused:    'Paused',
  free:      'Free',
};

export default async function AdminOverviewPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const isAr = locale === 'ar';
  const stats = await getAdminStats();

  const statCards = [
    { icon: Store,        label: isAr ? 'إجمالي العربات'    : 'Total Restaurants',  value: String(stats.totalRestaurants), color: 'text-brand-400' },
    { icon: CheckCircle,  label: isAr ? 'اشتراكات نشطة'     : 'Active Subs',         value: String(stats.activeRestaurants), color: 'text-green-400' },
    { icon: Clock,        label: isAr ? 'في التجربة'         : 'In Trial',            value: String(stats.trialingCount),     color: 'text-yellow-400' },
    { icon: TrendingUp,   label: isAr ? 'إيرادات هذا الشهر' : 'Revenue This Month',  value: formatBHD(stats.monthlyRevenue, 'en'), color: 'text-brand-400' },
    { icon: AlertCircle,  label: isAr ? 'متأخرة الدفع'       : 'Past Due',            value: String(stats.pastDueCount),     color: stats.pastDueCount > 0 ? 'text-red-400' : 'text-[#a8a29e]' },
    { icon: CreditCard,   label: isAr ? 'تنتهي قريباً (7 أيام)' : 'Expiring Soon',   value: String(stats.expiringSoon),     color: stats.expiringSoon > 0 ? 'text-orange-400' : 'text-[#a8a29e]' },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#fafaf9]">
          {isAr ? 'لوحة الإدارة' : 'Admin Overview'}
        </h1>
        <p className="text-sm text-[#57534e] mt-1">
          Dokan Platform · {isAr ? 'البحرين' : 'Bahrain'} 🇧🇭
        </p>
      </div>

      {/* Alerts */}
      {stats.pastDueCount > 0 && (
        <div className="flex items-center gap-3 bg-red-950/40 border border-red-800 rounded-xl px-4 py-3">
          <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">
            {stats.pastDueCount} {isAr ? 'اشتراك متأخر في الدفع — يحتاج متابعة' : 'subscription(s) past due — follow up needed'}
          </p>
          <Link href={`/${locale}/admin/subscriptions?filter=past_due`} className="ms-auto text-xs text-red-400 hover:text-red-300">
            {isAr ? 'عرض' : 'View'} →
          </Link>
        </div>
      )}

      {stats.expiringSoon > 0 && (
        <div className="flex items-center gap-3 bg-orange-950/40 border border-orange-800 rounded-xl px-4 py-3">
          <Clock size={18} className="text-orange-400 flex-shrink-0" />
          <p className="text-sm text-orange-300">
            {stats.expiringSoon} {isAr ? 'اشتراك ينتهي خلال 7 أيام' : 'subscription(s) expiring within 7 days'}
          </p>
          <Link href={`/${locale}/admin/subscriptions?filter=expiring`} className="ms-auto text-xs text-orange-400 hover:text-orange-300">
            {isAr ? 'عرض' : 'View'} →
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

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { href: `/${locale}/admin/restaurants`, icon: Store, en: 'Manage Restaurants', ar: 'إدارة العربات' },
          { href: `/${locale}/admin/subscriptions`, icon: CreditCard, en: 'Manage Subscriptions', ar: 'إدارة الاشتراكات' },
          { href: `/${locale}/admin/payments`, icon: TrendingUp, en: 'Record Payment', ar: 'تسجيل دفعة' },
        ].map(a => (
          <Link key={a.href} href={a.href}
            className="card-hover flex items-center gap-3 py-3">
            <div className="w-9 h-9 rounded-lg bg-brand-500/10 border border-brand-500/20
                            flex items-center justify-center flex-shrink-0">
              <a.icon size={18} className="text-brand-400" />
            </div>
            <span className="text-sm font-medium text-[#fafaf9]">
              {isAr ? a.ar : a.en}
            </span>
          </Link>
        ))}
      </div>

      {/* Recent restaurants */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title mb-0">{isAr ? 'أحدث العربات' : 'Recent Restaurants'}</h2>
          <Link href={`/${locale}/admin/restaurants`} className="text-xs text-brand-400 hover:text-brand-300">
            {isAr ? 'عرض الكل' : 'View all'} →
          </Link>
        </div>
        <div className="space-y-2">
          {stats.recentRestaurants.map((r: {
            id: string; name_en: string; name_ar: string;
            is_open: boolean; subscription_status: string; created_at: string;
          }) => (
            <Link key={r.id} href={`/${locale}/admin/restaurants/${r.id}`}>
              <div className="card-hover flex items-center gap-3 py-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#2a2825] flex items-center justify-center
                                flex-shrink-0 text-lg">
                  🏪
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#fafaf9] truncate">
                    {isAr ? r.name_ar : r.name_en}
                  </div>
                  <div className="text-xs text-[#57534e]">
                    {new Date(r.created_at).toLocaleDateString('en-BH')}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`badge ${STATUS_BADGE[r.subscription_status] ?? 'badge-pending'}`}>
                    {STATUS_LABEL[r.subscription_status] ?? r.subscription_status}
                  </span>
                  <span className={`text-xs ${r.is_open ? 'text-green-400' : 'text-[#57534e]'}`}>
                    {r.is_open ? '● Open' : '● Closed'}
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
