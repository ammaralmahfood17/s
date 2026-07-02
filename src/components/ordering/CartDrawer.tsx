'use client';

import { useState } from 'react';
import { ShoppingCart, Plus, Minus, X, ChevronUp, Info, Car, Package } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useCartStore } from '@/hooks/useCart';
import { formatBHD, getOrCreateSessionToken } from '@/lib/utils';
import type { OrderType } from '@/types';
import { toast } from 'sonner';

interface CartDrawerProps {
  restaurantId: string;
  onOrderPlaced: (orderId: string, orderNumber: string) => void;
  orderType?: OrderType;
  tableId?: string;
  tableName?: string;
  carNumber?: string | null;
  carColor?: string | null;
}

export default function CartDrawer({
  restaurantId,
  onOrderPlaced,
  orderType = 'external',
  tableId,
  tableName,
  carNumber,
  carColor,
}: CartDrawerProps) {
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

    const payload: Record<string, unknown> = {
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
        // unit_price and line_total intentionally omitted —
        // server recalculates from DB prices
      })),
      idempotency_key: crypto.randomUUID(),
    };

    if (orderType === 'table') {
      payload.table_id = tableId;
    } else if (orderType === 'car') {
      payload.car_number = carNumber || undefined;
      payload.car_color = carColor || undefined;
    }

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
      {/* Floating cart button — respects iPhone home-bar safe area */}
      <div className="fixed inset-x-4 z-40 max-w-md mx-auto"
           style={{ bottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}>
        <button
          onClick={() => setOpen(true)}
          className="w-full btn-primary py-4 shadow-2xl shadow-primary/20 text-base"
        >
          <div className="flex items-center justify-between w-full gap-2 min-w-0">
            <div className="flex items-center gap-2 flex-shrink-0">
              <ShoppingCart size={20} />
              <span className="bg-background/30 text-sm px-2 py-0.5 rounded-full font-bold">
                {count}
              </span>
            </div>
            <span className="truncate">عرض الطلب</span>
            <span className="font-bold flex-shrink-0">{formatBHD(total, 'ar')}</span>
          </div>
        </button>
      </div>

      {/* Cart drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-card w-full max-w-md rounded-t-3xl
                          max-h-[88dvh] flex flex-col shadow-2xl animate-slide-up overscroll-contain">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-muted-foreground/20 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-5 py-3 flex items-center justify-between border-b border-border flex-shrink-0">
              <h2 className="font-bold text-foreground">طلبك</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <ChevronUp size={20} />
              </button>
            </div>

            {/* Order type indicator */}
            <div className="px-5 py-2 bg-background/50 border-b border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {orderType === 'table' ? (
                  <span>📍 {tableName}</span>
                ) : orderType === 'car' ? (
                  <>
                    <Car size={12} className="text-primary" />
                    <span>طلب سيارة</span>
                    {carNumber && <span className="text-primary">· {carNumber}</span>}
                  </>
                ) : (
                  <>
                    <Package size={12} className="text-primary" />
                    <span>طلب من الخارج — استلام من المطعم</span>
                  </>
                )}
              </div>
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
              {items.map(ci => (
                <div key={ci.cartId} className="flex gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">
                      {ci.item.name_ar}
                    </div>
                    {ci.variation && (
                      <div className="text-xs text-muted-foreground">
                        {ci.variation.name_ar}
                      </div>
                    )}
                    {ci.addons.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        + {ci.addons.map(a => a.name_ar).join(', ')}
                      </div>
                    )}
                    {ci.notes && (
                      <div className="text-xs text-yellow-600 italic">&ldquo;{ci.notes}&rdquo;</div>
                    )}
                    <div className="text-sm text-primary font-semibold mt-0.5">
                      {formatBHD(ci.lineTotal, 'ar')}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <div className="flex items-center bg-background border border-border rounded-lg">
                      <button
                        onClick={() => updateQuantity(ci.cartId, ci.quantity - 1)}
                        className="w-10 h-10 flex items-center justify-center text-muted-foreground
                                   active:text-foreground active:bg-card rounded-lg
                                   transition-colors touch-manipulation"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="text-sm font-bold text-foreground w-5 text-center">{ci.quantity}</span>
                      <button
                        onClick={() => updateQuantity(ci.cartId, ci.quantity + 1)}
                        className="w-10 h-10 flex items-center justify-center text-muted-foreground
                                   active:text-foreground active:bg-card rounded-lg
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
                <label className="label text-xs">اسمك (اختياري)</label>
                <input
                  className="input text-sm"
                  dir="rtl"
                  placeholder="حتى نناديك باسمك"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                />
              </div>

              {/* Order notes */}
              <div>
                <label className="label text-xs">ملاحظات (اختياري)</label>
                <textarea
                  className="input resize-none h-14 text-sm"
                  dir="rtl"
                  placeholder="أي طلبات خاصة للطلب..."
                  value={orderNotes}
                  onChange={e => setOrderNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Payment notice — table and external only, not car */}
            {(orderType === 'table' || orderType === 'external') && (
              <div className="px-5 py-3 bg-primary/10 border-t border-primary/20 mx-5 rounded-xl mb-3
                              flex items-start gap-2 flex-shrink-0">
                <Info size={16} className="text-primary flex-shrink-0 mt-0.5" />
                <p className="text-xs text-primary leading-relaxed">
                  الدفع عند الكاشير عند استلام طلبك. لا يلزم أي دفع إلكتروني.
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="px-5 pt-2 space-y-3 border-t border-border flex-shrink-0 safe-bottom">
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-muted-foreground">الإجمالي</span>
                <span className="text-primary text-lg">{formatBHD(total, 'ar')}</span>
              </div>
              <button
                onClick={placeOrder}
                disabled={placing}
                className="btn-primary w-full py-4 text-base"
              >
                {placing ? 'جار تأكيد الطلب...' : 'تأكيد الطلب ✓'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
