'use client';

import { useState, useCallback, useEffect } from 'react';
import NextImage from 'next/image';
import {
  ShoppingCart, Plus, Minus, X, Star, ChevronUp, Info,
  Car, Hash, Palette
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useCartStore } from '@/hooks/useCart';
import {
  formatBHD, getPublicImageUrl, getOrCreateSessionToken
} from '@/lib/utils';
import { cn } from '@/lib/utils';
import type {
  Restaurant, Category, Item, Variation, Addon,
  PlaceOrderPayload, OrderType
} from '@/types';
import { toast } from 'sonner';
import { isPushSupported, subscribeToPush } from '@/lib/push';

// ── Item Detail Modal (reusable) ────────────────────────────
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

// ── Cart Drawer ──────────────────────────────────────────────
function CartDrawer({
  restaurantId, orderType, carNumber, carColor, onOrderPlaced, tableId, tableName,
}: {
  restaurantId: string;
  orderType: OrderType;
  carNumber: string | null;
  carColor: string | null;
  onOrderPlaced: (orderId: string, orderNumber: string) => void;
  tableId: string;
  tableName: string;
}) {
  const { items, removeItem, updateQuantity, subtotal, clearCart } = useCartStore();
  const [customerName, setCustomerName] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [open, setOpen] = useState(false);
  const supabase = createClient();

  const total = subtotal();
  const count = items.reduce((s, i) => s + i.quantity, 0);

  const placeOrder = async () => {
    if (items.length === 0) return;
    setPlacing(true);
    const sessionToken = getOrCreateSessionToken();

    const payload: PlaceOrderPayload = {
      restaurant_id: restaurantId,
      table_id: tableId,
      order_type: orderType,
      customer_name: customerName || undefined,
      notes: orderNotes || undefined,
      session_token: sessionToken,
      car_number: carNumber || undefined,
      car_color: carColor || undefined,
      items: items.map(ci => ({
        item_id: ci.item.id,
        item_name_en: ci.item.name_en,
        item_name_ar: ci.item.name_ar,
        variation_id: ci.variation?.id,
        variation_name_en: ci.variation?.name_en,
        variation_name_ar: ci.variation?.name_ar,
        quantity: ci.quantity,
        unit_price: ci.unitPrice,
        addons: ci.addons,
        notes: ci.notes || undefined,
        line_total: ci.lineTotal,
      })),
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        restaurant_id: payload.restaurant_id,
        table_id: payload.table_id,
        order_type: payload.order_type,
        order_number: '',
        customer_name: payload.customer_name,
        notes: payload.notes,
        session_token: payload.session_token,
        subtotal: total,
        total,
        payment_method: 'cashier',
        car_number: payload.car_number,
        car_color: payload.car_color,
      })
      .select()
      .single();

    if (orderError || !order) {
      toast.error('حدث خطأ. يرجى المحاولة مرة أخرى.');
      setPlacing(false);
      return;
    }

    const { error: itemsError } = await supabase.from('order_items').insert(
      payload.items.map(oi => ({
        order_id: order.id,
        item_id: oi.item_id,
        item_name_en: oi.item_name_en,
        item_name_ar: oi.item_name_ar,
        variation_id: oi.variation_id,
        variation_name_en: oi.variation_name_en,
        variation_name_ar: oi.variation_name_ar,
        quantity: oi.quantity,
        unit_price: oi.unit_price,
        addons: oi.addons,
        notes: oi.notes,
        line_total: oi.line_total,
        product_name_ar_snapshot: oi.item_name_ar,
        product_name_en_snapshot: oi.item_name_en,
        unit_price_snapshot: oi.unit_price,
      }))
    );

    if (itemsError) {
      toast.error('حدث خطأ');
      setPlacing(false);
      return;
    }

    clearCart();
    setOpen(false);
    onOrderPlaced(order.id, order.order_number);
    setPlacing(false);

    if (isPushSupported()) {
      subscribeToPush(order.id, restaurantId).catch(() => {/* silent */});
    }
  };

  if (count === 0) return null;

  return (
    <>
      <div className="fixed inset-x-4 z-40 max-w-md mx-auto" style={{ bottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}>
        <button onClick={() => setOpen(true)} className="w-full btn-primary py-4 shadow-2xl shadow-brand-500/20 text-base">
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

                {/* Order type indicator */}
                <div className="px-5 py-2 bg-background/50 border-b border-border">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {orderType === 'car' ? (
                      <>
                        <Car size={12} className="text-primary" />
                        <span>طلب سيارة</span>
                        {carNumber && <span className="text-primary">· {carNumber}</span>}
                      </>
                    ) : (
                      <span>📍 {tableName}</span>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
                  {items.map(ci => (
                    <div key={ci.cartId} className="flex gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground">{ci.item.name_ar}</div>
                        {ci.variation && <div className="text-xs text-muted-foreground">{ci.variation.name_ar}</div>}
                        {ci.addons.length > 0 && <div className="text-xs text-muted-foreground">+ {ci.addons.map(a => a.name_ar).join(', ')}</div>}
                        {ci.notes && <div className="text-xs text-yellow-600 italic">{'\\u201C'}{ci.notes}{'\\u201D'}</div>}
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

            <div className="px-5 py-4 border-t border-border flex-shrink-0 safe-bottom">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">الإجمالي</span>
                <span className="font-bold text-lg text-foreground">{formatBHD(total, 'ar')}</span>
              </div>
              <button onClick={placeOrder} disabled={placing} className="btn-primary w-full py-3">
                {placing ? 'جار الإرسال...' : 'تأكيد الطلب ✓'}
              </button>
              <p className="text-xs text-muted-foreground text-center mt-2">الدفع عند الكاشير</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Order Success Screen ─────────────────────────────────────
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
          <span className="text-4xl">✓</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">تم استلام طلبك!</h1>
          <p className="text-muted-foreground">رقم الطلب</p>
          <p className="text-3xl font-black text-primary mt-1">{orderNumber}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">سنقوم بإشعارك عندما يكون طلبك جاهزاً</p>
          <p className="text-xs text-muted-foreground mt-2">يمكنك متابعة حالة طلبك باستخدام رقم الطلب</p>
        </div>
        <a href={`/${slug}`} className="btn-secondary w-full inline-block">
          العودة للقائمة
        </a>
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
        console.error('car page - load error:', err);
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
