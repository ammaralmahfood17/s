'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  ShoppingBag, Clock, CheckCircle, ChefHat,
  Bell, Filter, RefreshCw
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { formatBHD, formatRelativeTime, getNextStatus, getNextStatusLabel } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { OrderWithItems, OrderStatus } from '@/types';
import toast from 'react-hot-toast';

const STATUS_TABS: { key: string; labelEn: string; labelAr: string }[] = [
  { key: 'active',    labelEn: 'Active',    labelAr: 'النشطة' },
  { key: 'pending',   labelEn: 'Pending',   labelAr: 'في الانتظار' },
  { key: 'preparing', labelEn: 'Preparing', labelAr: 'يتم التحضير' },
  { key: 'ready',     labelEn: 'Ready',     labelAr: 'جاهز' },
  { key: 'completed', labelEn: 'Completed', labelAr: 'مكتمل' },
];

const STATUS_BADGE: Record<string, string> = {
  pending:   'badge-pending',
  confirmed: 'badge-confirmed',
  preparing: 'badge-preparing',
  ready:     'badge-ready',
  completed: 'badge-completed',
  cancelled: 'badge-cancelled',
};

const STATUS_LABEL: Record<string, { en: string; ar: string }> = {
  pending:   { en: 'Pending',    ar: 'في الانتظار' },
  confirmed: { en: 'Confirmed',  ar: 'تم التأكيد' },
  preparing: { en: 'Preparing',  ar: 'يتم التحضير' },
  ready:     { en: 'Ready',      ar: 'جاهز' },
  completed: { en: 'Completed',  ar: 'مكتمل' },
  cancelled: { en: 'Cancelled',  ar: 'ملغى' },
};

function OrderCard({
  order,
  locale,
  onUpdateStatus,
}: {
  order: OrderWithItems;
  locale: string;
  onUpdateStatus: (id: string, status: OrderStatus) => Promise<void>;
}) {
  const isAr = locale === 'ar';
  const [updating, setUpdating] = useState(false);
  const nextStatus = getNextStatus(order.status);
  const nextLabel = getNextStatusLabel(order.status, locale as 'en' | 'ar');

  const handleAdvance = async () => {
    if (!nextStatus) return;
    setUpdating(true);
    await onUpdateStatus(order.id, nextStatus);
    setUpdating(false);
  };

  const handleCancel = async () => {
    if (!confirm(isAr ? 'تأكيد إلغاء الطلب؟' : 'Cancel this order?')) return;
    setUpdating(true);
    await onUpdateStatus(order.id, 'cancelled');
    setUpdating(false);
  };

  const isNew = Date.now() - new Date(order.created_at).getTime() < 60000;

  return (
    <div className={cn(
      'card space-y-3 relative animate-slide-up',
      isNew && order.status === 'pending' && 'border-brand-500/50'
    )}>
      {/* New order pulse */}
      {isNew && order.status === 'pending' && (
        <span className="absolute top-3 end-3 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
        </span>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-brand-400 text-lg">{order.order_number}</span>
            {order.table && (
              <span className="text-xs text-[#57534e] bg-[#1a1916] px-2 py-0.5 rounded-full">
                {isAr ? order.table.name_ar : order.table.name_en}
              </span>
            )}
          </div>
          {order.customer_name && (
            <div className="text-sm text-[#a8a29e] mt-0.5">{order.customer_name}</div>
          )}
          <div className="text-xs text-[#57534e] mt-0.5">
            {formatRelativeTime(order.created_at, locale as 'en' | 'ar')}
          </div>
        </div>
        <span className={`badge ${STATUS_BADGE[order.status]}`}>
          {STATUS_LABEL[order.status]?.[isAr ? 'ar' : 'en']}
        </span>
      </div>

      {/* Items */}
      <div className="divider pt-1">
        <div className="space-y-1.5 pt-3">
          {(order.order_items ?? []).map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-brand-400 font-medium flex-shrink-0">×{item.quantity}</span>
                <div>
                  <span className="text-[#fafaf9]">
                    {isAr ? item.item_name_ar : item.item_name_en}
                  </span>
                  {item.variation_name_en && (
                    <span className="text-[#57534e] text-xs">
                      {' '}({isAr ? item.variation_name_ar : item.variation_name_en})
                    </span>
                  )}
                  {item.addons?.length > 0 && (
                    <div className="text-xs text-[#57534e]">
                      + {item.addons.map(a => isAr ? a.name_ar : a.name_en).join(', ')}
                    </div>
                  )}
                  {item.notes && (
                    <div className="text-xs text-yellow-600 italic">"{item.notes}"</div>
                  )}
                </div>
              </div>
              <span className="text-[#a8a29e] text-xs flex-shrink-0">
                {formatBHD(item.line_total, locale as 'en' | 'ar')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="text-xs text-yellow-400 bg-yellow-950/40 border border-yellow-900/50
                        rounded-lg px-3 py-2">
          📝 {order.notes}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 gap-2">
        <div className="font-bold text-[#fafaf9] flex-shrink-0">
          {formatBHD(order.total, locale as 'en' | 'ar')}
        </div>
        <div className="flex gap-2">
          {order.status !== 'completed' && order.status !== 'cancelled' && (
            <button
              onClick={handleCancel}
              disabled={updating}
              className="text-xs text-red-400 active:text-red-300 px-3 min-h-[40px] rounded-lg
                         active:bg-red-950/50 transition-colors touch-manipulation"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
          )}
          {nextStatus && nextLabel && (
            <button
              onClick={handleAdvance}
              disabled={updating}
              className="btn-primary text-xs min-h-[40px] py-0 px-4"
            >
              {updating ? '...' : nextLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const isAr = locale === 'ar';
  const supabase = createClient();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('active');
  const [allOrders, setAllOrders] = useState<OrderWithItems[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: r } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .single();
      if (r) setRestaurantId(r.id);
    };
    load();
  }, [supabase]);

  const { orders: activeOrders, loading, updateStatus } = useRealtimeOrders(
    restaurantId ?? ''
  );

  // Load completed orders on demand
  const loadCompleted = async () => {
    if (!restaurantId) return;
    setLoadingAll(true);
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('orders')
      .select('*, table:tables(*), order_items(*)')
      .eq('restaurant_id', restaurantId)
      .in('status', ['completed', 'cancelled'])
      .gte('created_at', `${today}T00:00:00`)
      .order('created_at', { ascending: false })
      .limit(30);
    setAllOrders((data as OrderWithItems[]) ?? []);
    setLoadingAll(false);
  };

  useEffect(() => {
    if (activeTab === 'completed') loadCompleted();
  }, [activeTab, restaurantId]);

  const handleUpdateStatus = async (id: string, status: OrderStatus) => {
    const ok = await updateStatus(id, status);
    if (ok) {
      const labels: Record<string, { en: string; ar: string }> = {
        confirmed: { en: 'Order confirmed', ar: 'تم تأكيد الطلب' },
        preparing: { en: 'Preparing started', ar: 'بدأ التحضير' },
        ready:     { en: 'Order ready!', ar: 'الطلب جاهز!' },
        completed: { en: 'Order completed', ar: 'تم إكمال الطلب' },
        cancelled: { en: 'Order cancelled', ar: 'تم إلغاء الطلب' },
      };
      toast.success(labels[status]?.[isAr ? 'ar' : 'en'] ?? 'Updated');
    } else {
      toast.error(isAr ? 'حدث خطأ' : 'Something went wrong');
    }
  };

  // Filter logic
  const displayOrders = (() => {
    if (activeTab === 'active') return activeOrders;
    if (activeTab === 'completed') return allOrders;
    return activeOrders.filter((o) => {
      if (activeTab === 'pending') return o.status === 'pending';
      if (activeTab === 'preparing') return ['confirmed', 'preparing'].includes(o.status);
      if (activeTab === 'ready') return o.status === 'ready';
      return true;
    });
  })();

  if (!restaurantId || loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-[#57534e]">{isAr ? 'جار التحميل...' : 'Loading...'}</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-[#fafaf9]">
            {isAr ? 'الطلبات' : 'Orders'}
          </h1>
          <p className="text-xs sm:text-sm text-[#57534e]">
            {isAr ? 'تحديث تلقائي في الوقت الفعلي' : 'Auto-updating in real-time'}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-xs text-green-400">{isAr ? 'مباشر' : 'Live'}</span>
        </div>
      </div>

      {/* Tabs — 44px touch targets, horizontal scroll */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
        {STATUS_TABS.map((tab) => {
          const count = tab.key === 'active'
            ? activeOrders.length
            : tab.key === 'completed'
            ? undefined
            : activeOrders.filter(o => {
                if (tab.key === 'pending') return o.status === 'pending';
                if (tab.key === 'preparing') return ['confirmed', 'preparing'].includes(o.status);
                if (tab.key === 'ready') return o.status === 'ready';
                return false;
              }).length;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 min-h-[40px] rounded-xl text-sm font-medium',
                'flex-shrink-0 transition-all touch-manipulation select-none',
                activeTab === tab.key
                  ? 'bg-brand-500 text-[#0f0e0c]'
                  : 'text-[#a8a29e] active:bg-[#1a1916]'
              )}
            >
              {isAr ? tab.labelAr : tab.labelEn}
              {count !== undefined && count > 0 && (
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full font-bold',
                  activeTab === tab.key
                    ? 'bg-[#0f0e0c]/20 text-[#0f0e0c]'
                    : 'bg-[#2a2825] text-[#fafaf9]'
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Orders grid */}
      {displayOrders.length === 0 ? (
        <div className="card text-center py-16">
          <ShoppingBag size={40} className="text-[#3a3835] mx-auto mb-3" />
          <p className="text-[#a8a29e] font-medium">
            {isAr ? 'لا توجد طلبات' : 'No orders here'}
          </p>
          <p className="text-sm text-[#57534e] mt-1">
            {activeTab === 'active'
              ? (isAr ? 'ستظهر الطلبات الجديدة هنا تلقائياً' : 'New orders will appear here automatically')
              : (isAr ? 'لا توجد طلبات في هذا القسم' : 'No orders in this section')
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              locale={locale}
              onUpdateStatus={handleUpdateStatus}
            />
          ))}
        </div>
      )}

      {loadingAll && (
        <div className="text-center py-8 text-[#57534e]">
          {isAr ? 'جار التحميل...' : 'Loading...'}
        </div>
      )}
    </div>
  );
}
