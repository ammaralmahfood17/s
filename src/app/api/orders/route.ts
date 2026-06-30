import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const OrderItemSchema = z.object({
  item_id: z.string().uuid(),
  item_name_en: z.string().min(1).max(200),
  item_name_ar: z.string().min(1).max(200),
  variation_id: z.string().uuid().optional().nullable(),
  variation_name_en: z.string().max(200).optional().nullable(),
  variation_name_ar: z.string().max(200).optional().nullable(),
  quantity: z.number().int().min(1).max(50),
  addons: z.array(z.object({
    id: z.string().uuid(),
    name_en: z.string().max(200),
    name_ar: z.string().max(200),
    price: z.number().min(0),
  })).optional().default([]),
  notes: z.string().max(500).optional().nullable(),
});

const PlaceOrderSchema = z.object({
  restaurant_id: z.string().uuid(),
  table_id: z.string().uuid().optional().nullable(),
  order_type: z.enum(['table', 'car', 'external', 'manual']),
  customer_name: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  session_token: z.string().min(1).max(100).optional().nullable(),
  car_number: z.string().max(20).optional().nullable(),
  car_color: z.string().max(50).optional().nullable(),
  items: z.array(OrderItemSchema).min(1).max(30),
  idempotency_key: z.string().uuid(),
}).superRefine((data, ctx) => {
  if (data.order_type === 'table' && !data.table_id) {
    ctx.addIssue({ code: 'custom', path: ['table_id'], message: 'Table ID required for table orders' });
  }
  if (data.order_type === 'car' && (!data.car_number || !data.car_color)) {
    ctx.addIssue({ code: 'custom', path: ['car_number'], message: 'Car number and color required for car orders' });
  }
  if (data.order_type === 'external' && data.table_id) {
    ctx.addIssue({ code: 'custom', path: ['table_id'], message: 'Table ID not allowed for external orders' });
  }
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = PlaceOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      restaurant_id, table_id, order_type,
      customer_name, notes, session_token, car_number, car_color,
      items, idempotency_key,
    } = parsed.data;

    const supabase = createClient();

    // Try to get authenticated user for manual orders tracking
    const { data: { user } } = await supabase.auth.getUser();

    // Verify restaurant is open, not paused, and has active subscription
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('is_open, ordering_paused, subscription_status')
      .eq('id', restaurant_id)
      .maybeSingle();

    if (restaurantError || !restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    if (!restaurant.is_open) {
      return NextResponse.json({ error: 'المطعم مغلق حالياً' }, { status: 400 });
    }

    if (restaurant.ordering_paused) {
      return NextResponse.json({ error: 'الطلبات متوقفة مؤقتاً' }, { status: 400 });
    }

    if (restaurant.subscription_status === 'cancelled' || restaurant.subscription_status === 'paused') {
      return NextResponse.json({ error: 'الاشتراك منتهٍ. لا يمكن قبول الطلبات.' }, { status: 400 });
    }

    if (restaurant.subscription_status === 'past_due') {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('current_period_end')
        .eq('restaurant_id', restaurant_id)
        .maybeSingle();
      if (sub) {
        const daysOverdue = Math.ceil((Date.now() - new Date(sub.current_period_end).getTime()) / 86400000);
        if (daysOverdue > 3) {
          return NextResponse.json({ error: 'الاشتراك منتهٍ. لا يمكن قبول الطلبات.' }, { status: 400 });
        }
      }
    }

    // ── Idempotency check ────────────────────────────────
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, order_number')
      .eq('idempotency_key', idempotency_key)
      .maybeSingle();

    if (existingOrder) {
      return NextResponse.json(
        { success: true, order_id: existingOrder.id, order_number: existingOrder.order_number },
        { status: 200 }
      );
    }
    // ──────────────────────────────────────────────────────

    // ── Server-side price verification ─────────────────────
    const itemIds = [...new Set((items as { item_id: string }[]).map(i => i.item_id))];

    const { data: dbItems, error: itemsLookupError } = await supabase
      .from('items')
      .select('id, price, is_available, sold_out, restaurant_id')
      .in('id', itemIds)
      .eq('restaurant_id', restaurant_id)
      .eq('is_available', true)
      .eq('sold_out', false);

    if (itemsLookupError || !dbItems || dbItems.length !== itemIds.length) {
      return NextResponse.json(
        { error: 'بعض المنتجات غير متاحة أو لا تنتمي لهذا المطعم' },
        { status: 400 }
      );
    }

    const priceMap = new Map(dbItems.map(p => [p.id, p.price]));

    const verifiedItems = (items as Array<{
      item_id: string;
      item_name_en: string;
      item_name_ar: string;
      variation_id?: string;
      variation_name_en?: string;
      variation_name_ar?: string;
      quantity: number;
      addons?: { id: string; name_en: string; name_ar: string; price: number }[];
      notes?: string;
    }>).map(item => {
      const basePrice = priceMap.get(item.item_id) ?? 0;
      const addonsTotal = (item.addons ?? []).reduce((s, a) => s + (a.price ?? 0), 0);
      const lineTotal = (basePrice + addonsTotal) * item.quantity;
      return {
        ...item,
        unit_price: basePrice,
        line_total: lineTotal,
      };
    });

    const subtotal = verifiedItems.reduce((sum, i) => sum + i.line_total, 0);
    // ────────────────────────────────────────────────────────

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        restaurant_id,
        table_id: table_id || null,
        order_type,
        order_number: '',
        customer_name,
        notes,
        session_token: session_token || null,
        subtotal,
        total: subtotal,
        payment_method: 'cashier',
        car_number: car_number || null,
        car_color: car_color || null,
        idempotency_key,
        created_by_user_id: user?.id ?? null,
      })
      .select()
      .single();

    if (orderError || !order) {

      return NextResponse.json({ error: 'فشل إنشاء الطلب. يرجى المحاولة مرة أخرى.' }, { status: 500 });
    }

    const { error: itemsError } = await supabase.from('order_items').insert(
      verifiedItems.map((item) => ({
        order_id: order.id,
        item_id: item.item_id,
        item_name_en: item.item_name_en,
        item_name_ar: item.item_name_ar,
        variation_id: item.variation_id,
        variation_name_en: item.variation_name_en,
        variation_name_ar: item.variation_name_ar,
        quantity: item.quantity,
        unit_price: item.unit_price,
        addons: item.addons ?? [],
        notes: item.notes,
        line_total: item.line_total,
        product_name_ar_snapshot: item.item_name_ar,
        product_name_en_snapshot: item.item_name_en,
        unit_price_snapshot: item.unit_price,
      }))
    );

    if (itemsError) {

      await supabase.from('orders').delete().eq('id', order.id);
      return NextResponse.json({ error: 'فشل إضافة العناصر للطلب.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      order_id: order.id,
      order_number: order.order_number,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
