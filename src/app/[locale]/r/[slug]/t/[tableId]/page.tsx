'use client';

import { useState, useEffect, useRef } from 'react';
import NextImage from 'next/image';
import { ShoppingCart, Plus, Minus, X, Star, ChevronUp, Info } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useCartStore } from '@/hooks/useCart';
import {
  formatBHD, getPublicImageUrl, getOrCreateSessionToken
} from '@/lib/utils';
import { cn } from '@/lib/utils';
import type {
  Restaurant, Category, Item, Variation, Addon, PlaceOrderPayload
} from '@/types';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { OpeningHoursDisplay, parseHours, isOpenNow } from '@/components/shared/OpeningHours';
import { PausedBanner } from '@/components/dashboard/PauseOrdering';
import { ReviewsList, ReviewForm } from '@/components/shared/Reviews';
import { isPushSupported, subscribeToPush } from '@/lib/push';

// ── Item Detail Modal ──────────────────────────────────────
function ItemModal({
  item,
  variations,
  addons,
  locale,
  onClose,
  onAdd,
}: {
  item: Item;
  variations: Variation[];
  addons: Addon[];
  locale: string;
  onClose: () => void;
  onAdd: (
    item: Item,
    variation: Variation | null,
    selectedAddons: Addon[],
    qty: number,
    notes: string
  ) => void;
}) {
  const isAr = locale === 'ar';
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(
    variations[0] ?? null
  );
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');

  const unitPrice =
    item.price + (selectedVariation?.price_modifier ?? 0);
  const addonsTotal = selectedAddons.reduce((s, a) => s + a.price, 0);
  const lineTotal = (unitPrice + addonsTotal) * qty;

  const toggleAddon = (addon: Addon) => {
    setSelectedAddons((prev) =>
      prev.find((a) => a.id === addon.id)
        ? prev.filter((a) => a.id !== addon.id)
        : [...prev, addon]
    );
  };

  const TAG_LABELS: Record<string, { en: string; ar: string }> = {
    spicy:        { en: '🌶 Spicy',       ar: '🌶 حار' },
    vegan:        { en: '🌱 Vegan',       ar: '🌱 نباتي صرف' },
    vegetarian:   { en: '🥗 Vegetarian',  ar: '🥗 نباتي' },
    'gluten-free':{ en: '🌾 Gluten-free', ar: '🌾 خالٍ من الغلوتين' },
    halal:        { en: '✅ Halal',       ar: '✅ حلال' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1a1916] w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl
                      max-h-[92dvh] sm:max-h-[90vh] flex flex-col shadow-2xl animate-slide-up overflow-hidden">
        {/* Image */}
        {item.image_url && (
          <div className="relative h-40 sm:h-48 flex-shrink-0">
            <NextImage
              src={getPublicImageUrl(item.image_url)}
              alt={isAr ? item.name_ar : item.name_en}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1916] to-transparent" />
          </div>
        )}

        {/* Close — 44px touch target */}
        <button
          onClick={onClose}
          className="absolute top-3 end-3 w-11 h-11 bg-black/50 backdrop-blur-sm
                     rounded-full flex items-center justify-center text-white z-10
                     active:scale-90 transition-transform touch-manipulation"
        >
          <X size={18} />
        </button>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4 overscroll-contain">
          {/* Item info */}
          <div>
            <h2 className="text-xl font-bold text-[#fafaf9]">
              {isAr ? item.name_ar : item.name_en}
            </h2>
            {(isAr ? item.description_ar : item.description_en) && (
              <p className="text-sm text-[#a8a29e] mt-1 leading-relaxed">
                {isAr ? item.description_ar : item.description_en}
              </p>
            )}
            {item.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {item.tags.map(tag => (
                  <span key={tag} className="text-xs bg-[#0f0e0c] text-[#a8a29e]
                                             px-2 py-0.5 rounded-full border border-[#2a2825]">
                    {TAG_LABELS[tag]?.[isAr ? 'ar' : 'en'] ?? tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Variations */}
          {variations.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[#fafaf9] mb-2">
                {isAr ? 'اختر الحجم' : 'Select Size'} *
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {variations.map((v) => {
                  const vPrice = item.price + v.price_modifier;
                  const isSelected = selectedVariation?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariation(v)}
                      className={cn(
                        'p-3 rounded-xl border text-start transition-all',
                        isSelected
                          ? 'border-brand-500 bg-brand-500/10'
                          : 'border-[#2a2825] bg-[#0f0e0c] hover:border-[#3a3835]'
                      )}
                    >
                      <div className={`text-sm font-medium ${isSelected ? 'text-brand-400' : 'text-[#fafaf9]'}`}>
                        {isAr ? v.name_ar : v.name_en}
                      </div>
                      <div className="text-xs text-[#a8a29e] mt-0.5">
                        {formatBHD(vPrice, locale as 'en' | 'ar')}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Addons */}
          {addons.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[#fafaf9] mb-2">
                {isAr ? 'إضافات' : 'Add-ons'}
              </h3>
              <div className="space-y-2">
                {addons.map((addon) => {
                  const isSelected = selectedAddons.some(a => a.id === addon.id);
                  return (
                    <button
                      key={addon.id}
                      onClick={() => toggleAddon(addon)}
                      className={cn(
                        'w-full flex items-center justify-between p-3 rounded-xl border transition-all',
                        isSelected
                          ? 'border-brand-500 bg-brand-500/10'
                          : 'border-[#2a2825] bg-[#0f0e0c] hover:border-[#3a3835]'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          'w-4 h-4 rounded border-2 flex items-center justify-center transition-all',
                          isSelected ? 'border-brand-500 bg-brand-500' : 'border-[#3a3835]'
                        )}>
                          {isSelected && <span className="text-[#0f0e0c] text-xs font-bold">✓</span>}
                        </div>
                        <span className="text-sm text-[#fafaf9]">
                          {isAr ? addon.name_ar : addon.name_en}
                        </span>
                      </div>
                      <span className="text-sm text-brand-400 font-medium">
                        {addon.price > 0
                          ? `+${formatBHD(addon.price, locale as 'en' | 'ar')}`
                          : (isAr ? 'مجاني' : 'Free')
                        }
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="label text-xs">
              {isAr ? 'ملاحظات خاصة (اختياري)' : 'Special instructions (optional)'}
            </label>
            <textarea
              className="input resize-none h-16 text-sm"
              dir={isAr ? 'rtl' : 'ltr'}
              placeholder={isAr ? 'حساسية؟ طلبات خاصة...' : 'Allergies? Special requests...'}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Footer: qty + add */}
        <div className="px-5 pt-4 border-t border-[#2a2825] bg-[#1a1916] flex-shrink-0 safe-bottom">
          <div className="flex items-center gap-3">
            {/* Quantity — 44px touch targets */}
            <div className="flex items-center gap-1 bg-[#0f0e0c] border border-[#2a2825] rounded-xl p-1 flex-shrink-0">
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-11 h-11 flex items-center justify-center text-[#a8a29e]
                           active:text-[#fafaf9] active:bg-[#1a1916] rounded-lg
                           transition-colors touch-manipulation"
              >
                <Minus size={16} />
              </button>
              <span className="font-bold text-[#fafaf9] w-6 text-center text-sm">{qty}</span>
              <button
                onClick={() => setQty(q => q + 1)}
                className="w-11 h-11 flex items-center justify-center text-[#a8a29e]
                           active:text-[#fafaf9] active:bg-[#1a1916] rounded-lg
                           transition-colors touch-manipulation"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Add to cart */}
            <button
              onClick={() => {
                if (variations.length > 0 && !selectedVariation) {
                  toast.error(isAr ? 'يرجى اختيار الحجم' : 'Please select a size');
                  return;
                }
                onAdd(item, selectedVariation, selectedAddons, qty, notes);
                onClose();
              }}
              className="btn-primary flex-1 min-w-0"
            >
              <ShoppingCart size={16} className="flex-shrink-0" />
              <span className="truncate">
                {isAr ? `إضافة — ${formatBHD(lineTotal, 'ar')}` : `Add — ${formatBHD(lineTotal, 'en')}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Cart Drawer ────────────────────────────────────────────
function CartDrawer({
  locale,
  restaurantId,
  tableId,
  tableName,
  onOrderPlaced,
}: {
  locale: string;
  restaurantId: string;
  tableId: string;
  tableName: string;
  onOrderPlaced: (orderId: string, orderNumber: string) => void;
}) {
  const isAr = locale === 'ar';
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
      customer_name: customerName || undefined,
      notes: orderNotes || undefined,
      session_token: sessionToken,
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

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        restaurant_id: payload.restaurant_id,
        table_id: payload.table_id,
        order_number: '',  // auto-set by trigger
        customer_name: payload.customer_name,
        notes: payload.notes,
        session_token: payload.session_token,
        subtotal: total,
        total,
        payment_method: 'cashier',
      })
      .select()
      .single();

    if (orderError || !order) {
      toast.error(isAr ? 'حدث خطأ. يرجى المحاولة مرة أخرى.' : 'Error placing order. Try again.');
      setPlacing(false);
      return;
    }

    // Insert order items
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
      }))
    );

    if (itemsError) {
      toast.error(isAr ? 'حدث خطأ' : 'Error');
      setPlacing(false);
      return;
    }

    clearCart();
    setOpen(false);
    onOrderPlaced(order.id, order.order_number);
    setPlacing(false);

    // Attempt push subscription silently — non-blocking, no error shown if unsupported
    if (isPushSupported()) {
      subscribeToPush(order.id, restaurantId).catch(() => {/* silent */});
    }
  };

  if (count === 0) return null;

  return (
    <>
      {/* Floating cart button — respects iPhone home-bar safe area */}
      <div className="fixed inset-x-4 z-40 max-w-md mx-auto"
           style={{ bottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}>
        <button
          onClick={() => setOpen(true)}
          className="w-full btn-primary py-4 shadow-2xl shadow-brand-500/20 text-base"
        >
          <div className="flex items-center justify-between w-full gap-2 min-w-0">
            <div className="flex items-center gap-2 flex-shrink-0">
              <ShoppingCart size={20} />
              <span className="bg-[#0f0e0c]/30 text-sm px-2 py-0.5 rounded-full font-bold">
                {count}
              </span>
            </div>
            <span className="truncate">{isAr ? 'عرض الطلب' : 'View Order'}</span>
            <span className="font-bold flex-shrink-0">{formatBHD(total, locale as 'en' | 'ar')}</span>
          </div>
        </button>
      </div>

      {/* Cart drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-[#1a1916] w-full max-w-md rounded-t-3xl
                          max-h-[88dvh] flex flex-col shadow-2xl animate-slide-up overscroll-contain">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-[#3a3835] rounded-full" />
            </div>

            <div className="px-5 py-3 flex items-center justify-between border-b border-[#2a2825] flex-shrink-0">
              <h2 className="font-bold text-[#fafaf9]">
                {isAr ? 'طلبك' : 'Your Order'}
              </h2>
              <button onClick={() => setOpen(false)} className="text-[#57534e] hover:text-[#fafaf9]">
                <ChevronUp size={20} />
              </button>
            </div>

            {/* Table name */}
            <div className="px-5 py-2 bg-[#0f0e0c]/50 border-b border-[#2a2825]">
              <span className="text-xs text-[#57534e]">
                📍 {tableName}
              </span>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
              {items.map((ci) => (
                <div key={ci.cartId} className="flex gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#fafaf9]">
                      {isAr ? ci.item.name_ar : ci.item.name_en}
                    </div>
                    {ci.variation && (
                      <div className="text-xs text-[#57534e]">
                        {isAr ? ci.variation.name_ar : ci.variation.name_en}
                      </div>
                    )}
                    {ci.addons.length > 0 && (
                      <div className="text-xs text-[#57534e]">
                        + {ci.addons.map(a => isAr ? a.name_ar : a.name_en).join(', ')}
                      </div>
                    )}
                    {ci.notes && (
                      <div className="text-xs text-yellow-600 italic">"{ci.notes}"</div>
                    )}
                    <div className="text-sm text-brand-400 font-semibold mt-0.5">
                      {formatBHD(ci.lineTotal, locale as 'en' | 'ar')}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <div className="flex items-center bg-[#0f0e0c] border border-[#2a2825] rounded-lg">
                      <button
                        onClick={() => updateQuantity(ci.cartId, ci.quantity - 1)}
                        className="w-10 h-10 flex items-center justify-center text-[#a8a29e]
                                   active:text-[#fafaf9] active:bg-[#1a1916] rounded-lg
                                   transition-colors touch-manipulation"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="text-sm font-bold text-[#fafaf9] w-5 text-center">{ci.quantity}</span>
                      <button
                        onClick={() => updateQuantity(ci.cartId, ci.quantity + 1)}
                        className="w-10 h-10 flex items-center justify-center text-[#a8a29e]
                                   active:text-[#fafaf9] active:bg-[#1a1916] rounded-lg
                                   transition-colors touch-manipulation"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(ci.cartId)}
                      className="w-10 h-10 flex items-center justify-center text-red-400
                                 active:text-red-300 active:bg-red-950/30 rounded-lg
                                 transition-colors touch-manipulation"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Customer name */}
              <div>
                <label className="label text-xs">
                  {isAr ? 'اسمك (اختياري)' : 'Your name (optional)'}
                </label>
                <input
                  className="input text-sm"
                  dir={isAr ? 'rtl' : 'ltr'}
                  placeholder={isAr ? 'حتى نناديك باسمك' : "So we can call your name"}
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                />
              </div>

              <div>
                <label className="label text-xs">
                  {isAr ? 'ملاحظات (اختياري)' : 'Order notes (optional)'}
                </label>
                <textarea
                  className="input resize-none h-14 text-sm"
                  dir={isAr ? 'rtl' : 'ltr'}
                  placeholder={isAr ? 'أي طلبات خاصة للطلب...' : 'Any special requests...'}
                  value={orderNotes}
                  onChange={e => setOrderNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Pay at cashier notice */}
            <div className="px-5 py-3 bg-brand-500/10 border-t border-brand-500/20 mx-5 rounded-xl mb-3
                            flex items-start gap-2 flex-shrink-0">
              <Info size={16} className="text-brand-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-brand-300 leading-relaxed">
                {isAr
                  ? 'الدفع عند الكاشير عند استلام طلبك. لا يلزم أي دفع إلكتروني.'
                  : 'Pay at the cashier when you receive your order. No online payment required.'
                }
              </p>
            </div>

            {/* Footer */}
            <div className="px-5 pt-2 space-y-3 border-t border-[#2a2825] flex-shrink-0 safe-bottom">
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-[#a8a29e]">{isAr ? 'الإجمالي' : 'Total'}</span>
                <span className="text-brand-400 text-lg">{formatBHD(total, locale as 'en' | 'ar')}</span>
              </div>
              <button
                onClick={placeOrder}
                disabled={placing}
                className="btn-primary w-full py-4 text-base"
              >
                {placing
                  ? (isAr ? 'جار تأكيد الطلب...' : 'Placing order...')
                  : (isAr ? 'تأكيد الطلب' : 'Place Order')
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Order Tracker ──────────────────────────────────────────
function OrderTracker({
  orderId,
  orderNumber,
  restaurantId,
  prepTimeMinutes,
  locale,
  onDismiss,
}: {
  orderId: string;
  orderNumber: string;
  restaurantId: string;
  prepTimeMinutes?: number;
  locale: string;
  onDismiss: () => void;
}) {
  const isAr = locale === 'ar';
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

  const steps = ['pending', 'confirmed', 'preparing', 'ready'];
  const currentIdx = steps.indexOf(status);

  const STEP_LABELS: Record<string, { icon: string; en: string; ar: string }> = {
    pending:   { icon: '📋', en: 'Order Received',  ar: 'تم استلام الطلب' },
    confirmed: { icon: '✅', en: 'Order Confirmed', ar: 'تم تأكيد الطلب' },
    preparing: { icon: '🍳', en: 'Preparing',       ar: 'يتم التحضير' },
    ready:     { icon: '🔔', en: 'Ready for Pickup',ar: 'جاهز للاستلام' },
    completed: { icon: '🎉', en: 'Completed',        ar: 'مكتمل' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 safe-x">
      <div className="bg-[#1a1916] border border-[#2a2825] rounded-2xl p-6 w-full max-w-sm
                      max-h-[92dvh] overflow-y-auto overscroll-contain animate-slide-up shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">
            {status === 'ready' ? '🔔' : status === 'preparing' ? '🍳' : '📋'}
          </div>
          <h2 className="text-xl font-bold text-[#fafaf9]">
            {isAr ? 'تم تقديم طلبك!' : 'Order Placed!'}
          </h2>
          <p className="text-[#a8a29e] text-sm mt-1">
            {isAr ? 'رقم طلبك' : 'Your order number'}
          </p>
          <div className="text-3xl font-black text-brand-400 mt-1">{orderNumber}</div>

          {/* Prep time estimate — only while order is still active */}
          {prepTimeMinutes && !['ready', 'completed', 'cancelled'].includes(status) && (
            <div className="inline-flex items-center gap-1.5 mt-2 text-xs text-[#a8a29e]
                            bg-[#0f0e0c] border border-[#2a2825] rounded-full px-3 py-1">
              ⏱ {isAr ? `الوقت المتوقع: ~${prepTimeMinutes} دقيقة` : `Est. ~${prepTimeMinutes} min`}
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
                  isDone    ? 'bg-brand-500 text-[#0f0e0c]' :
                  isCurrent ? 'bg-[#2a2825] border-2 border-brand-500 animate-pulse' :
                              'bg-[#1a1916] border border-[#2a2825]'
                )}>
                  {isDone ? '✓' : info.icon}
                </div>
                <div className="flex-1">
                  <div className={cn(
                    'text-sm font-medium',
                    isCurrent ? 'text-brand-400' :
                    isDone    ? 'text-[#a8a29e]' : 'text-[#3a3835]'
                  )}>
                    {isAr ? info.ar : info.en}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cashier note */}
        <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-3 mb-4">
          <p className="text-xs text-brand-300 text-center leading-relaxed">
            {isAr
              ? '💳 ادفع عند الكاشير عند استلام طلبك'
              : '💳 Pay at the cashier when you collect your order'
            }
          </p>
        </div>

        {/* Review form on completion */}
        {status === 'completed' && !reviewSubmitted && (
          <div className="mb-4 pt-4 border-t border-[#2a2825]">
            <ReviewForm
              restaurantId={restaurantId}
              orderId={orderId}
              locale={locale}
              onSubmitted={() => setReviewSubmitted(true)}
            />
          </div>
        )}

        {status === 'completed' && (
          <button onClick={onDismiss} className="btn-primary w-full">
            {isAr ? 'شكراً لك! 🎉' : 'Thank you! 🎉'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Customer Menu Page ────────────────────────────────
export default function CustomerMenuPage({
  params: { locale, slug, tableId },
}: {
  params: { locale: string; slug: string; tableId: string };
}) {
  const isAr = locale === 'ar';
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
          supabase.from('variations').select('*').in(
            'item_id',
            (await supabase.from('items').select('id').eq('restaurant_id', restaurantId)).data?.map((i: { id: string }) => i.id) ?? []
          ).order('sort_order'),
          supabase.from('addons').select('*').in(
            'item_id',
            (await supabase.from('items').select('id').eq('restaurant_id', restaurantId)).data?.map((i: { id: string }) => i.id) ?? []
          ).order('sort_order'),
        ]);

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
      setLoading(false);
    };

    load();
  }, [slug, tableId, supabase, initCart]);

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
      <div className="min-h-screen bg-[#0f0e0c] flex items-center justify-center">
        <div className="text-[#57534e]">{isAr ? 'جار التحميل...' : 'Loading menu...'}</div>
      </div>
    );
  }

  if (!restaurant || !table) {
    return (
      <div className="min-h-screen bg-[#0f0e0c] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-3">😕</div>
          <h1 className="text-xl font-bold text-[#fafaf9]">
            {isAr ? 'رمز QR غير صالح' : 'Invalid QR Code'}
          </h1>
          <p className="text-[#a8a29e] mt-2">
            {isAr ? 'يرجى مسح رمز QR مرة أخرى' : 'Please scan the QR code again'}
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
      <div className="min-h-screen bg-[#0f0e0c] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-5xl mb-3">🔒</div>
          <h1 className="text-xl font-bold text-[#fafaf9]">
            {isAr ? restaurant.name_ar : restaurant.name_en}
          </h1>
          <p className="text-[#a8a29e] mt-2">
            {isAr ? 'المطعم مغلق حالياً' : 'Restaurant is currently closed'}
          </p>
          <p className="text-sm text-[#57534e] mt-1">
            {isAr ? 'يرجى المحاولة لاحقاً' : 'Please check back later'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0e0c]" style={{ paddingBottom: 'calc(7rem + env(safe-area-inset-bottom, 0px))' }}>
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
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0f0e0c]" />
          </div>
        )}
        <div className={cn('px-4 pb-3', restaurant.cover_url ? '-mt-12 relative z-10' : 'pt-8')}>
          <div className="flex items-end gap-3">
            {restaurant.logo_url && (
              <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-[#2a2825]
                              bg-[#1a1916] flex-shrink-0">
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
              <h1 className="text-xl font-bold text-[#fafaf9]">
                {isAr ? restaurant.name_ar : restaurant.name_en}
              </h1>
              {(isAr ? restaurant.description_ar : restaurant.description_en) && (
                <p className="text-xs text-[#a8a29e] mt-0.5 line-clamp-2">
                  {isAr ? restaurant.description_ar : restaurant.description_en}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  reallyOpen ? 'bg-green-950 text-green-400' : 'bg-red-950 text-red-400'
                )}>
                  {reallyOpen ? (isAr ? '● مفتوح' : '● Open') : (isAr ? '● مغلق' : '● Closed')}
                </span>
                <span className="text-xs text-[#57534e]">
                  📍 {isAr ? table.name_ar : table.name_en}
                </span>
                {restaurant.prep_time_minutes && (
                  <span className="text-xs text-[#57534e]">
                    ⏱ {isAr ? `~${restaurant.prep_time_minutes} د` : `~${restaurant.prep_time_minutes}m`}
                  </span>
                )}
              </div>
              {weekHours && (
                <div className="mt-1.5">
                  <OpeningHoursDisplay hours={weekHours} locale={locale} />
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
          locale={locale}
        />
      )}

      {/* Search */}
      <div className="px-4 mb-3">
        <input
          className="input text-sm"
          dir={isAr ? 'rtl' : 'ltr'}
          placeholder={isAr ? '🔍 ابحث في القائمة...' : '🔍 Search menu...'}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Category pills — sticky, 44px touch targets */}
      {!searchQuery && categories.length > 0 && (
        <div className="sticky top-0 z-20 bg-[#0f0e0c]/95 backdrop-blur-sm pt-1 pb-2 mb-2">
          <div className="flex gap-2 px-4 overflow-x-auto scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={cn(
                  'flex-shrink-0 text-sm px-3.5 min-h-[40px] rounded-xl border transition-all',
                  'active:scale-95 touch-manipulation select-none',
                  selectedCategory === cat.id
                    ? 'bg-brand-500 text-[#0f0e0c] border-brand-500 font-semibold'
                    : 'border-[#2a2825] text-[#a8a29e] active:border-[#3a3835]'
                )}
              >
                {cat.emoji} {isAr ? cat.name_ar : cat.name_en}
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
                item={item}
                locale={locale}
                onClick={() => setSelectedItem(item)}
              />
            ))}
            {filteredItems.length === 0 && (
              <div className="text-center py-12 text-[#57534e]">
                {isAr ? 'لا توجد نتائج' : 'No results found'}
              </div>
            )}
          </div>
        ) : (
          categories.map(cat => {
            const catItems = filteredItems.filter(i => i.category_id === cat.id);
            if (catItems.length === 0) return null;
            return (
              <div key={cat.id} ref={el => { if (el) catRefs.current[cat.id] = el; }}>
                <h2 className="text-base font-bold text-[#fafaf9] mb-3 flex items-center gap-2">
                  <span>{cat.emoji}</span>
                  {isAr ? cat.name_ar : cat.name_en}
                </h2>
                <div className="grid grid-cols-1 gap-3">
                  {catItems.map(item => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      locale={locale}
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
          <h2 className="text-sm font-bold text-[#fafaf9] mb-3 flex items-center gap-1.5">
            <Star size={14} className="text-yellow-400" />
            {isAr ? 'تقييمات العملاء' : 'Customer Reviews'}
          </h2>
          <ReviewsList restaurantId={restaurant.id} locale={locale} limit={5} />
        </div>
      )}

      {/* Item modal */}
      {selectedItem && (
        <ItemModal
          item={selectedItem}
          variations={variations[selectedItem.id] ?? []}
          addons={addons[selectedItem.id] ?? []}
          locale={locale}
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
              isAr
                ? `تمت الإضافة: ${item.name_ar}`
                : `Added: ${item.name_en}`
            );
          }}
        />
      )}

      {/* Cart drawer — hidden while ordering is paused */}
      {table && restaurant && !isPaused && (
        <CartDrawer
          locale={locale}
          restaurantId={restaurant.id}
          tableId={table.id}
          tableName={isAr ? table.name_ar : table.name_en}
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
          locale={locale}
          onDismiss={() => setPlacedOrder(null)}
        />
      )}
    </div>
  );
}

// ── Item Card Component ────────────────────────────────────
function ItemCard({
  item,
  locale,
  onClick,
}: {
  item: Item;
  locale: string;
  onClick: () => void;
}) {
  const isAr = locale === 'ar';
  return (
    <button
      onClick={onClick}
      className="card-hover flex items-center gap-3 text-start w-full py-3 active:bg-[#2a2825]"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[#fafaf9] text-sm leading-tight">
            {isAr ? item.name_ar : item.name_en}
          </span>
          {item.is_featured && <Star size={12} className="text-yellow-400 flex-shrink-0" />}
        </div>
        {(isAr ? item.description_ar : item.description_en) && (
          <p className="text-xs text-[#57534e] mt-1 line-clamp-2 leading-relaxed">
            {isAr ? item.description_ar : item.description_en}
          </p>
        )}
        <div className="font-bold text-brand-400 text-sm mt-1.5">
          {formatBHD(item.price, locale as 'en' | 'ar')}
        </div>
      </div>

      <div className="flex-shrink-0 flex flex-col items-end gap-2">
        {item.image_url ? (
          <div className="w-20 h-20 rounded-xl overflow-hidden relative">
            <NextImage
              src={getPublicImageUrl(item.image_url)}
              alt={item.name_en}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-xl bg-[#1a1916] flex items-center justify-center text-2xl">
            🍴
          </div>
        )}
        <div className="w-11 h-11 rounded-lg bg-brand-500 flex items-center justify-center
                        touch-manipulation">
          <Plus size={18} className="text-[#0f0e0c]" />
        </div>
      </div>
    </button>
  );
}
