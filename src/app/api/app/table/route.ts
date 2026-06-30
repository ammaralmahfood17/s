import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();

  const qrToken = request.nextUrl.searchParams.get('token');
  if (!qrToken) {
    return NextResponse.json({ error: 'Missing token param' }, { status: 400 });
  }

  const { data: table, error } = await supabase
    .from('tables')
    .select('id, name_en, name_ar, restaurant_id, is_active')
    .eq('qr_token', qrToken)
    .single();

  if (error || !table) {
    return NextResponse.json({ error: 'Table not found' }, { status: 404 });
  }

  return NextResponse.json(table);
}
