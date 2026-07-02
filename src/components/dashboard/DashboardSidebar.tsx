'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Restaurant } from '@/types';
import type { User } from '@supabase/supabase-js';
import { dashboardNav, type UserRole } from '@/lib/nav';

interface Props {
  user: User;
  restaurant: Restaurant | null;
  slug: string;
  role?: UserRole;
}

export default function DashboardSidebar({ user, restaurant, slug, role }: Props) {
  const pathname = usePathname();

  const isActive = (url: string) => {
    const fullPath = `/${slug}/${url}`;
    if (url === 'dashboard') return pathname === fullPath;
    return pathname.startsWith(fullPath);
  };

  const roleFilter: UserRole = role || (restaurant ? 'owner' : 'staff');
  const navGroups = dashboardNav
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(roleFilter)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="flex flex-col gap-4 p-3">
      {/* Restaurant name */}
      {restaurant && (
        <p className="px-2 text-xs text-muted-foreground">{restaurant.name_ar}</p>
      )}

      {/* Open/closed status */}
      {restaurant && (
        <div>
          <div className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold
            bg-success/15 text-success"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            {restaurant.is_open ? 'مفتوح' : 'مغلق'}
          </div>
          {restaurant.ordering_paused && (
            <div className="mt-1.5 flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold
              bg-warning/15 text-warning"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
              الطلبات موقوفة مؤقتاً
            </div>
          )}
        </div>
      )}

      {/* Navigation groups */}
      <nav className="flex flex-col gap-1">
        {navGroups.map((group) => (
          <div key={group.group} className="mb-2">
            <p className="px-3 py-1 text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
              {group.groupAr}
            </p>
            {group.items.map((item) => (
              <Link
                key={item.url}
                href={`/${slug}/${item.url}`}
                className={`sidebar-link ${isActive(item.url) ? 'sidebar-link-active' : ''}`}
              >
                <item.icon className="size-4 shrink-0" />
                <span>{item.titleAr}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* User email */}
      <div className="px-3 py-1.5 text-xs text-muted-foreground truncate">
        {user.email}
      </div>
    </div>
  );
}
