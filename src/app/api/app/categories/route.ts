import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// ── Create category ───────────────────────────────────────
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { restaurant_id, name_en, name_ar, sort_order } = body;
  if (!restaurant_id || !name_en || !name_ar) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Verify ownership
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('id', restaurant_id)
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!restaurant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { error } = await supabase.from('categories').insert({
    restaurant_id,
    name_en,
    name_ar,
    sort_order,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// ── Delete category ───────────────────────────────────────
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

  await supabase.from('items').delete().eq('category_id', id);
  await supabase.from('categories').delete().eq('id', id);

  return NextResponse.json({ success: true });
}
