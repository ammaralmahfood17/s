'use client';

import * as React from 'react';
import { UnifiedShell } from '@/components/ui/unified-shell';
import { UtensilsCrossed, Car, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

interface AppShellProps {
  children: React.ReactNode;
  /** Current restaurant slug */
  slug: string;
  /** Restaurant name in Arabic */
  restaurantName?: string;
  /** The current order type: table / car / external */
  orderType: 'table' | 'car' | 'external';
  /** Table name (for table ordering) */
  tableName?: string;
  /** Whether the sidebar should show categories (for menu filtering) */
  categories?: { id: string; name_ar: string }[];
  /** Active category ID (for highlighting) */
  activeCategory?: string;
  /** Callback when a category is selected */
  onCategoryClick?: (id: string) => void;
}

export function AppShell({
  children,
  slug,
  restaurantName,
  orderType,
  tableName,
  categories,
  activeCategory,
  onCategoryClick,
}: AppShellProps) {
  return (
    <UnifiedShell
      side="right"
      collapsible={false}
      sidebarHeader={
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
            <UtensilsCrossed size={16} className="text-primary" />
          </div>
          <div>
            <div className="font-bold text-foreground text-sm leading-none">
              {restaurantName || 'دكان'}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {orderType === 'table' && (tableName ? `طاولة ${tableName}` : 'قائمة الطعام')}
              {orderType === 'car' && 'طلب سيارة'}
              {orderType === 'external' && 'طلب خارجي'}
            </div>
          </div>
        </div>
      }
      sidebar={
        <div className="flex flex-col gap-2 p-3">
          {/* Quick links */}
          <Link
            href={`/${slug}/car`}
            className="sidebar-link"
          >
            <Car className="size-4 shrink-0" />
            <span>طلب سيارة</span>
          </Link>
          <Link
            href={`/${slug}/external`}
            className="sidebar-link"
          >
            <ShoppingBag className="size-4 shrink-0" />
            <span>طلب خارجي</span>
          </Link>

          {/* Categories */}
          {categories && categories.length > 0 && (
            <>
              <div className="border-t border-border my-2" />
              <p className="px-3 py-1 text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
                الأقسام
              </p>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onCategoryClick?.(cat.id)}
                  className={`sidebar-link text-right ${
                    activeCategory === cat.id ? 'sidebar-link-active' : ''
                  }`}
                >
                  <span>{cat.name_ar}</span>
                </button>
              ))}
            </>
          )}
        </div>
      }
      headerContent={
        <span className="truncate font-bold">
          {restaurantName || 'دكان'}
          {tableName && <span className="text-muted-foreground"> — {tableName}</span>}
        </span>
      }
      shortcutHint={null}
      basePath={`/${slug}`}
    >
      {children}
    </UnifiedShell>
  );
}
