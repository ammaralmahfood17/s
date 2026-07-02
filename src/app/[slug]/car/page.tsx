'use client';

import { useState, useCallback, useEffect } from 'react';
import NextImage from 'next/image';
import {
  X, ChevronUp, Plus, Car, Hash, Palette
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useCartStore } from '@/hooks/useCart';
import {
  formatBHD, getPublicImageUrl, getOrCreateSessionToken
} from '@/lib/utils';
import { cn } from '@/lib/utils';
import type {
  Restaurant, Category, Item, Variation, Addon,
  OrderType
} from '@/types';
import { toast } from 'sonner';
import ItemCard from '@/components/ordering/ItemCard';
import ItemModal from '@/components/ordering/ItemModal';
import CartDrawer from '@/components/ordering/CartDrawer';
import OrderSuccessScreen from '@/components/ordering/OrderSuccessScreen';

// ── Car Info Form Modal ──────────────────────────────────────
function CarInfoModal({
  onClose, onSubmit,
}: {
  onClose: () => void;
  onSubmit: (carNumber: string, carColor: string) => void;
}) {
  const [carNumber, setCarNumber] = useState('');
  const [carColor, setCarColor] = useState('');

  const COLORS = [
    { value: 'white', label: 'أبيض', hex: '#f5f5f5' },
    { value: 'black', label: 'أسود', hex: '#1a1a1a' },
    { value: 'silver', label: 'فضي', hex: '#a8a29e' },
    { value: 'red', label: 'أحمر', hex: '#ef4444' },
    { value: 'blue', label: 'أزرق', hex: '#3b82f6' },
    { value: 'green', label: 'أخضر', hex: '#22c55e' },
    { value: 'yellow', label: 'أصفر', hex: '#eab308' },
    { value: 'grey', label: 'رمادي', hex: '#6b7280' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl animate-slide-up overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car size={20} className="text-primary" />
            <h2 className="font-bold text-foreground">معلومات السيارة</h2>
          </div>
          <button onClick={onClose} className="w-11 h-11 flex items-center justify-center text-muted-foreground active:text-foreground touch-manipulation"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Car number */}
          <div>
            <label className="label flex items-center gap-1.5"><Hash size={14} /> رقم السيارة *</label>
            <input className="input" dir="ltr" placeholder="123456" value={carNumber} onChange={e => setCarNumber(e.target.value)} maxLength={8} />
            <p className="text-xs text-muted-foreground mt-1">أدخل رقم لوحة السيارة</p>
          </div>
          {/* Car color */}
          <div>
            <label className="label flex items-center gap-1.5"><Palette size={14} /> لون السيارة *</label>
            <div className="grid grid-cols-4 gap-2">
              {COLORS.map(c => (
                <button key={c.value} onClick={() => setCarColor(c.value)}
                  className={cn('flex flex-col items-center gap-1 p-2 rounded-xl border transition-all min-h-[60px] touch-manipulation',
                    carColor === c.value ? 'border-primary bg-primary/10' : 'border-border bg-background active:border-muted-foreground/40'
                  )}>
                  <div className="w-6 h-6 rounded-full border border-border" style={{ backgroundColor: c.hex }} />
                  <span className="text-[10px] text-muted-foreground">{c.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-5 py-4 border-t border-border safe-bottom">
          <button onClick={() => {
            if (!carNumber.trim()) { toast.error('يرجى إدخال رقم السيارة'); return; }
            if (!carColor) { toast.error('يرجى اختيار لون السيارة'); return; }
            onSubmit(carNumber.trim(), carColor);
          }} className="btn-primary w-full">
            <Car size={16} />
            متابعة الطلب
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Car Order Page ──────────────────────────────────────
export default function CarOrderPage({
  params,
}: {
  params: { slug: string; qrToken: string };
}) {
  const { slug, qrToken } = params;
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [variationsMap, setVariationsMap] = useState<Record<string, Variation[]>>({});
  const [addonsMap, setAddonsMap] = useState<Record<string, Addon[]>>({});
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderPlaced, setOrderPlaced] = useState<{ orderId: string; orderNumber: string } | null>(null);

  // Car info
  const [carInfo, setCarInfo] = useState<{ carNumber: string; carColor: string } | null>(null);
  const [showCarForm, setShowCarForm] = useState(true);

  const supabase = createClient();
  const orderType: OrderType = 'car';

  // Table ID from qr_token (for car orders, this is the Drive Thru table)
  const [tableId, setTableId] = useState<string>('');
  const [tableName, setTableName] = useState<string>('طلب سيارات');

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch restaurant by slug
        const { data: rest } = await supabase
          .from('restaurants')
          .select('*')
          .eq('slug', slug)
          .single();

        if (!rest) {
          setLoading(false);
          return;
        }
        setRestaurant(rest);

        // Find the Drive Thru table by qr_token
        const { data: table } = await supabase
          .from('tables')
          .select('id, name_ar')
          .eq('qr_token', qrToken)
          .single();

        if (table) {
          setTableId(table.id);
          setTableName(table.name_ar);
        }

        const [catsRes, itemsRes, varsRes, addonsRes] = await Promise.all([
          supabase.from('categories').select('*').eq('restaurant_id', rest.id).eq('is_visible', true).eq('is_active', true).order('sort_order'),
          supabase.from('items').select('*').eq('restaurant_id', rest.id).eq('is_available', true).order('sort_order'),
          supabase.from('variations').select('*').eq('restaurant_id', rest.id).order('sort_order'),
          supabase.from('addons').select('*').eq('restaurant_id', rest.id).order('sort_order'),
        ]);

        const cats = catsRes.data ?? [];
        const its = itemsRes.data ?? [];
        const vars = varsRes.data ?? [];
        const adds = addonsRes.data ?? [];

        setCategories(cats);
        setItems(its);
        if (cats.length > 0) setActiveCategory(cats[0].id);

        const vMap: Record<string, Variation[]> = {};
        vars.forEach(v => { if (!vMap[v.item_id]) vMap[v.item_id] = []; vMap[v.item_id].push(v); });
        setVariationsMap(vMap);

        const aMap: Record<string, Addon[]> = {};
        adds.forEach(a => { if (!aMap[a.item_id]) aMap[a.item_id] = []; aMap[a.item_id].push(a); });
        setAddonsMap(aMap);
      } catch (err) {
  
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, qrToken, supabase]);

  const addItemToCart = useCallback((item: Item, variation: Variation | null, addons: Addon[], qty: number, notes: string) => {
    if (!restaurant) {
      toast.error('المطعم لم يتم تحميله بعد. انتظر قليلاً.');
      return;
    }
    useCartStore.getState().initCart(restaurant!.id, tableId);
    useCartStore.getState().addItem(item, variation, addons, qty, notes);
  }, [restaurant, tableId]);

  if (orderPlaced) {
    return <OrderSuccessScreen orderNumber={orderPlaced.orderNumber} orderId={orderPlaced.orderId} slug={slug} />;
  }

  if (showCarForm && !carInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-2">
            <Car size={32} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">طلب من السيارة</h1>
          <p className="text-sm text-muted-foreground mb-4">أدخل معلومات سيارتك للبدء في الطلب</p>
          <CarInfoModal onClose={() => setShowCarForm(false)} onSubmit={(num, color) => setCarInfo({ carNumber: num, carColor: color })} />
          <button onClick={() => setShowCarForm(false)} className="btn-secondary w-full text-sm">
            تخطي والعودة
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">جار التحميل...</div>;
  }

  if (!restaurant) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">المطعم غير موجود</div>;
  }

  const filteredItems = activeCategory ? items.filter(i => i.category_id === activeCategory) : items;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-3 flex items-center gap-2">
          <Car size={22} className="text-primary flex-shrink-0" />
          <div className="min-w-0">
            <h1 className="font-bold text-foreground truncate">{restaurant.name_ar}</h1>
            {carInfo && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>🚗 {carInfo.carNumber}</span>
                <span>·</span>
                <span className="capitalize">{carInfo.carColor}</span>
              </div>
            )}
          </div>
        </div>
        {/* Category tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 px-4 scrollbar-hide">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={cn('flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all touch-manipulation',
                activeCategory === cat.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground bg-card'
              )}>
              {cat.emoji && <span className="ml-1">{cat.emoji}</span>}
              {cat.name_ar}
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className="px-4 py-4 space-y-3">
        {filteredItems.map(item => (
          <ItemCard
            key={item.id}
            item={item}
            variant="compact"
            onClick={() => setSelectedItem(item)}
          />
        ))}
        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">لا توجد عناصر في هذا القسم</div>
        )}
      </div>

      {/* Item modal */}
      {selectedItem && (
        <ItemModal
          item={selectedItem}
          variations={variationsMap[selectedItem.id] ?? []}
          addons={addonsMap[selectedItem.id] ?? []}
          onClose={() => setSelectedItem(null)}
          onAdd={addItemToCart}
        />
      )}

      {/* Cart drawer */}
      <CartDrawer
        restaurantId={restaurant.id}
        orderType={orderType}
        carNumber={carInfo?.carNumber ?? null}
        carColor={carInfo?.carColor ?? null}
        onOrderPlaced={(orderId, orderNumber) => setOrderPlaced({ orderId, orderNumber })}
        tableId={tableId}
        tableName={tableName}
      />
    </div>
  );
}
