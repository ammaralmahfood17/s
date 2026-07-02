'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { dashboardNav, type UserRole } from '@/lib/nav';
import {
  LayoutGrid, BarChart3, UtensilsCrossed,
  ShoppingCart, Grid3x3, FilePlus, Package, Star,
  Clock, Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Restaurant } from '@/types';

interface Props {
  slug: string;
  restaurant: Restaurant | null;
  role?: UserRole;
}

const BOTTOM_NAV_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutGrid,
  'dashboard/kitchen': ShoppingCart,
  'dashboard/menu': UtensilsCrossed,
  'dashboard/tables': Grid3x3,
  'dashboard/manual-order': FilePlus,
  'dashboard/analytics': BarChart3,
  'dashboard/settings': Settings,
  'dashboard/stock': Package,
  'dashboard/reviews': Star,
  'dashboard/hours': Clock,
};

const BOTTOM_NAV_PRIORITY = [
  'dashboard/kitchen',
  'dashboard/menu',
  'dashboard',
  'dashboard/tables',
];

export default function DashboardBottomNav({ slug, restaurant, role }: Props) {
  const pathname = usePathname();

  const isActive = (url: string) => {
    const fullPath = `/${slug}/${url}`;
    if (url === 'dashboard') return pathname === fullPath;
    return pathname.startsWith(fullPath);
  };

  const roleFilter: UserRole = role || (restaurant ? 'owner' : 'staff');

  // Build filtered nav items
  const allNavItems = dashboardNav
    .flatMap((g) => g.items)
    .filter((item) => item.roles.includes(roleFilter));

  const bottomItems = BOTTOM_NAV_PRIORITY
    .map((url) => allNavItems.find((i) => i.url === url))
    .filter(Boolean)
    .slice(0, 5);

  if (bottomItems.length === 0) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 grid border-t border-border
        bg-card/95 backdrop-blur md:hidden safe-bottom"
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
              'relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold transition-colors touch-manipulation',
              active
                ? 'text-[#004956]'
                : 'text-muted-foreground'
            )}
          >
            {active && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#004956]" />
            )}
            <Icon className="size-5" />
            <span className="truncate max-w-full px-1">{item!.titleAr}</span>
          </Link>
        );
      })}
    </nav>
  );
}
