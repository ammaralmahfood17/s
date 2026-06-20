import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurant_id, table_id, customer_name, notes, session_token, items } = body;

    if (!restaurant_id || !table_id || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createClient();

    const subtotal = items.reduce(
      (sum: number, i: { line_total: number }) => sum + i.line_total,
      0
    );

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        restaurant_id,
        table_id,
        order_number: '',
        customer_name,
        notes,
        session_token,
        subtotal,
        total: subtotal,
        payment_method: 'cashier',
      })
      .select()
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: orderError?.message }, { status: 500 });
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
        ...item,
      }))
    );

    if (itemsError) {
      // Rollback order
      await supabase.from('orders').delete().eq('id', order.id);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
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
