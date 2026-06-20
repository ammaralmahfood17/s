'use client';

import { useState, useEffect } from 'react';
import { ChefHat, Clock, CheckCircle, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { formatRelativeTime, getNextStatus, getNextStatusLabel } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { OrderWithItems, OrderStatus } from '@/types';
import toast from 'react-hot-toast';

const KITCHEN_STATUSES = ['pending', 'confirmed', 'preparing', 'ready'];

const CARD_STYLES: Record<string, string> = {
  pending:   'border-[#3a3835] bg-[#0f0e0c]',
  confirmed: 'border-green-800 bg-[#0d1f0d]',
  preparing: 'border-yellow-700 bg-[#1a1200]',
  ready:     'border-teal-600 bg-[#001a1a]',
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  pending:   Clock,
  confirmed: CheckCircle,
  preparing: ChefHat,
  ready:     Zap,
};

const STATUS_LABEL: Record<string, { en: string; ar: string }> = {
  pending:   { en: 'New',       ar: 'جديد' },
  confirmed: { en: 'Confirmed', ar: 'مؤكد' },
  preparing: { en: 'Cooking',   ar: 'يُطهى' },
  ready:     { en: '✓ Ready',   ar: '✓ جاهز' },
};

function KitchenCard({
  order,
  locale,
  onAdvance,
}: {
  order: OrderWithItems;
  locale: string;
  onAdvance: (id: string, status: OrderStatus) => Promise<void>;
}) {
  const isAr = locale === 'ar';
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
  const isUrgent = elapsedMin >= 15 && order.status !== 'ready';

  const StatusIcon = STATUS_ICONS[order.status] ?? Clock;

  const handleAdvance = async () => {
    if (!nextStatus) return;
    setUpdating(true);
    await onAdvance(order.id, nextStatus);
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
            order.status === 'confirmed' ? 'text-green-400' :
            order.status === 'preparing' ? 'text-yellow-400 animate-pulse' :
            'text-teal-400'
          )} />
          <span className={cn(
            'text-xs font-semibold',
            order.status === 'pending' ? 'text-[#a8a29e]' :
            order.status === 'confirmed' ? 'text-green-400' :
            order.status === 'preparing' ? 'text-yellow-400' :
            'text-teal-400'
          )}>
            {STATUS_LABEL[order.status]?.[isAr ? 'ar' : 'en']}
          </span>
        </div>
      </div>

      {/* Table + time */}
      <div className="flex items-center gap-2 text-xs text-[#57534e]">
        {order.table && (
          <span className="bg-[#1a1916] px-2 py-0.5 rounded-full">
            {isAr ? order.table.name_ar : order.table.name_en}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock size={10} />
          {!isUrgent && `${elapsedMin}m`}
          {' '}{formatRelativeTime(order.created_at, locale as 'en' | 'ar')}
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
                {isAr ? item.item_name_ar : item.item_name_en}
              </div>
              {item.variation_name_en && (
                <div className="text-xs text-[#57534e]">
                  {isAr ? item.variation_name_ar : item.variation_name_en}
                </div>
              )}
              {item.addons?.length > 0 && (
                <div className="text-xs text-[#57534e]">
                  + {item.addons.map(a => isAr ? a.name_ar : a.name_en).join(', ')}
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

      {/* CTA */}
      {nextStatus && (
        <button
          onClick={handleAdvance}
          disabled={updating}
          className={cn(
            'w-full min-h-[44px] py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] touch-manipulation',
            order.status === 'pending'   ? 'bg-green-700 hover:bg-green-600 text-white' :
            order.status === 'confirmed' ? 'bg-yellow-600 hover:bg-yellow-500 text-[#0f0e0c]' :
            'bg-teal-600 hover:bg-teal-500 text-white'
          )}
        >
          {updating
            ? '...'
            : getNextStatusLabel(order.status, locale as 'en' | 'ar')
          }
        </button>
      )}
    </div>
  );
}

export default function KitchenPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const isAr = locale === 'ar';
  const supabase = createClient();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

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

  const { orders, loading, updateStatus } = useRealtimeOrders(restaurantId ?? '');

  const handleAdvance = async (id: string, status: OrderStatus) => {
    const ok = await updateStatus(id, status);
    if (!ok) toast.error(isAr ? 'حدث خطأ' : 'Error updating order');
  };

  // Group by status column
  const columns = KITCHEN_STATUSES.map((status) => ({
    status,
    orders: orders.filter((o) =>
      status === 'confirmed' ? ['confirmed'].includes(o.status) : o.status === status
    ),
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
            {isAr ? 'شاشة المطبخ' : 'Kitchen Display'}
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-xs text-green-400 font-medium hidden sm:inline">
              {isAr ? 'مباشر' : 'LIVE'}
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
          <div className="text-[#57534e]">{isAr ? 'جار التحميل...' : 'Loading...'}</div>
        </div>
      ) : totalActive === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4 px-4">
          <div className="w-20 h-20 rounded-full bg-[#1a1916] border border-[#2a2825]
                          flex items-center justify-center">
            <ChefHat size={40} className="text-[#3a3835]" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-[#a8a29e]">
              {isAr ? 'لا يوجد طلبات نشطة' : 'All Clear'}
            </h2>
            <p className="text-sm text-[#57534e] mt-1">
              {isAr ? 'لا توجد طلبات نشطة الآن' : 'No active orders right now'}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile: horizontal swipe between status columns, one full-width at a time */}
          <div className="sm:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 pb-4
                          scrollbar-hide">
            {columns.map((col) => {
              const colLabel: Record<string, { en: string; ar: string }> = {
                pending:   { en: '⏳ New',       ar: '⏳ جديد' },
                confirmed: { en: '✅ Confirmed', ar: '✅ مؤكد' },
                preparing: { en: '🔥 Cooking',  ar: '🔥 يُطهى' },
                ready:     { en: '🟢 Ready',    ar: '🟢 جاهز' },
              };
              return (
                <div key={col.status} className="snap-center flex-shrink-0 w-[88vw] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[#a8a29e]">
                      {colLabel[col.status]?.[isAr ? 'ar' : 'en']}
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
                      <span className="text-xs text-[#3a3835]">{isAr ? 'فارغ' : 'Empty'}</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {col.orders.map((order) => (
                        <KitchenCard key={order.id} order={order} locale={locale} onAdvance={handleAdvance} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Tablet/Desktop: standard grid kanban */}
          <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4 px-4 pb-4">
            {columns.map((col) => {
              const colLabel: Record<string, { en: string; ar: string }> = {
                pending:   { en: '⏳ New',       ar: '⏳ جديد' },
                confirmed: { en: '✅ Confirmed', ar: '✅ مؤكد' },
                preparing: { en: '🔥 Cooking',  ar: '🔥 يُطهى' },
                ready:     { en: '🟢 Ready',    ar: '🟢 جاهز' },
              };
              return (
                <div key={col.status} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[#a8a29e]">
                      {colLabel[col.status]?.[isAr ? 'ar' : 'en']}
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
                        {isAr ? 'فارغ' : 'Empty'}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {col.orders.map((order) => (
                        <KitchenCard
                          key={order.id}
                          order={order}
                          locale={locale}
                          onAdvance={handleAdvance}
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
