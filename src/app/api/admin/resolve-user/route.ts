import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {

      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }

    let user: { id: string; email?: string } | undefined;
    for (const u of data.users) {
      if (u.email?.toLowerCase() === email.toLowerCase()) {
        user = u;
        break;
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user_id: user.id, email: user.email });
  } catch (e) {

    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}