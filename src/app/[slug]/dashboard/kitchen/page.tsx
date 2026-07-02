'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChefHat, Clock, CheckCircle, Volume2, VolumeX,
  ShoppingBag, Car, Hand, ExternalLink,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { formatRelativeTime, getNextStatus, formatBHD } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { OrderWithItems, OrderStatus } from '@/types';
import { ORDER_STATUS_CONFIG } from '@/types/constants';
import { toast } from 'sonner';
import {
  playOrderAlertSequence, playChime, ensureNotificationPermission,
  notify, requestWakeLock, releaseWakeLock,
} from '@/lib/notify';

const KITCHEN_STATUSES = ['pending', 'confirmed', 'preparing'];

const STATUS_TABS: { key: string; labelAr: string }[] = [
  { key: 'active',     labelAr: 'النشطة' },
  { key: 'pending',    labelAr: 'في الانتظار' },
  { key: 'confirmed',  labelAr: 'مؤكد' },
  { key: 'preparing',  labelAr: 'يتم التحضير' },
  { key: 'ready',      labelAr: 'جاهز' },
  { key: 'delivered',  labelAr: 'تم التسليم' },
  { key: 'cancelled',  labelAr: 'ملغى' },
];

const CARD_STYLES: Record<string, string> = {
  pending:   'border-muted-foreground/20',
  confirmed: 'border-blue-500/40',
  preparing: 'border-yellow-500/40 bg-yellow-500/5',
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  pending:   Clock,
  confirmed: CheckCircle,
  preparing: ChefHat,
};

const STATUS_LABEL: Record<string, string> = {
  pending:   'جديد',
  confirmed: 'مؤكد',
  preparing: 'يُجهز',
};

const ORDER_TYPE_ICON: Record<string, React.ElementType> = {
  car: Car,
  manual: Hand,
  external: ExternalLink,
};

function KitchenCard({
  order,
  onAdvance,
  onCancel,
}: {
  order: OrderWithItems;
  onAdvance: (id: string, status: OrderStatus) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [updating, setUpdating] = useState(false);
  const isMountedRef = useRef(true);
  const nextStatus = getNextStatus(order.status);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    const start = new Date(order.created_at).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, [order.created_at]);

  const elapsedMin = Math.floor(elapsed / 60);
  const isUrgent = elapsedMin >= 15 && order.status === 'pending';

  const StatusIcon = STATUS_ICONS[order.status];
  const TypeIcon = ORDER_TYPE_ICON[order.order_type];
  const config = ORDER_STATUS_CONFIG[order.status];

  const handleAdvance = async () => {
    if (!nextStatus) return;
    setUpdating(true);
    await onAdvance(order.id, nextStatus);
    if (isMountedRef.current) setUpdating(false);
  };

  const handleCancel = async () => {
    if (!confirm('تأكيد إلغاء الطلب؟')) return;
    setUpdating(true);
    await onCancel(order.id);
    if (isMountedRef.current) setUpdating(false);
  };

  return (
    <div className={cn(
      'kitchen-card border-2 flex flex-col gap-3 relative',
      CARD_STYLES[order.status],
      isUrgent && 'border-red-600',
      order.status === 'cancelled' && 'opacity-60 border-red-900/30',
    )}>
      {isUrgent && (
        <div className="absolute top-2 end-2 text-xs bg-red-950 text-red-400
                        px-2 py-0.5 rounded-full border border-red-800">
          {elapsedMin}m
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="font-black text-2xl text-foreground tracking-tight">
          {order.order_number}
        </div>
        <div className="flex items-center gap-1.5">
          <StatusIcon size={14} className={cn(
            order.status === 'pending' ? 'text-muted-foreground' :
            'text-yellow-400 animate-pulse'
          )} />
          <span className={cn(
            'text-xs font-semibold',
            order.status === 'pending' ? 'text-muted-foreground' :
            'text-yellow-400'
          )}>
            {STATUS_LABEL[order.status]}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
        {order.table && (
          <span className="bg-card px-2 py-0.5 rounded-full">
            {order.table.name_ar}
          </span>
        )}
        {order.car_number && (
          <span className="bg-card px-2 py-0.5 rounded-full text-brand-400">
            🚗 {order.car_number}
          </span>
        )}
        {order.order_type !== 'table' && TypeIcon && (
          <TypeIcon size={12} className="text-muted-foreground" />
        )}
        {order.customer_name && (
          <span className="text-xs text-muted-foreground">
            {order.customer_name}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock size={10} />
          {!isUrgent && `${elapsedMin}m`}
          {' '}{formatRelativeTime(order.created_at, 'ar')}
        </span>
      </div>

      <div className="space-y-2 flex-1">
        {(order.order_items ?? []).map((item) => (
          <div key={item.id} className="flex gap-2">
            <span className="text-primary font-bold text-sm w-6 flex-shrink-0">
              {item.quantity}×
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-foreground text-sm font-medium leading-tight">
                {item.item_name_ar}
              </div>
              {item.variation_name_en && (
                <div className="text-xs text-muted-foreground">
                  {item.variation_name_ar}
                </div>
              )}
              {item.addons?.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  + {item.addons.map(a => a.name_ar).join(', ')}
                </div>
              )}
              {item.notes && (
                <div className="text-xs text-yellow-500 mt-0.5">⚠ {item.notes}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {order.notes && (
        <div className="text-xs text-yellow-400 bg-yellow-950/30 border border-yellow-900/50
                        rounded-lg px-2 py-1.5">
          📝 {order.notes}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="font-bold text-foreground flex-shrink-0 text-sm">
          {formatBHD(order.total, 'ar')}
        </div>
        <div className="flex gap-2">
          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <button onClick={handleCancel} disabled={updating}
              className="min-h-[40px] px-3 rounded-xl text-sm font-medium
                         bg-red-900/60 hover:bg-red-800 text-red-300
                         border border-red-800/50 transition-all
                         touch-manipulation active:scale-[0.98]">
              {updating ? '...' : '✕ إلغاء'}
            </button>
          )}
          {order.status === 'pending' ? (
            <button onClick={handleAdvance} disabled={updating}
              className="min-h-[40px] px-4 rounded-xl text-sm font-bold
                         bg-green-700 hover:bg-green-600 text-white
                         transition-all active:scale-[0.98] touch-manipulation">
              {updating ? '...' : '✓ قبول الطلب'}
            </button>
          ) : order.status === 'confirmed' ? (
            <button onClick={handleAdvance} disabled={updating}
              className="min-h-[40px] px-4 rounded-xl text-sm font-bold
                         bg-blue-700 hover:bg-blue-600 text-white
                         transition-all active:scale-[0.98] touch-manipulation">
              {updating ? '...' : '🍳 بدء التحضير'}
            </button>
          ) : order.status === 'preparing' && nextStatus ? (
            <button onClick={handleAdvance} disabled={updating}
              className="min-h-[40px] px-4 rounded-xl text-sm font-bold
                         bg-teal-600 hover:bg-teal-500 text-white
                         transition-all active:scale-[0.98] touch-manipulation">
              {updating ? '...' : '🔔 الطلب جاهز'}
            </button>
          ) : order.status === 'ready' && nextStatus ? (
            <button onClick={handleAdvance} disabled={updating}
              className="min-h-[40px] px-4 rounded-xl text-sm font-bold
                         bg-teal-600 hover:bg-teal-500 text-white
                         transition-all active:scale-[0.98] touch-manipulation">
              {updating ? '...' : '✅ تم التسليم'}
            </button>
          ) : null}
          {order.status === 'delivered' && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle size={12} /> مكتمل
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function KitchenPage() {
  const supabase = createClient();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [historyOrders, setHistoryOrders] = useState<OrderWithItems[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const seenIds = useRef<Set<string>>(new Set());
  const initLoaded = useRef(false);

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

  useEffect(() => {
    requestWakeLock();
    const onVis = () => { if (document.visibilityState === 'visible') requestWakeLock(); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      releaseWakeLock();
    };
  }, []);

  useEffect(() => { ensureNotificationPermission(); }, []);

  const { orders, loading, updateStatus } = useRealtimeOrders(restaurantId ?? '');

  useEffect(() => {
    if (!orders) return;
    if (!initLoaded.current) {
      for (const o of orders) seenIds.current.add(o.id);
      initLoaded.current = true;
      return;
    }
    for (const o of orders) {
      if (!seenIds.current.has(o.id)) {
        seenIds.current.add(o.id);
        if (soundOn) playOrderAlertSequence();
        const where = o.car_number
          ? `🚗 طلب سيارة #${o.car_number}${o.customer_name ? ` — ${o.customer_name}` : ''}`
          : o.table
            ? `🪑 طاولة ${o.table.name_ar}`
            : '📋 طلب جديد';
        notify(`طلب جديد #${o.order_number}`, where, `order-${o.id}`);
      }
    }
  }, [orders, soundOn]);

  const loadHistory = useCallback(async () => {
    if (!restaurantId) return;
    setLoadingHistory(true);
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('orders')
      .select('*, table:tables(*), order_items(*)')
      .eq('restaurant_id', restaurantId)
      .in('status', ['delivered', 'cancelled'])
      .gte('created_at', `${today}T00:00:00`)
      .order('created_at', { ascending: false })
      .limit(50);
    setHistoryOrders((data as OrderWithItems[]) ?? []);
    setLoadingHistory(false);
  }, [restaurantId, supabase]);

  useEffect(() => {
    if (['delivered', 'cancelled'].includes(activeTab)) loadHistory();
  }, [activeTab, loadHistory]);

  const handleAdvance = async (id: string, status: OrderStatus) => {
    const ok = await updateStatus(id, status);
    if (ok) {
      const labels: Record<string, string> = {
        confirmed: 'تم تأكيد الطلب',
        preparing: 'بدأ التحضير',
        ready: 'الطلب جاهز',
        delivered: 'تم تسليم الطلب',
        cancelled: 'تم إلغاء الطلب',
      };
      toast.success(labels[status] ?? 'تم التحديث');
    } else {
      toast.error('حدث خطأ');
    }
  };

  const handleCancel = async (id: string) => {
    const ok = await updateStatus(id, 'cancelled');
    if (ok) toast.success('تم إلغاء الطلب');
    else toast.error('حدث خطأ');
  };

  const displayOrders = (() => {
    if (activeTab === 'active') return orders;
    if (['delivered', 'cancelled'].includes(activeTab)) return historyOrders;
    return orders.filter(o => o.status === activeTab);
  })();

  const columns = KITCHEN_STATUSES.map((status) => ({
    status,
    orders: orders.filter((o) => o.status === status),
  }));

  const totalActive = orders.length;
  const isLoading = loading || (['delivered', 'cancelled'].includes(activeTab) && loadingHistory);

  return (
    <div className="kitchen-theme min-h-screen bg-sidebar safe-top safe-bottom">
      <div className="flex items-center justify-between p-4 pb-2 sticky top-0 z-10
                      bg-sidebar/95 backdrop-blur-sm">
        <div className="flex items-center gap-2 min-w-0">
          <ChefHat size={22} className="text-primary flex-shrink-0" />
          <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">
            {activeTab === 'active' ? 'شاشة المطبخ' : 'الطلبات'}
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => {
              setSoundOn(!soundOn);
              if (!soundOn) playChime();
            }}
            className="w-11 h-11 flex items-center justify-center rounded-xl
                       text-muted-foreground hover:text-foreground hover:bg-card
                       transition-all touch-manipulation"
            title={soundOn ? 'كتم الصوت' : 'تشغيل الصوت'}
          >
            {soundOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-xs text-green-400 font-medium hidden sm:inline">
              مباشر
            </span>
          </div>
          {totalActive > 0 && (
            <div className="bg-primary text-primary-foreground font-bold px-2.5 py-1 rounded-full text-xs sm:text-sm">
              {totalActive}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto px-4 pb-2 scrollbar-hide">
        {STATUS_TABS.map(tab => {
          const count = tab.key === 'active'
            ? totalActive
            : ['delivered', 'cancelled'].includes(tab.key)
            ? undefined
            : orders.filter(o => o.status === tab.key).length;

          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={cn('flex items-center gap-1.5 px-3.5 min-h-[40px] rounded-xl text-sm font-medium flex-shrink-0 transition-all touch-manipulation select-none',
                activeTab === tab.key ? 'bg-primary text-background' : 'text-muted-foreground active:bg-card'
              )}>
              {tab.labelAr}
              {count !== undefined && count > 0 && (
                <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-bold',
                  activeTab === tab.key ? 'bg-background/20 text-background' : 'bg-muted text-foreground'
                )}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">جار التحميل...</div>
        </div>
      ) : displayOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4 px-4">
          <div className="w-20 h-20 rounded-full bg-card border border-border
                          flex items-center justify-center">
            <ShoppingBag size={40} className="text-muted-foreground/80" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-muted-foreground">
              {activeTab === 'active' ? 'لا يوجد طلبات نشطة' : 'لا توجد طلبات'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {activeTab === 'active'
                ? 'لا توجد طلبات نشطة الآن'
                : 'لا توجد طلبات في هذا القسم'}
            </p>
          </div>
        </div>
      ) : activeTab === 'active' ? (
        <>
          <div className="sm:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 pb-4
                          scrollbar-hide">
            {columns.map((col) => {
              const colLabelMobile: Record<string, string> = {
                pending:   '⏳ جديد',
                confirmed: '✅ مؤكد',
                preparing: '🔥 يُجهز',
              };
              return (
                <div key={col.status} className="snap-center flex-shrink-0 w-[88vw] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-muted-foreground">
                      {colLabelMobile[col.status]}
                    </h3>
                    {col.orders.length > 0 && (
                      <span className="text-xs bg-card text-muted-foreground px-2 py-0.5 rounded-full">
                        {col.orders.length}
                      </span>
                    )}
                  </div>
                  {col.orders.length === 0 ? (
                    <div className="border-2 border-dashed border-border rounded-2xl h-20
                                    flex items-center justify-center">
                      <span className="text-xs text-muted-foreground/80">فارغ</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {col.orders.map((order) => (
                        <KitchenCard key={order.id} order={order} onAdvance={handleAdvance} onCancel={handleCancel} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="hidden sm:grid grid-cols-2 gap-4 px-4 pb-4">
            {columns.map((col) => {
              const colLabelDesktop: Record<string, string> = {
                pending:   '⏳ جديد',
                confirmed: '✅ مؤكد',
                preparing: '🔥 يُجهز',
              };
              return (
                <div key={col.status} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-muted-foreground">
                      {colLabelDesktop[col.status]}
                    </h3>
                    {col.orders.length > 0 && (
                      <span className="text-xs bg-card text-muted-foreground
                                       px-2 py-0.5 rounded-full">
                        {col.orders.length}
                      </span>
                    )}
                  </div>
                  {col.orders.length === 0 ? (
                    <div className="border-2 border-dashed border-border rounded-2xl h-20
                                    flex items-center justify-center">
                      <span className="text-xs text-muted-foreground/80">
                        فارغ
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {col.orders.map((order) => (
                        <KitchenCard
                          key={order.id}
                          order={order}
                          onAdvance={handleAdvance}
                          onCancel={handleCancel}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {displayOrders.map(order => (
              <KitchenCard key={order.id} order={order} onAdvance={handleAdvance} onCancel={handleCancel} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
