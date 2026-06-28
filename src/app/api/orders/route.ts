import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      restaurant_id, table_id, order_type = 'table',
      customer_name, notes, session_token, car_number, car_color,
      items
    } = body;

    if (!restaurant_id || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // For table orders, table_id is required
    if (order_type === 'table' && !table_id) {
      return NextResponse.json({ error: 'Table ID required for table orders' }, { status: 400 });
    }

    // For car orders, car_number and car_color are required
    if (order_type === 'car' && (!car_number || !car_color)) {
      return NextResponse.json({ error: 'Car number and color required for car orders' }, { status: 400 });
    }

    const supabase = createClient();

    // Verify restaurant is open and not paused
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('is_open, ordering_paused')
      .eq('id', restaurant_id)
      .single();

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    if (!restaurant.is_open) {
      return NextResponse.json({ error: 'المطعم مغلق حالياً' }, { status: 400 });
    }

    if (restaurant.ordering_paused) {
      return NextResponse.json({ error: 'الطلبات متوقفة مؤقتاً' }, { status: 400 });
    }

    const subtotal = items.reduce(
      (sum: number, i: { line_total: number }) => sum + i.line_total,
      0
    );

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        restaurant_id,
        table_id: table_id || null,
        order_type,
        order_number: '',
        customer_name,
        notes,
        session_token,
        subtotal,
        total: subtotal,
        payment_method: 'cashier',
        car_number: car_number || null,
        car_color: car_color || null,
      })
      .select()
      .single();

    if (orderError || !order) {

      return NextResponse.json({ error: 'فشل إنشاء الطلب. يرجى المحاولة مرة أخرى.' }, { status: 500 });
    }

    const { error: itemsError } = await supabase.from('order_items').insert(
      items.map((item: {
        item_id: string;
        item_name_en: string;
        item_name_ar: string;
        variation_id?: string;
        variation_name_en?: string;
        variation_name_ar?: string;
        quantity: number;
        unit_price: number;
        addons: unknown[];
        notes?: string;
        line_total: number;
      }) => ({
        order_id: order.id,
        item_id: item.item_id,
        item_name_en: item.item_name_en,
        item_name_ar: item.item_name_ar,
        variation_id: item.variation_id,
        variation_name_en: item.variation_name_en,
        variation_name_ar: item.variation_name_ar,
        quantity: item.quantity,
        unit_price: item.unit_price,
        addons: item.addons,
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
