'use client';

import { useState, useEffect, useCallback } from 'react';
import NextImage from 'next/image';
import {
  Plus, Package
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useCartStore } from '@/hooks/useCart';
import {
  formatBHD, getPublicImageUrl
} from '@/lib/utils';
import { cn } from '@/lib/utils';
import type {
  Restaurant, Category, Item, Variation, Addon, OrderType
} from '@/types';
import { toast } from 'sonner';
import ItemCard from '@/components/ordering/ItemCard';
import ItemModal from '@/components/ordering/ItemModal';
import CartDrawer from '@/components/ordering/CartDrawer';
import OrderSuccessScreen from '@/components/ordering/OrderSuccessScreen';

export default function ExternalOrderPage({
  params: { slug },
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const orderType: OrderType = 'external';

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [variationsMap, setVariationsMap] = useState<Record<string, Variation[]>>({});
  const [addonsMap, setAddonsMap] = useState<Record<string, Addon[]>>({});
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderPlaced, setOrderPlaced] = useState<{ orderId: string; orderNumber: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
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
        useCartStore.getState().initCart(rest.id, '');

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
  }, [slug, supabase]);

  const addItemToCart = useCallback((item: Item, variation: Variation | null, addons: Addon[], qty: number, notes: string) => {
    if (!restaurant) { toast.error('المطعم لم يتم تحميله بعد. انتظر قليلاً.'); return; }
    useCartStore.getState().initCart(restaurant.id, '');
    useCartStore.getState().addItem(item, variation, addons, qty, notes);
  }, [restaurant]);

  if (orderPlaced) {
    return <OrderSuccessScreen orderNumber={orderPlaced.orderNumber} orderId={orderPlaced.orderId} slug={slug} />;
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
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-3 flex items-center gap-2">
          <Package size={22} className="text-primary flex-shrink-0" />
          <div className="min-w-0">
            <h1 className="font-bold text-foreground truncate">{restaurant.name_ar}</h1>
            <div className="text-xs text-muted-foreground">طلب من الخارج — استلم من المطعم</div>
          </div>
        </div>
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

      {selectedItem && (
        <ItemModal
          item={selectedItem}
          variations={variationsMap[selectedItem.id] ?? []}
          addons={addonsMap[selectedItem.id] ?? []}
          onClose={() => setSelectedItem(null)}
          onAdd={addItemToCart}
        />
      )}

      {restaurant && (
        <CartDrawer
          restaurantId={restaurant.id}
          orderType="external"
          onOrderPlaced={(orderId, orderNumber) => setOrderPlaced({ orderId, orderNumber })}
        />
      )}
    </div>
  );
}
