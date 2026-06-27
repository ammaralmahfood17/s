'use client';

import { useState, useEffect, useRef } from 'react';
import { ChefHat, Clock, CheckCircle, Zap, Volume2, VolumeX } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { formatRelativeTime, getNextStatus, getNextStatusLabel } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { OrderWithItems, OrderStatus } from '@/types';
import { toast } from 'sonner';
import {
  playOrderAlertSequence, playChime, ensureNotificationPermission,
  notify, requestWakeLock, releaseWakeLock,
} from '@/lib/notify';

const KITCHEN_STATUSES = ['pending', 'confirmed', 'preparing'];

const CARD_STYLES: Record<string, string> = {
  pending:   'border-[#3a3835] bg-[#0f0e0c]',
  confirmed: 'border-blue-700 bg-[#0f1a2e]',
  preparing: 'border-yellow-700 bg-[#1a1200]',
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
  const nextStatus = getNextStatus(order.status);

  // Live elapsed time
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

  const handleAdvance = async () => {
    if (!nextStatus) return;
    setUpdating(true);
    await onAdvance(order.id, nextStatus);
    setUpdating(false);
  };

  const handleCancel = async () => {
    if (!confirm('تأكيد إلغاء الطلب؟')) return;
    setUpdating(true);
    await onCancel(order.id);
    setUpdating(false);
  };

  return (
    <div className={cn(
      'kitchen-card border-2 flex flex-col gap-3 relative',
      CARD_STYLES[order.status],
      isUrgent && 'border-red-600'
    )}>
      {/* Elapsed warning */}
      {isUrgent && (
        <div className="absolute top-2 end-2 text-xs bg-red-950 text-red-400
                        px-2 py-0.5 rounded-full border border-red-800">
          {elapsedMin}m
        </div>
      )}

      {/* Order header */}
      <div className="flex items-center justify-between gap-2">
        <div className="font-black text-2xl text-[#fafaf9] tracking-tight">
          {order.order_number}
        </div>
        <div className="flex items-center gap-1.5">
          <StatusIcon size={14} className={cn(
            order.status === 'pending' ? 'text-[#57534e]' :
            'text-yellow-400 animate-pulse'
          )} />
          <span className={cn(
            'text-xs font-semibold',
            order.status === 'pending' ? 'text-[#a8a29e]' :
            'text-yellow-400'
          )}>
            {STATUS_LABEL[order.status]}
          </span>
        </div>
      </div>

      {/* Table + time */}
      <div className="flex items-center gap-2 text-xs text-[#57534e]">
        {order.table && (
          <span className="bg-[#1a1916] px-2 py-0.5 rounded-full">
            {order.table.name_ar}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock size={10} />
          {!isUrgent && `${elapsedMin}m`}
          {' '}{formatRelativeTime(order.created_at, 'ar')}
        </span>
      </div>

      {/* Items list */}
      <div className="space-y-2 flex-1">
        {(order.order_items ?? []).map((item) => (
          <div key={item.id} className="flex gap-2">
            <span className="text-brand-400 font-bold text-sm w-6 flex-shrink-0">
              {item.quantity}×
            </span>
            <div>
              <div className="text-[#fafaf9] text-sm font-medium leading-tight">
                {item.item_name_ar}
              </div>
              {item.variation_name_en && (
                <div className="text-xs text-[#57534e]">
                  {item.variation_name_ar}
                </div>
              )}
              {item.addons?.length > 0 && (
                <div className="text-xs text-[#57534e]">
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

      {/* Special notes */}
      {order.notes && (
        <div className="text-xs text-yellow-400 bg-yellow-950/30 border border-yellow-900/50
                        rounded-lg px-2 py-1.5">
          📝 {order.notes}
        </div>
      )}

      {/* CTA — accept for pending, start prep for confirmed, deliver for preparing */}
      {order.status === 'pending' ? (
        <div className="flex gap-2">
          <button onClick={handleAdvance} disabled={updating}
            className="flex-1 min-h-[44px] py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] touch-manipulation bg-green-700 hover:bg-green-600 text-white">
            {updating ? '...' : '✓ قبول الطلب'}
          </button>
          <button onClick={handleCancel} disabled={updating}
            className="flex-1 min-h-[44px] py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] touch-manipulation bg-red-900/60 hover:bg-red-800 text-red-300 border border-red-800/50">
            {updating ? '...' : '✕ إلغاء'}
          </button>
        </div>
      ) : order.status === 'confirmed' ? (
        <button onClick={handleAdvance} disabled={updating}
          className="w-full min-h-[44px] py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] touch-manipulation bg-blue-700 hover:bg-blue-600 text-white">
          {updating ? '...' : '🍳 بدء التحضير'}
        </button>
      ) : order.status === 'preparing' && nextStatus ? (
        <button onClick={handleAdvance} disabled={updating}
          className="w-full min-h-[44px] py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] touch-manipulation bg-teal-600 hover:bg-teal-500 text-white">
          {updating ? '...' : '🔔 الطلب جاهز'}
        </button>
      ) : null}
    </div>
  );
}

export default function KitchenPage() {
  const supabase = createClient();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(true);
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

  // ── WakeLock: keep screen on while kitchen page is open ────
  useEffect(() => {
    requestWakeLock();
    const onVis = () => { if (document.visibilityState === 'visible') requestWakeLock(); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      releaseWakeLock();
    };
  }, []);

  // ── Request notification permission on mount ──────────────
  useEffect(() => { ensureNotificationPermission(); }, []);

  const { orders, loading, updateStatus } = useRealtimeOrders(restaurantId ?? '');

  // ── Detect new orders & play alert ──────────────────────────
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
        // Play sound sequence: 3 rising pings + vibrate
        if (soundOn) {
          playOrderAlertSequence();
        }
        // Show browser notification
        const where = o.car_number
          ? `🚗 طلب سيارة #${o.car_number}${o.customer_name ? ` — ${o.customer_name}` : ''}`
          : o.table
            ? `🪑 طاولة ${o.table.name_ar}`
            : '📋 طلب جديد';
        notify(`طلب جديد #${o.order_number}`, where, `order-${o.id}`);
      }
    }
  }, [orders, soundOn]);

  const handleAdvance = async (id: string, status: OrderStatus) => {
    const ok = await updateStatus(id, status);
    if (!ok) toast.error('حدث خطأ');
  };

  const handleCancel = async (id: string) => {
    const ok = await updateStatus(id, 'cancelled');
    if (ok) toast.success('تم إلغاء الطلب');
    else toast.error('حدث خطأ');
  };

  // Group by status column
  const columns = KITCHEN_STATUSES.map((status) => ({
    status,
    orders: orders.filter((o) => o.status === status),
  }));

  const totalActive = orders.length;

  return (
    <div className="min-h-screen bg-[#0a0a08] safe-top safe-bottom">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2 sticky top-0 z-10
                      bg-[#0a0a08]/95 backdrop-blur-sm">
        <div className="flex items-center gap-2 min-w-0">
          <ChefHat size={22} className="text-brand-400 flex-shrink-0" />
          <h1 className="text-lg sm:text-xl font-bold text-[#fafaf9] truncate">
            شاشة المطبخ
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Sound toggle */}
          <button
            onClick={() => {
              setSoundOn(!soundOn);
              if (!soundOn) playChime();
            }}
            className="w-11 h-11 flex items-center justify-center rounded-xl
                       text-[#57534e] hover:text-[#fafaf9] hover:bg-[#1a1916]
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
            <div className="bg-brand-500 text-[#0f0e0c] font-bold px-2.5 py-1 rounded-full text-xs sm:text-sm">
              {totalActive}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-[#57534e]">جار التحميل...</div>
        </div>
      ) : totalActive === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4 px-4">
          <div className="w-20 h-20 rounded-full bg-[#1a1916] border border-[#2a2825]
                          flex items-center justify-center">
            <ChefHat size={40} className="text-[#3a3835]" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-[#a8a29e]">
              لا يوجد طلبات نشطة
            </h2>
            <p className="text-sm text-[#57534e] mt-1">
              لا توجد طلبات نشطة الآن
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile: horizontal swipe between status columns, one full-width at a time */}
          <div className="sm:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 pb-4
                          scrollbar-hide">
            {columns.map((col) => {
              const colLabel: Record<string, string> = {
                pending:   '⏳ جديد',
                preparing: '🔥 يُجهز',
              };
              return (
                <div key={col.status} className="snap-center flex-shrink-0 w-[88vw] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[#a8a29e]">
                      {colLabel[col.status]}
                    </h3>
                    {col.orders.length > 0 && (
                      <span className="text-xs bg-[#1a1916] text-[#a8a29e] px-2 py-0.5 rounded-full">
                        {col.orders.length}
                      </span>
                    )}
                  </div>
                  {col.orders.length === 0 ? (
                    <div className="border-2 border-dashed border-[#1a1916] rounded-2xl h-20
                                    flex items-center justify-center">
                      <span className="text-xs text-[#3a3835]">فارغ</span>
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

          {/* Tablet/Desktop: standard grid kanban */}
          <div className="hidden sm:grid grid-cols-2 gap-4 px-4 pb-4">
            {columns.map((col) => {
              const colLabel: Record<string, string> = {
                pending:   '⏳ جديد',
                preparing: '🔥 يُجهز',
              };
              return (
                <div key={col.status} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[#a8a29e]">
                      {colLabel[col.status]}
                    </h3>
                    {col.orders.length > 0 && (
                      <span className="text-xs bg-[#1a1916] text-[#a8a29e]
                                       px-2 py-0.5 rounded-full">
                        {col.orders.length}
                      </span>
                    )}
                  </div>

                  {col.orders.length === 0 ? (
                    <div className="border-2 border-dashed border-[#1a1916] rounded-2xl h-20
                                    flex items-center justify-center">
                      <span className="text-xs text-[#3a3835]">
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
      )}
    </div>
  );
}
