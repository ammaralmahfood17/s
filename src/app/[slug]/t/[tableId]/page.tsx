'use client';

import { useState, useEffect, useRef } from 'react';
import NextImage from 'next/image';
import { Star } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useCartStore } from '@/hooks/useCart';
import {
  formatBHD, getPublicImageUrl
} from '@/lib/utils';
import { cn } from '@/lib/utils';
import type {
  Restaurant, Category, Item, Variation, Addon
} from '@/types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { OpeningHoursDisplay, parseHours, isOpenNow } from '@/components/shared/OpeningHours';
import { PausedBanner } from '@/components/dashboard/PauseOrdering';
import { ReviewsList, ReviewForm } from '@/components/shared/Reviews';
import ItemCard from '@/components/ordering/ItemCard';
import ItemModal from '@/components/ordering/ItemModal';
import CartDrawer from '@/components/ordering/CartDrawer';

// ── Order Tracker ──────────────────────────────────────────
function OrderTracker({
  orderId,
  orderNumber,
  restaurantId,
  prepTimeMinutes,
  onDismiss,
}: {
  orderId: string;
  orderNumber: string;
  restaurantId: string;
  prepTimeMinutes?: number;
  onDismiss: () => void;
}) {
  const [status, setStatus] = useState('pending');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Initial fetch
    supabase.from('orders').select('status').eq('id', orderId).single()
      .then(({ data }) => { if (data) setStatus(data.status); });

    // Realtime
    const ch = supabase.channel(`order-track-${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'orders',
        filter: `id=eq.${orderId}`
      }, (p) => setStatus(p.new.status))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [orderId, supabase]);

  const steps = ['pending', 'preparing', 'completed'];
  const currentIdx = steps.indexOf(status);

  const STEP_LABELS: Record<string, { icon: string; ar: string }> = {
    pending:   { icon: '📋', ar: 'تم استلام الطلب' },
    preparing: { icon: '🍳', ar: 'يتم التحضير' },
    completed: { icon: '🎉', ar: 'مكتمل' },
    cancelled: { icon: '❌', ar: 'ملغي' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 safe-x">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm
                      max-h-[92dvh] overflow-y-auto overscroll-contain animate-slide-up shadow-2xl
                      relative">
        {/* Close button — always visible */}
        <button
          onClick={onDismiss}
          className="absolute top-3 end-3 w-8 h-8 flex items-center justify-center
                     rounded-full bg-muted active:bg-muted-foreground/20 text-muted-foreground
                     hover:text-foreground transition-colors touch-manipulation"
          aria-label={'إغلاق'}
        >
          ✕
        </button>

        <div className="text-center mb-6">
          <div className="text-4xl mb-2">
            {status === 'preparing' ? '🍳' : status === 'completed' ? '🎉' : '📋'}
          </div>
          <h2 className="text-xl font-bold text-foreground">
            تم تقديم طلبك!
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            رقم طلبك
          </p>
          <div className="text-3xl font-black text-primary mt-1">{orderNumber}</div>

          {/* Prep time estimate — only while order is still active */}
          {prepTimeMinutes && !['completed', 'cancelled'].includes(status) && (
            <div className="inline-flex items-center gap-1.5 mt-2 text-xs text-muted-foreground
                            bg-background border border-border rounded-full px-3 py-1">
              ⏱ {`الوقت المتوقع: ~${prepTimeMinutes} دقيقة`}
            </div>
          )}
        </div>

        {/* Progress steps */}
        <div className="space-y-3 mb-6">
          {steps.map((step, i) => {
            const isDone = i < currentIdx;
            const isCurrent = i === currentIdx;
            const info = STEP_LABELS[step];
            return (
              <div key={step} className="flex items-center gap-3">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0',
                  isDone    ? 'bg-primary text-primary-foreground' :
                  isCurrent ? 'bg-muted border-2 border-primary animate-pulse' :
                              'bg-card border border-border'
                )}>
                  {isDone ? '✓' : info.icon}
                </div>
                <div className="flex-1">
                  <div className={cn(
                    'text-sm font-medium',
                    isCurrent ? 'text-primary' :
                    isDone    ? 'text-muted-foreground' : 'text-muted-foreground/80'
                  )}>
                    {info.ar}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cashier note */}
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 mb-4">
          <p className="text-xs text-primary text-center leading-relaxed">
            💳 ادفع عند الكاشير عند استلام طلبك
          </p>
        </div>

        {/* Review form on completion */}
        {status === 'completed' && !reviewSubmitted && (
          <div className="mb-4 pt-4 border-t border-border">
            <ReviewForm
              restaurantId={restaurantId}
              orderId={orderId}
              onSubmitted={() => setReviewSubmitted(true)}
            />
          </div>
        )}

        {status === 'completed' && (
          <button onClick={onDismiss} className="btn-primary w-full">
            شكراً لك! 🎉
          </button>
        )}

        {/* Back to menu button — shown while order is active */}
        {!['completed', 'cancelled'].includes(status) && (
          <button
            onClick={onDismiss}
            className="w-full min-h-[44px] py-2.5 rounded-xl text-sm font-medium
                       transition-all active:scale-[0.98] touch-manipulation
                       bg-muted text-foreground active:bg-muted-foreground/20"
          >
            📋 رجوع للمنيو
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Customer Menu Page ────────────────────────────────
export default function CustomerMenuPage({
  params: { slug, tableId },
}: {
  params: { slug: string; tableId: string };
}) {
  const router = useRouter();
  const supabase = createClient();
  const { addItem, initCart } = useCartStore();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [variations, setVariations] = useState<Record<string, Variation[]>>({});
  const [addons, setAddons] = useState<Record<string, Addon[]>>({});
  const [table, setTable] = useState<{ id: string; name_en: string; name_ar: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [placedOrder, setPlacedOrder] = useState<{ id: string; number: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const catRefs = useRef<Record<string, HTMLDivElement>>({});

  useEffect(() => {
    const load = async () => {
      try {
        // Resolve table by qr_token
        const { data: tableData } = await supabase
          .from('tables')
          .select('id, name_en, name_ar, restaurant_id, is_active')
          .eq('qr_token', tableId)
          .single();

        if (!tableData || !tableData.is_active) {
          setLoading(false);
          return;
        }
        setTable(tableData);

        const restaurantId = tableData.restaurant_id;

        const [{ data: rest }, { data: cats }, { data: its }, { data: vars }, { data: adds }] =
          await Promise.all([
            supabase.from('restaurants').select('*').eq('id', restaurantId).single(),
            supabase.from('categories').select('*').eq('restaurant_id', restaurantId)
              .eq('is_visible', true).order('sort_order'),
            supabase.from('items').select('*').eq('restaurant_id', restaurantId)
              .eq('is_available', true).order('sort_order'),
            supabase.from('variations').select('*').eq('restaurant_id', restaurantId)
              .order('sort_order'),
            supabase.from('addons').select('*').eq('restaurant_id', restaurantId)
              .order('sort_order'),
          ]);

        // Redirect if slug doesn't match (prevents wrong slug in URL)
        if (rest && rest.slug !== slug) {
          router.replace(`/${rest.slug}/t/${tableId}`);
          return;
        }

        setRestaurant(rest);
        setCategories(cats ?? []);
        setItems(its ?? []);

        const varMap: Record<string, Variation[]> = {};
        (vars ?? []).forEach((v: Variation) => {
          if (!varMap[v.item_id]) varMap[v.item_id] = [];
          varMap[v.item_id].push(v);
        });
        setVariations(varMap);

        const addonMap: Record<string, Addon[]> = {};
        (adds ?? []).forEach((a: Addon) => {
          if (!addonMap[a.item_id]) addonMap[a.item_id] = [];
          addonMap[a.item_id].push(a);
        });
        setAddons(addonMap);

        if (cats?.length) setSelectedCategory(cats[0].id);
        initCart(restaurantId, tableData.id);
      } catch (err) {

      } finally {
        setLoading(false);
      }
    };

    load();
  }, [slug, tableId, supabase, initCart, router]);

  const scrollToCategory = (catId: string) => {
    setSelectedCategory(catId);
    catRefs.current[catId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const filteredItems = searchQuery
    ? items.filter(i =>
        i.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.name_ar.includes(searchQuery)
      )
    : items;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">جار التحميل...</div>
      </div>
    );
  }

  if (!restaurant || !table) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-3">😕</div>
          <h1 className="text-xl font-bold text-foreground">
            رمز QR غير صالح
          </h1>
          <p className="text-muted-foreground mt-2">
            يرجى مسح رمز QR مرة أخرى
          </p>
        </div>
      </div>
    );
  }

  // Compute real "open now" status from opening_hours, combined with manual is_open toggle
  const weekHours = restaurant ? parseHours(restaurant.opening_hours) : null;
  const reallyOpen = restaurant ? restaurant.is_open && (weekHours ? isOpenNow(weekHours) : true) : false;
  const isPaused = restaurant?.ordering_paused ?? false;

  if (!restaurant.is_open) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-5xl mb-3">🔒</div>
          <h1 className="text-xl font-bold text-foreground">
            {restaurant.name_ar}
          </h1>
          <p className="text-muted-foreground mt-2">
            المطعم مغلق حالياً
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            يرجى المحاولة لاحقاً
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={{ paddingBottom: 'calc(7rem + env(safe-area-inset-bottom, 0px))' }}>
      {/* Restaurant header */}
      <div className="relative">
        {restaurant.cover_url && (
          <div className="h-36 relative overflow-hidden">
            <NextImage
              src={getPublicImageUrl(restaurant.cover_url, 'restaurant-assets')}
              alt={restaurant.name_en}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
          </div>
        )}
        <div className={cn('px-4 pb-3', restaurant.cover_url ? '-mt-12 relative z-10' : 'pt-8')}>
          <div className="flex items-end gap-3">
            {restaurant.logo_url && (
              <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-border
                              bg-card flex-shrink-0">
                <NextImage
                  src={getPublicImageUrl(restaurant.logo_url, 'restaurant-assets')}
                  alt="logo"
                  width={56}
                  height={56}
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground">
                {restaurant.name_ar}
              </h1>
              {restaurant.description_ar && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {restaurant.description_ar}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  reallyOpen ? 'bg-green-950 text-green-400' : 'bg-red-950 text-red-400'
                )}>
                  {reallyOpen ? '● مفتوح' : '● مغلق'}
                </span>
                <span className="text-xs text-muted-foreground">
                  📍 {table.name_ar}
                </span>
                {restaurant.prep_time_minutes && (
                  <span className="text-xs text-muted-foreground">
                    ⏱ {`~${restaurant.prep_time_minutes} د`}
                  </span>
                )}
              </div>
              {weekHours && (
                <div className="mt-1.5">
                  <OpeningHoursDisplay hours={weekHours} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Paused ordering banner */}
      {isPaused && (
        <PausedBanner
          reasonEn={restaurant.pause_reason_en}
          reasonAr={restaurant.pause_reason_ar}
        />
      )}

      {/* Search */}
      <div className="px-4 mb-3">
        <input
          className="input text-sm"
          dir="rtl"
          placeholder={'🔍 ابحث في القائمة...'}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Category pills — sticky, 44px touch targets */}
      {!searchQuery && categories.length > 0 && (
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm pt-1 pb-2 mb-2">
          <div className="flex gap-2 px-4 overflow-x-auto scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={cn(
                  'flex-shrink-0 text-sm px-3.5 min-h-[40px] rounded-xl border transition-all',
                  'active:scale-95 touch-manipulation select-none',
                  selectedCategory === cat.id
                    ? 'bg-primary text-primary-foreground border-primary font-semibold'
                    : 'border-border text-muted-foreground active:border-muted-foreground/30'
                )}
              >
                {cat.emoji} {cat.name_ar}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu items */}
      <div className="px-4 space-y-6">
        {searchQuery ? (
          <div className="grid grid-cols-1 gap-3">
            {filteredItems.map(item => (
              <ItemCard
                key={item.id}
                variant="full"
                item={item}
                onClick={() => setSelectedItem(item)}
              />
            ))}
            {filteredItems.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                لا توجد نتائج
              </div>
            )}
          </div>
        ) : (
          categories.map(cat => {
            const catItems = filteredItems.filter(i => i.category_id === cat.id);
            if (catItems.length === 0) return null;
            return (
              <div key={cat.id} ref={el => { if (el) catRefs.current[cat.id] = el; }}>
                <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
                  <span>{cat.emoji}</span>
                  {cat.name_ar}
                </h2>
                <div className="grid grid-cols-1 gap-3">
                  {catItems.map(item => (
                    <ItemCard
                      key={item.id}
                      variant="full"
                      item={item}
                      onClick={() => setSelectedItem(item)}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reviews */}
      {restaurant && (
        <div className="px-4 mt-8">
          <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
            <Star size={14} className="text-yellow-400" />
            تقييمات العملاء
          </h2>
          <ReviewsList restaurantId={restaurant.id} limit={5} />
        </div>
      )}

      {/* Item modal */}
      {selectedItem && (
        <ItemModal
          item={selectedItem}
          variations={variations[selectedItem.id] ?? []}
          addons={addons[selectedItem.id] ?? []}
          onClose={() => setSelectedItem(null)}
          onAdd={(item, variation, selectedAddons, qty, notes) => {
            addItem(
              item,
              variation,
              selectedAddons.map(a => ({ id: a.id, name_en: a.name_en, name_ar: a.name_ar, price: a.price })),
              qty,
              notes
            );
            toast.success(
              `تمت الإضافة: ${item.name_ar}`
            );
          }}
        />
      )}

      {/* Cart drawer — hidden while ordering is paused */}
      {table && restaurant && !isPaused && (
        <CartDrawer
          restaurantId={restaurant.id}
          orderType="table"
          tableId={table.id}
          tableName={table.name_ar}
          onOrderPlaced={(id, num) => setPlacedOrder({ id, number: num })}
        />
      )}

      {/* Order tracker */}
      {placedOrder && restaurant && (
        <OrderTracker
          orderId={placedOrder.id}
          orderNumber={placedOrder.number}
          restaurantId={restaurant.id}
          prepTimeMinutes={restaurant.prep_time_minutes}
          onDismiss={() => setPlacedOrder(null)}
        />
      )}
    </div>
  );
}
