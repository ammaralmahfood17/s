'use client';

import { useState, useEffect } from 'react';
import { Plus, Minus, Trash2, Search, ChevronDown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatBHD } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Restaurant, Category, Item, Variation, Addon, OrderItem } from '@/types';
import { toast } from 'sonner';

interface CartLine {
  id: string;
  item: Item;
  variation: Variation | null;
  quantity: number;
  notes: string;
}

export default function ManualOrderPage({
  params: { slug },
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [variationsMap, setVariationsMap] = useState<Record<string, Variation[]>>({});
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: r } = await supabase.from('restaurants').select('*').eq('owner_id', user.id).single();
      if (!r) return;
      setRestaurant(r);

      const [catsRes, itemsRes, varsRes] = await Promise.all([
        supabase.from('categories').select('*').eq('restaurant_id', r.id).eq('is_visible', true).eq('is_active', true).order('sort_order'),
        supabase.from('items').select('*').eq('restaurant_id', r.id).eq('is_available', true).order('sort_order'),
        supabase.from('variations').select('*').eq('restaurant_id', r.id).order('sort_order'),
      ]);

      const cats = catsRes.data ?? [];
      const its = itemsRes.data ?? [];
      const vars = varsRes.data ?? [];

      setCategories(cats);
      setItems(its);
      if (cats.length > 0) setActiveCategory(cats[0].id);

      const vMap: Record<string, Variation[]> = {};
      vars.forEach(v => { if (!vMap[v.item_id]) vMap[v.item_id] = []; vMap[v.item_id].push(v); });
      setVariationsMap(vMap);

      setLoading(false);
    };
    load();
  }, [supabase]);

  const addToCart = (item: Item, variation: Variation | null) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id && c.variation?.id === variation?.id);
      if (existing) {
        return prev.map(c => c.id === existing.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { id: crypto.randomUUID(), item, variation, quantity: 1, notes: '' }];
    });
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) { setCart(prev => prev.filter(c => c.id !== id)); return; }
    setCart(prev => prev.map(c => c.id === id ? { ...c, quantity: qty } : c));
  };

  const total = cart.reduce((sum, c) => {
    const price = c.item.price + (c.variation?.price_modifier ?? 0);
    return sum + price * c.quantity;
  }, 0);

  const placeOrder = async () => {
    if (!restaurant || cart.length === 0) return;
    setPlacing(true);

    const payload = {
      restaurant_id: restaurant.id,
      order_type: 'manual',
      customer_name: customerName || null,
      notes: notes || null,
      session_token: null,
      items: cart.map(c => ({
        item_id: c.item.id,
        item_name_en: c.item.name_en,
        item_name_ar: c.item.name_ar,
        variation_id: c.variation?.id ?? null,
        variation_name_en: c.variation?.name_en ?? null,
        variation_name_ar: c.variation?.name_ar ?? null,
        quantity: c.quantity,
        addons: [],
        notes: c.notes || null,
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
        toast.error(data.error || 'حدث خطأ في إنشاء الطلب');
        setPlacing(false);
        return;
      }

      toast.success(`تم إنشاء الطلب ${data.order_number} بنجاح`);
      setCart([]);
      setCustomerName('');
      setNotes('');
    } catch {
      toast.error('حدث خطأ في إنشاء الطلب');
    }
    setPlacing(false);
  };

  if (loading) return <div className="p-6 text-muted-foreground">جار التحميل...</div>;

  const filteredItems = items.filter(i => {
    const matchesCategory = !activeCategory || i.category_id === activeCategory;
    const matchesSearch = !searchQuery || i.name_ar.includes(searchQuery) || i.name_en.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 max-w-5xl space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">طلب يدوي</h1>
        <p className="text-sm text-muted-foreground">إنشاء طلب جديد للعميل</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Items list */}
        <div className="lg:col-span-2 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="input ps-10" placeholder="بحث عن عنصر..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} dir="rtl" />
          </div>

          {/* Categories */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            <button onClick={() => setActiveCategory('')}
              className={cn('flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                !activeCategory ? 'bg-primary text-primary-foreground' : 'text-muted-foreground bg-card'
              )}>الكل</button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={cn('flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  activeCategory === cat.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground bg-card'
                )}>
                {cat.emoji && <span className="ml-1">{cat.emoji}</span>}
                {cat.name_ar}
              </button>
            ))}
          </div>

          {/* Items grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {filteredItems.map(item => (
              <button key={item.id} onClick={() => addToCart(item, variationsMap[item.id]?.[0] ?? null)}
                className="card text-start active:scale-[0.97] transition-transform">
                <div className="text-sm font-medium text-foreground truncate">{item.name_ar}</div>
                <div className="text-xs text-primary font-semibold mt-1">{formatBHD(item.price, 'ar')}</div>
                {variationsMap[item.id]?.length > 0 && (
                  <div className="text-[10px] text-muted-foreground mt-0.5">{variationsMap[item.id].length} حجم</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div className="card space-y-3 h-fit sticky top-4">
          <h2 className="font-bold text-foreground">الطلب</h2>

          <input className="input text-sm" placeholder="اسم العميل (اختياري)" value={customerName} onChange={e => setCustomerName(e.target.value)} dir="rtl" />

          {cart.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">اضغط على العناصر لإضافتها</div>
          ) : (
            <div className="space-y-2">
              {cart.map(c => (
                <div key={c.id} className="flex items-center gap-2 bg-background rounded-lg p-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-foreground truncate">{c.item.name_ar}</div>
                    {c.variation && <div className="text-[10px] text-muted-foreground">{c.variation.name_ar}</div>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQuantity(c.id, c.quantity - 1)} className="w-7 h-7 flex items-center justify-center text-muted-foreground bg-card rounded touch-manipulation"><Minus size={12} /></button>
                    <span className="text-xs text-foreground w-4 text-center">{c.quantity}</span>
                    <button onClick={() => updateQuantity(c.id, c.quantity + 1)} className="w-7 h-7 flex items-center justify-center text-muted-foreground bg-card rounded touch-manipulation"><Plus size={12} /></button>
                    <button onClick={() => setCart(prev => prev.filter(x => x.id !== c.id))} className="w-7 h-7 flex items-center justify-center text-red-400 bg-card rounded touch-manipulation"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <textarea className="input resize-none h-16 text-sm" placeholder="ملاحظات الطلب..." value={notes} onChange={e => setNotes(e.target.value)} dir="rtl" />

          {cart.length > 0 && (
            <>
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="text-sm text-muted-foreground">الإجمالي</span>
                <span className="font-bold text-foreground">{formatBHD(total, 'ar')}</span>
              </div>
              <button onClick={placeOrder} disabled={placing} className="btn-primary w-full">
                {placing ? 'جار الإنشاء...' : 'إنشاء الطلب'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
