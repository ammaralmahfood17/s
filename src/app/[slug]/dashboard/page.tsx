import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  TrendingUp, ShoppingBag, Clock, AlertCircle,
  QrCode, UtensilsCrossed, Grid3x3, ArrowRight, Plus
} from 'lucide-react';
import { formatBHD, formatTime } from '@/lib/utils';
import type { Order } from '@/types';

async function getAnalytics(restaurantId: string) {
  const supabase = createClient();
  const today = new Date().toISOString().split('T')[0];

  const [ordersToday, ordersPending, revenueToday] = await Promise.all([
    supabase
      .from('orders')
      .select('id', { count: 'exact' })
      .eq('restaurant_id', restaurantId)
      .gte('created_at', `${today}T00:00:00`)
      .neq('status', 'cancelled'),
    supabase
      .from('orders')
      .select('id', { count: 'exact' })
      .eq('restaurant_id', restaurantId)
      .in('status', ['pending', 'confirmed', 'preparing', 'ready']),
    supabase
      .from('orders')
      .select('total')
      .eq('restaurant_id', restaurantId)
      .gte('created_at', `${today}T00:00:00`)
      .neq('status', 'cancelled'),
  ]);

  const revenue = (revenueToday.data ?? []).reduce(
    (sum: number, o: { total: number }) => sum + Number(o.total),
    0
  );

  return {
    ordersToday: ordersToday.count ?? 0,
    ordersPending: ordersPending.count ?? 0,
    revenueToday: revenue,
  };
}

async function getRecentOrders(restaurantId: string): Promise<Order[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('orders')
    .select('*, table:tables(*)')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })
    .limit(5);
  return (data as Order[]) ?? [];
}

const STATUS_COLORS: Record<string, string> = {
  pending:   'badge-pending',
  confirmed: 'badge-confirmed',
  preparing: 'badge-preparing',
  ready:     'badge-ready',
  completed: 'badge-completed',
  cancelled: 'badge-cancelled',
};

const STATUS_LABELS: Record<string, string> = {
  pending:   'في الانتظار',
  confirmed: 'تم التأكيد',
  preparing: 'يتم التحضير',
  ready:     'جاهز',
  delivered: 'تم التسليم',
  cancelled: 'ملغى',
};

export default async function DashboardPage({
  params: { slug },
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Super admin without restaurant → redirect to admin panel
  const { data: adminRecord } = await supabase
    .from('super_admins')
    .select('id')
    .eq('user_id', user.id)
    .single();

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  if (adminRecord && !restaurant) {
    redirect('/admin');
  }

  // No restaurant yet — show setup
  if (!restaurant) {
    return (
      <div className="p-6 max-w-lg mx-auto mt-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20
                        flex items-center justify-center mx-auto mb-4">
          <QrCode size={32} className="text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          أنشئ مطعمك
        </h1>
        <p className="text-muted-foreground mb-6">
          أعد تهيئة مطعمك لبدء قبول الطلبات عبر QR
        </p>
        <Link href="/setup" className="btn-primary">
          <Plus size={18} />
          إنشاء المطعم
        </Link>
      </div>
    );
  }

  // Fetch subscription for trial-expiry banner
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, trial_ends_at, current_period_end')
    .eq('restaurant_id', restaurant.id)
    .maybeSingle();

  const trialEnd = subscription?.trial_ends_at ? new Date(subscription.trial_ends_at) : null;
  const now = new Date();
  const daysLeft = trialEnd ? Math.ceil((trialEnd.getTime() - now.getTime()) / 86400000) : null;
  const isTrialing = restaurant.subscription_status === 'trialing';
  const isExpired = restaurant.subscription_status === 'past_due' || restaurant.subscription_status === 'cancelled';

  const [analytics, recentOrders] = await Promise.all([
    getAnalytics(restaurant.id),
    getRecentOrders(restaurant.id),
  ]);

  const stats = [
    {
      icon: TrendingUp,
      label: 'إيرادات اليوم',
      value: formatBHD(analytics.revenueToday, 'ar'),
      color: 'text-primary',
    },
    {
      icon: ShoppingBag,
      label: 'طلبات اليوم',
      value: String(analytics.ordersToday),
      color: 'text-blue-400',
    },
    {
      icon: Clock,
      label: 'طلبات نشطة',
      value: String(analytics.ordersPending),
      color: analytics.ordersPending > 0 ? 'text-yellow-400' : 'text-muted-foreground',
    },
  ];

  const quickLinks = [
    {
      href: `/${slug}/dashboard/kitchen`,
      icon: ShoppingBag,
      label: 'الطلبات',
      desc: 'إدارة الطلبات الواردة',
    },
    {
      href: `/${slug}/dashboard/menu`,
      icon: UtensilsCrossed,
      label: 'القائمة',
      desc: 'إضافة وتعديل العناصر',
    },
    {
      href: `/${slug}/dashboard/tables`,
      icon: Grid3x3,
      label: 'الطاولات',
      desc: 'توليد رموز QR',
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {restaurant.name_ar}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            لوحة التحكم الرئيسية
          </p>
        </div>

        {/* Open/Close toggle */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${
          restaurant.is_open
            ? 'bg-success/15 text-success border-success/40'
            : 'bg-destructive/15 text-destructive border-destructive/40'
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            restaurant.is_open ? 'bg-success animate-pulse' : 'bg-destructive'
          }`} />
          {restaurant.is_open ? 'مفتوح' : 'مغلق'}
        </div>
      </div>

      {/* Trial & subscription alerts */}
      {isExpired && (
        <div className="flex items-center gap-3 bg-destructive/15 border border-destructive/40 rounded-xl px-4 py-3">
          <AlertCircle size={18} className="text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive flex-1">
            اشتراكك منتهٍ. تم إيقاف الطلبات. تواصل مع الإدارة للتجديد.
          </p>
        </div>
      )}

      {isTrialing && daysLeft !== null && daysLeft <= 7 && (
        <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
          daysLeft <= 3
            ? 'bg-destructive/15 border border-destructive/40'
            : 'bg-warning/15 border border-warning/30'
        }`}>
          <AlertCircle size={18} className={`flex-shrink-0 ${
            daysLeft <= 3 ? 'text-destructive' : 'text-warning'
          }`} />
          <p className={`text-sm flex-1 ${
            daysLeft <= 3 ? 'text-destructive' : 'text-warning-foreground'
          }`}>
            {daysLeft <= 1
              ? `آخر يوم في الفترة التجريبية! جدِّد اشتراكك للاستمرار.`
              : `متبقي ${daysLeft} أيام في الفترة التجريبية.`
            }
          </p>
        </div>
      )}

      {isTrialing && daysLeft !== null && daysLeft > 7 && (
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
          <Clock size={18} className="text-primary flex-shrink-0" />
          <p className="text-sm text-muted-foreground flex-1">
            الفترة التجريبية: متبقي {daysLeft} يوم
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center gap-2 mb-1">
              <stat.icon size={16} className={stat.color} />
              <span className="stat-label">{stat.label}</span>
            </div>
            <div className={`stat-value ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Active orders alert */}
      {analytics.ordersPending > 0 && (
        <Link href={`/${slug}/dashboard/kitchen`}>
          <div className="flex items-center gap-3 bg-warning/15 border-warning/30
                          rounded-xl px-4 py-3 hover:border-yellow-700 transition-colors">
            <AlertCircle size={18} className="text-yellow-400 flex-shrink-0" />
            <p className="text-sm text-warning-foreground flex-1">
              لديك {analytics.ordersPending} طلب نشط يحتاج اهتمامك
            </p>
            <ArrowRight size={16} className="text-warning/60 rtl:rotate-180" />
          </div>
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick links */}
        <div>
          <h2 className="section-title">
            وصول سريع
          </h2>
          <div className="space-y-2">
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <div className="card-hover flex items-center gap-3 py-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20
                                  flex items-center justify-center flex-shrink-0">
                    <link.icon size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground text-sm">{link.label}</div>
                    <div className="text-xs text-muted-foreground">{link.desc}</div>
                  </div>
                  <ArrowRight size={16} className="text-muted-foreground rtl:rotate-180" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent orders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title mb-0">
              آخر الطلبات
            </h2>
            <Link href={`/${slug}/dashboard/kitchen`}
              className="text-xs text-primary hover:text-brand-300">
              عرض الكل
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="card text-center py-8">
              <ShoppingBag size={32} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                لا توجد طلبات بعد
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <div key={order.id} className="card flex items-center gap-3 py-3">
                  <div className="font-bold text-primary text-sm w-14 flex-shrink-0">
                    {order.order_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground">
                      {formatTime(order.created_at, 'ar')}
                    </div>
                    <div className="text-sm text-foreground font-medium">
                      {formatBHD(order.total, 'ar')}
                    </div>
                  </div>
                  <span className={`badge ${STATUS_COLORS[order.status]}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}