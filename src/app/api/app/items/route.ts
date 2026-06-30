import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// ── Save item (create or update) with variations & addons ───
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { item, variations, addons } = body;

  // Verify ownership
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('id', item.restaurant_id)
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!restaurant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let itemId = item.id ?? null;

  if (itemId) {
    // Update existing item
    const { error } = await supabase.from('items').update(item).eq('id', itemId).eq('restaurant_id', item.restaurant_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    // Create new item
    const { data, error } = await supabase.from('items').insert(item).select('id').single();
    if (error || !data) return NextResponse.json({ error: error?.message ?? 'Insert failed' }, { status: 500 });
    itemId = data.id;
  }

  // Save variations
  if (variations?.length > 0) {
    await supabase.from('variations').delete().eq('item_id', itemId);
    await supabase.from('variations').insert(
      variations.map((v: any, i: number) => ({
        item_id: itemId,
        name_en: v.name_en ?? '',
        name_ar: v.name_ar ?? '',
        price_modifier: v.price_modifier ?? 0,
        sort_order: i,
      }))
    );
  }

  // Save addons
  if (addons?.length > 0) {
    await supabase.from('addons').delete().eq('item_id', itemId);
    await supabase.from('addons').insert(
      addons.map((a: any, i: number) => ({
        item_id: itemId,
        name_en: a.name_en ?? '',
        name_ar: a.name_ar ?? '',
        price: a.price ?? 0,
        sort_order: i,
      }))
    );
  }

  return NextResponse.json({ success: true, itemId });
}

// ── Toggle availability & delete ──────────────────────────
export async function PATCH(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { id, restaurant_id } = body;

  // Verify ownership
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('id', restaurant_id)
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!restaurant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Get current availability
  const { data: item } = await supabase
    .from('items')
    .select('is_available')
    .eq('id', id)
    .single();
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { error } = await supabase
    .from('items')
    .update({ is_available: !item.is_available })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// ── Delete item ───────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const restaurant_id = searchParams.get('restaurant_id');
  if (!id || !restaurant_id) return NextResponse.json({ error: 'Missing id/restaurant_id' }, { status: 400 });

  // Verify ownership
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('id', restaurant_id)
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!restaurant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await supabase.from('variations').delete().eq('item_id', id);
  await supabase.from('addons').delete().eq('item_id', id);
  const { error } = await supabase.from('items').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
