'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Restaurant } from '@/types';
import type { User } from '@supabase/supabase-js';
import {
  LogOut, Menu, X,
  LayoutGrid, BarChart3, UtensilsCrossed,
  ShoppingCart, ChefHat, Settings,
  Grid3x3, FilePlus, Package, Star,
  Clock, Car,
} from 'lucide-react';
import { dashboardNav, type UserRole } from '@/lib/nav';
import { CommandMenu } from '@/components/shared/CommandMenu';
import { Toaster } from '@/components/shared/Toaster';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
  user: User;
  restaurant: Restaurant | null;
  children: React.ReactNode;
  role?: UserRole;
}

// Bottom nav icon map
const BOTTOM_NAV_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutGrid,
  'dashboard/orders': ShoppingCart,
  'dashboard/kitchen': ChefHat,
  'dashboard/menu': UtensilsCrossed,
  'dashboard/tables': Grid3x3,
  'dashboard/manual-order': FilePlus,
  'dashboard/analytics': BarChart3,
  'dashboard/settings': Settings,
  'dashboard/stock': Package,
  'dashboard/reviews': Star,
  'dashboard/hours': Clock,
};

// Bottom nav: top 5 most important items
const BOTTOM_NAV_PRIORITY = [
  'dashboard/orders',
  'dashboard/kitchen',
  'dashboard/menu',
  'dashboard',
  'dashboard/tables',
];

export default function DashboardShell({ user, restaurant, children, role }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const slug = pathname.split('/')[1] ?? '';
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('تم تسجيل الخروج');
    router.push('/login');
  };

  const isActive = (url: string) => {
    const fullPath = `/${slug}/${url}`;
    if (url === 'dashboard') return pathname === fullPath;
    return pathname.startsWith(fullPath);
  };

  // Filter nav items by role
  const roleFilter: UserRole = role || (restaurant ? 'owner' : 'staff');
  const navGroups = dashboardNav
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(roleFilter)),
    }))
    .filter((group) => group.items.length > 0);

  // Build bottom nav items (top 5 by priority that exist in filtered nav)
  const allNavItems = navGroups.flatMap((g) => g.items);
  const bottomItems = BOTTOM_NAV_PRIORITY
    .map((url) => allNavItems.find((i) => i.url === url))
    .filter(Boolean)
    .slice(0, 5);

  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      {/* ── Desktop Sidebar (Sari3-style) ─────────────── */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-l border-sidebar-border bg-sidebar text-sidebar-foreground">
        {/* Logo */}
        <div className="flex items-center gap-2 border-b border-sidebar-border px-5 py-4">
          <div className="brand-icon">د</div>
          <span className="text-lg font-bold">دكان</span>
        </div>

        {restaurant && (
          <p className="px-5 pt-4 text-xs text-muted-foreground">{restaurant.name_ar}</p>
        )}

        {/* Open/closed status */}
        {restaurant && (
          <div className="px-5 pt-2">
            <div className={cn(
              'flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-bold',
              restaurant.is_open
                ? 'bg-success/15 text-success'
                : 'bg-destructive/15 text-destructive'
            )}>
              <span className={cn(
                'w-1.5 h-1.5 rounded-full',
                restaurant.is_open ? 'bg-success' : 'bg-destructive'
              )} />
              {restaurant.is_open ? 'مفتوح' : 'مغلق'}
            </div>
            {restaurant.ordering_paused && (
              <div className="mt-1 flex items-center gap-2 rounded-full bg-warning/15 px-2.5 py-1 text-xs font-bold text-warning">
                <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                الطلبات موقوفة مؤقتاً
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="mt-4 flex flex-1 flex-col gap-1 px-3 overflow-y-auto">
          {navGroups.map((group, gi) => (
            <div key={gi} className="mb-2">
              <p className="px-3 py-1 text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
                {group.groupAr}
              </p>
              {group.items.map((item) => (
                <Link
                  key={item.url}
                  href={`/${slug}/${item.url}`}
                  className={cn(
                    'sidebar-link',
                    isActive(item.url) && 'sidebar-link-active'
                  )}
                >
                  <item.icon className="size-4 shrink-0" />
                  <span>{item.titleAr}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3 space-y-0.5">
          <div className="px-3 py-1.5 text-xs text-muted-foreground truncate">{user.email}</div>
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-xs text-muted-foreground">الثيم</span>
            <ThemeToggle />
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-full border border-destructive/30 px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="size-3.5" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile header */}
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="grid size-9 place-items-center rounded-full border border-border"
            aria-label="القائمة"
          >
            <Menu className="size-5" />
          </button>
          <span className="truncate font-bold">{restaurant?.name_ar || 'دكان'}</span>
          <div className="size-9" />
        </header>

        {/* Mobile slide-over nav */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden" onClick={() => setMobileNavOpen(false)}>
            <div className="w-64 bg-sidebar p-4 text-sidebar-foreground" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="brand-icon !size-8 !rounded-lg text-sm">د</div>
                  <span className="font-bold">دكان</span>
                </div>
                <button onClick={() => setMobileNavOpen(false)} aria-label="إغلاق">
                  <X className="size-5" />
                </button>
              </div>
              <nav className="mt-4 grid gap-1">
                {navGroups.flatMap((g) => g.items).map((item) => (
                  <Link
                    key={item.url}
                    href={`/${slug}/${item.url}`}
                    onClick={() => setMobileNavOpen(false)}
                    className={cn(
                      'sidebar-link',
                      isActive(item.url) && 'sidebar-link-active'
                    )}
                  >
                    <item.icon className="size-4 shrink-0" />
                    <span>{item.titleAr}</span>
                  </Link>
                ))}
              </nav>
              <div className="mt-6 border-t border-sidebar-border pt-4">
                <button
                  onClick={() => { setMobileNavOpen(false); handleLogout(); }}
                  className="flex w-full items-center gap-2 rounded-full border border-destructive/30 px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="size-3.5" />
                  تسجيل الخروج
                </button>
              </div>
            </div>
            <div className="flex-1 bg-foreground/20" />
          </div>
        )}

        {/* Keyboard shortcut hint (desktop) */}
        <div className="hidden md:flex items-center justify-end gap-2 px-6 py-2 border-b border-border bg-card/50">
          <span className="text-[10px] text-muted-foreground font-medium">⌘K للبحث</span>
          <kbd className="inline-flex items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            Ctrl+K
          </kbd>
        </div>

        {/* Page content */}
        <main className="flex-1 pb-20 md:pb-0">
          {children}
        </main>

        {/* ── Mobile Bottom Nav (Sari3-style) ──────────── */}
        {bottomItems.length > 0 && (
          <nav
            className="fixed inset-x-0 bottom-0 z-30 grid border-t border-border bg-card/95 backdrop-blur md:hidden safe-bottom"
            style={{ gridTemplateColumns: `repeat(${bottomItems.length}, minmax(0, 1fr))` }}
          >
            {bottomItems.map((item) => {
              const Icon = BOTTOM_NAV_ICONS[item!.url] || item!.icon;
              const active = isActive(item!.url);
              return (
                <Link
                  key={item!.url}
                  href={`/${slug}/${item!.url}`}
                  className={cn(
                    'flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold transition-colors touch-manipulation',
                    active ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  <Icon className="size-5" />
                  <span className="truncate max-w-full px-1">{item!.titleAr}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      {/* ── Global Command Palette ─────────────────────── */}
      <CommandMenu basePath={`/${slug}`} />

      {/* ── Sonner Toaster ─────────────────────────────── */}
      <Toaster />
    </div>
  );
}
