import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const StockSchema = z.object({
  item_id: z.string().uuid(),
  sold_out: z.boolean().optional(),
  stock_count: z.number().int().min(0).optional(),
  stock_enabled: z.boolean().optional(),
  is_available: z.boolean().optional(),
});

export async function PATCH(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const parsed = StockSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { item_id, ...updates } = parsed.data;

  // Verify item belongs to a restaurant this user owns or staffs
  const { data: item } = await supabase
    .from('items')
    .select('restaurant_id')
    .eq('id', item_id)
    .single();

  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

  const { data: access } = await supabase
    .from('restaurants')
    .select('id')
    .eq('id', item.restaurant_id)
    .eq('owner_id', user.id)
    .maybeSingle();

  const { data: staffAccess } = !access
    ? await supabase.from('restaurant_staff').select('id').eq('restaurant_id', item.restaurant_id).eq('user_id', user.id).maybeSingle()
    : { data: null };

  if (!access && !staffAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error } = await supabase.from('items').update(updates).eq('id', item_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
