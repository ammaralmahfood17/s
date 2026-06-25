import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/';

    if (code) {
      const supabase = createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      console.error('auth callback - exchange code error:', error?.message);
    }

    return NextResponse.redirect(`${origin}/login?error=auth`);
  } catch (err) {
    console.error('auth callback - unexpected error:', err);
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }
}
