import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { OrderStatus } from '@/types';

// ── Status transition guard ───────────────────────────────
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending:     ['confirmed', 'cancelled'],
  confirmed:   ['preparing', 'cancelled'],
  preparing:   ['ready', 'cancelled'],
  ready:       ['delivered'],
  delivered:   [],
  cancelled:   [],
};

function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// ── Update order status ────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { status, locale = 'ar' } = await request.json();
  if (!status || typeof status !== 'string') {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  // Fetch the order to verify tenant ownership + current status
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('restaurant_id, status')
    .eq('id', params.id)
    .maybeSingle();

  if (orderErr || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  // Validate status transition
  const current = order.status as OrderStatus;
  const target = status as OrderStatus;
  if (!canTransition(current, target)) {
    return NextResponse.json(
      { error: `Cannot change status from ${current} to ${target}` },
      { status: 400 },
    );
  }

  // Check if user is owner or staff of the restaurant
  const isOwner = await supabase
    .from('restaurants')
    .select('id')
    .eq('id', order.restaurant_id)
    .eq('owner_id', user.id)
    .maybeSingle()
    .then(r => !!r.data);

  const isStaff = !isOwner
    ? await supabase
        .from('restaurant_staff')
        .select('id')
        .eq('restaurant_id', order.restaurant_id)
        .eq('user_id', user.id)
        .maybeSingle()
        .then(r => !!r.data)
    : false;

  if (!isOwner && !isStaff) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', params.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // Fire push notification asynchronously
  fetch(`${request.nextUrl.origin}/api/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: params.id, status, locale }),
  }).catch(() => {/* silent */});

  return NextResponse.json({ success: true });
}
