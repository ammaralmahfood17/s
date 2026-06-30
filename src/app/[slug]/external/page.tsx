'use client';

import { useState, useEffect, useCallback } from 'react';
import NextImage from 'next/image';
import {
  ShoppingCart, Plus, Minus, X, Star, ChevronUp, Info, Package
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useCartStore } from '@/hooks/useCart';
import {
  formatBHD, getPublicImageUrl, getOrCreateSessionToken
} from '@/lib/utils';
import { cn } from '@/lib/utils';
import type {
  Restaurant, Category, Item, Variation, Addon, OrderType
} from '@/types';
import { toast } from 'sonner';

function ItemModal({
  item, variations, addons, onClose, onAdd,
}: {
  item: Item;
  variations: Variation[];
  addons: Addon[];
  onClose: () => void;
  onAdd: (item: Item, variation: Variation | null, selectedAddons: Addon[], qty: number, notes: string) => void;
}) {
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(variations[0] ?? null);
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');

  const unitPrice = item.price + (selectedVariation?.price_modifier ?? 0);
  const addonsTotal = selectedAddons.reduce((s, a) => s + a.price, 0);
  const lineTotal = (unitPrice + addonsTotal) * qty;

  const toggleAddon = (addon: Addon) => {
    setSelectedAddons(prev =>
      prev.find(a => a.id === addon.id)
        ? prev.filter(a => a.id !== addon.id)
        : [...prev, addon]
    );
  };

  const TAG_LABELS: Record<string, string> = {
    spicy: '🌶 حار', vegan: '🌱 نباتي صرف', vegetarian: '🥗 نباتي',
    'gluten-free': '🌾 خالٍ من الغلوتين', halal: '✅ حلال',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl max-h-[92dvh] sm:max-h-[90vh] flex flex-col shadow-2xl animate-slide-up overflow-hidden">
        {item.image_url && (
          <div className="relative h-40 sm:h-48 flex-shrink-0">
            <NextImage src={getPublicImageUrl(item.image_url)} alt={item.name_ar} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
          </div>
        )}
        <button onClick={onClose} className="absolute top-3 end-3 w-11 h-11 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white z-10 active:scale-90 transition-transform touch-manipulation">
          <X size={18} />
        </button>
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4 overscroll-contain">
          <div>
            <h2 className="text-xl font-bold text-foreground">{item.name_ar}</h2>
            {item.description_ar && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.description_ar}</p>}
            {item.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {item.tags.map(tag => (
                  <span key={tag} className="text-xs bg-background text-muted-foreground px-2 py-0.5 rounded-full border border-border">
                    {TAG_LABELS[tag] ?? tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          {variations.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">اختر الحجم *</h3>
              <div className="grid grid-cols-2 gap-2">
                {variations.map(v => {
                  const vPrice = item.price + v.price_modifier;
                  const isSelected = selectedVariation?.id === v.id;
                  return (
                    <button key={v.id} onClick={() => setSelectedVariation(v)}
                      className={cn('p-3 rounded-xl border text-start transition-all',
                        isSelected ? 'border-primary bg-primary/10' : 'border-border bg-background hover:border-muted-foreground/40'
                      )}>
                      <div className={cn('text-sm font-medium', isSelected ? 'text-primary' : 'text-foreground')}>{v.name_ar}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{formatBHD(vPrice, 'ar')}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {addons.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">إضافات</h3>
              <div className="space-y-2">
                {addons.map(addon => {
                  const isSelected = selectedAddons.some(a => a.id === addon.id);
                  return (
                    <button key={addon.id} onClick={() => toggleAddon(addon)}
                      className={cn('w-full flex items-center justify-between p-3 rounded-xl border transition-all',
                        isSelected ? 'border-primary bg-primary/10' : 'border-border bg-background hover:border-muted-foreground/40'
                      )}>
                      <div className="flex items-center gap-2">
                        <div className={cn('w-4 h-4 rounded border-2 flex items-center justify-center transition-all',
                          isSelected ? 'border-primary bg-primary' : 'border-border'
                        )}>
                          {isSelected && <span className="text-primary-foreground text-xs font-bold">✓</span>}
                        </div>
                        <span className="text-sm text-foreground">{addon.name_ar}</span>
                      </div>
                      <span className="text-sm text-primary font-medium">
                        {addon.price > 0 ? `+${formatBHD(addon.price, 'ar')}` : 'مجاني'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div>
            <label className="label text-xs">ملاحظات خاصة (اختياري)</label>
            <textarea className="input resize-none h-16 text-sm" dir="rtl" placeholder="حساسية؟ طلبات خاصة..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="px-5 pt-4 border-t border-border bg-card flex-shrink-0 safe-bottom">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-background border border-border rounded-xl p-1 flex-shrink-0">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-11 h-11 flex items-center justify-center text-muted-foreground active:text-foreground active:bg-card rounded-lg transition-colors touch-manipulation"><Minus size={16} /></button>
              <span className="font-bold text-foreground w-6 text-center text-sm">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="w-11 h-11 flex items-center justify-center text-muted-foreground active:text-foreground active:bg-card rounded-lg transition-colors touch-manipulation"><Plus size={16} /></button>
            </div>
            <button onClick={() => {
              if (variations.length > 0 && !selectedVariation) { toast.error('يرجى اختيار الحجم'); return; }
              onAdd(item, selectedVariation, selectedAddons, qty, notes);
              onClose();
            }} className="btn-primary flex-1 min-w-0">
              <ShoppingCart size={16} className="flex-shrink-0" />
              <span className="truncate">{`إضافة — ${formatBHD(lineTotal, 'ar')}`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartDrawer({
  restaurantId, onOrderPlaced,
}: {
  restaurantId: string;
  onOrderPlaced: (orderId: string, orderNumber: string) => void;
}) {
  const { items, removeItem, updateQuantity, subtotal, clearCart } = useCartStore();
  const [customerName, setCustomerName] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [open, setOpen] = useState(false);
  const supabase = createClient();
  const orderType: OrderType = 'external';

  const total = subtotal();
  const count = items.reduce((s, i) => s + i.quantity, 0);

  const placeOrder = async () => {
    if (items.length === 0) return;
    setPlacing(true);

    const payload = {
      restaurant_id: restaurantId,
      order_type: orderType,
      customer_name: customerName || undefined,
      notes: orderNotes || undefined,
      session_token: getOrCreateSessionToken(),
      items: items.map(ci => ({
        item_id: ci.item.id,
        item_name_en: ci.item.name_en,
        item_name_ar: ci.item.name_ar,
        variation_id: ci.variation?.id,
        variation_name_en: ci.variation?.name_en,
        variation_name_ar: ci.variation?.name_ar,
        quantity: ci.quantity,
        addons: ci.addons,
        notes: ci.notes || undefined,
        unit_price: undefined,
        line_total: undefined,
      })),
      idempotency_key: crypto.randomUUID(),
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'حدث خطأ. يرجى المحاولة مرة أخرى.');
        setPlacing(false);
        return;
      }

      clearCart();
      setOpen(false);
      onOrderPlaced(data.order_id, data.order_number);
    } catch {
      toast.error('حدث خطأ. يرجى المحاولة مرة أخرى.');
    }
    setPlacing(false);
  };

  if (count === 0) return null;

  return (
    <>
      <div className="fixed inset-x-4 z-40 max-w-md mx-auto" style={{ bottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}>
        <button onClick={() => setOpen(true)} className="w-full btn-primary py-4 shadow-2xl shadow-primary/20 text-base">
          <div className="flex items-center justify-between w-full gap-2 min-w-0">
            <div className="flex items-center gap-2 flex-shrink-0">
              <ShoppingCart size={20} />
              <span className="bg-background/30 text-sm px-2 py-0.5 rounded-full font-bold">{count}</span>
            </div>
            <span className="truncate">عرض الطلب</span>
            <span className="font-bold flex-shrink-0">{formatBHD(total, 'ar')}</span>
          </div>
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-card w-full max-w-md rounded-t-3xl max-h-[88dvh] flex flex-col shadow-2xl animate-slide-up overscroll-contain">
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0"><div className="w-10 h-1 bg-border rounded-full" /></div>
            <div className="px-5 py-3 flex items-center justify-between border-b border-border flex-shrink-0">
              <h2 className="font-bold text-foreground">طلبك</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><ChevronUp size={20} /></button>
            </div>

            <div className="px-5 py-2 bg-background/50 border-b border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Package size={12} className="text-primary" />
                <span>طلب من الخارج — استلام من المطعم</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
              {items.map(ci => (
                <div key={ci.cartId} className="flex gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{ci.item.name_ar}</div>
                    {ci.variation && <div className="text-xs text-muted-foreground">{ci.variation.name_ar}</div>}
                    {ci.addons.length > 0 && <div className="text-xs text-muted-foreground">+ {ci.addons.map(a => a.name_ar).join(', ')}</div>}
                    {ci.notes && <div className="text-xs text-yellow-600 italic">{'\u201C'}{ci.notes}{'\u201D'}</div>}
                    <div className="text-sm text-primary font-semibold mt-0.5">{formatBHD(ci.lineTotal, 'ar')}</div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <div className="flex items-center bg-background border border-border rounded-lg">
                      <button onClick={() => updateQuantity(ci.cartId, ci.quantity - 1)} className="w-10 h-10 flex items-center justify-center text-muted-foreground active:text-foreground active:bg-card rounded-lg transition-colors touch-manipulation"><Minus size={13} /></button>
                      <span className="text-sm font-bold text-foreground w-5 text-center">{ci.quantity}</span>
                      <button onClick={() => updateQuantity(ci.cartId, ci.quantity + 1)} className="w-10 h-10 flex items-center justify-center text-muted-foreground active:text-foreground active:bg-card rounded-lg transition-colors touch-manipulation"><Plus size={13} /></button>
                    </div>
                    <button onClick={() => removeItem(ci.cartId)} className="w-10 h-10 flex items-center justify-center text-red-400 active:text-red-300 active:bg-red-950/30 rounded-lg transition-colors touch-manipulation"><X size={15} /></button>
                  </div>
                </div>
              ))}
              <div>
                <label className="label text-xs">اسمك (اختياري)</label>
                <input className="input text-sm" dir="rtl" placeholder="حتى نناديك باسمك" value={customerName} onChange={e => setCustomerName(e.target.value)} />
              </div>
              <div>
                <label className="label text-xs">ملاحظات (اختياري)</label>
                <textarea className="input resize-none h-14 text-sm" dir="rtl" placeholder="أي طلبات خاصة للطلب..." value={orderNotes} onChange={e => setOrderNotes(e.target.value)} />
              </div>
            </div>

            <div className="px-5 py-3 bg-primary/10 border-t border-primary/20 mx-5 rounded-xl mb-1 flex items-start gap-2 flex-shrink-0">
              <Info size={16} className="text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-primary leading-relaxed">الدفع عند الكاشير عند استلام طلبك. لا يلزم أي دفع إلكتروني.</p>
            </div>

            <div className="px-5 pt-2 space-y-3 border-t border-border flex-shrink-0 safe-bottom">
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-muted-foreground">الإجمالي</span>
                <span className="text-primary text-lg">{formatBHD(total, 'ar')}</span>
              </div>
              <button onClick={placeOrder} disabled={placing} className="btn-primary w-full py-4 text-base">
                {placing ? 'جار الإرسال...' : 'تأكيد الطلب ✓'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function OrderSuccessScreen({
  orderNumber, orderId, slug,
}: {
  orderNumber: string;
  orderId: string;
  slug: string;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-sm space-y-6">
        <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mx-auto">
          <span className="text-4xl">📦</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">تم استلام طلبك!</h1>
          <p className="text-muted-foreground">رقم الطلب</p>
          <p className="text-3xl font-black text-primary mt-1">{orderNumber}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">سيتم تجهيز طلبك. يمكنك متابعة الحالة على الشاشة.</p>
          <p className="text-xs text-muted-foreground mt-2">الدفع عند الاستلام</p>
        </div>
        <a href={`/${slug}`} className="btn-secondary w-full inline-block">العودة للقائمة</a>
      </div>
    </div>
  );
}

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
          <button key={item.id} onClick={() => setSelectedItem(item)}
            className="w-full card flex items-center gap-3 text-start active:scale-[0.98] transition-transform">
            {item.image_url ? (
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                <NextImage src={getPublicImageUrl(item.image_url)} alt={item.name_ar} width={64} height={64} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-xl bg-card flex items-center justify-center flex-shrink-0 text-2xl">🍽️</div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground text-sm">{item.name_ar}</div>
              {item.description_ar && <div className="text-xs text-muted-foreground truncate mt-0.5">{item.description_ar}</div>}
              <div className="text-sm font-bold text-primary mt-1">{formatBHD(item.price, 'ar')}</div>
            </div>
            <Plus size={20} className="text-primary flex-shrink-0" />
          </button>
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
          onOrderPlaced={(orderId, orderNumber) => setOrderPlaced({ orderId, orderNumber })}
        />
      )}
    </div>
  );
}
