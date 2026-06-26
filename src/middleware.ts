import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const protectedPrefixes = ['/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is /{slug}/dashboard — always protected
  const slugDashboardMatch = pathname.match(/^\/([^/]+)\/dashboard(\/.*)?$/);

  const isProtected =
    protectedPrefixes.some((p) => pathname.startsWith(p)) ||
    !!slugDashboardMatch;

  if (!isProtected) {
    // Handle /setup — redirect logged-in users with a restaurant to their dashboard
    if (pathname === '/setup') {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll() {},
          },
        }
      );

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirectTo', '/setup');
        return NextResponse.redirect(loginUrl);
      }

      // User is logged in — check if they already have a restaurant
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('slug')
        .eq('owner_id', user.id)
        .single();

      if (restaurant?.slug) {
        return NextResponse.redirect(new URL(`/${restaurant.slug}/dashboard`, request.url));
      }

      return NextResponse.next();
    }

    return NextResponse.next();
  }

  // Protected route auth check
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Extra guard: /admin requires super_admin row
  if (pathname.startsWith('/admin')) {
    const { data: adminRow } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!adminRow) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
