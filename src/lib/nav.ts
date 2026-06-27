import {
  LayoutGrid,
  BarChart3,
  UtensilsCrossed,
  ShoppingCart,
  ChefHat,
  Grid3x3,
  FilePlus,
  Settings,
  Package,
  Star,
  Clock,
  type LucideIcon,
} from "lucide-react";

export type UserRole = "owner" | "staff" | "admin";

export interface NavItem {
  title: string;
  titleAr: string;
  url: string;
  icon: LucideIcon;
  roles: UserRole[];
  badge?: number | string;
}

export interface NavGroup {
  group: string;
  groupAr: string;
  items: NavItem[];
}

export const dashboardNav: NavGroup[] = [
  {
    group: "الرئيسية",
    groupAr: "الرئيسية",
    items: [
      {
        title: "Dashboard",
        titleAr: "لوحة التحكم",
        url: "dashboard",
        icon: LayoutGrid,
        roles: ["owner", "staff"],
      },
      {
        title: "Analytics",
        titleAr: "التحليلات",
        url: "dashboard/analytics",
        icon: BarChart3,
        roles: ["owner"],
      },
      {
        title: "Menu",
        titleAr: "القائمة",
        url: "dashboard/menu",
        icon: UtensilsCrossed,
        roles: ["owner", "staff"],
      },
      {
        title: "Orders",
        titleAr: "الطلبات",
        url: "dashboard/orders",
        icon: ShoppingCart,
        roles: ["owner", "staff"],
      },
      {
        title: "Kitchen",
        titleAr: "المطبخ",
        url: "dashboard/kitchen",
        icon: ChefHat,
        roles: ["owner", "staff"],
      },
    ],
  },
  {
    group: "الإدارة",
    groupAr: "الإدارة",
    items: [
      {
        title: "Tables",
        titleAr: "الطاولات",
        url: "dashboard/tables",
        icon: Grid3x3,
        roles: ["owner"],
      },
      {
        title: "Manual Order",
        titleAr: "طلب يدوي",
        url: "dashboard/manual-order",
        icon: FilePlus,
        roles: ["owner", "staff"],
      },
      {
        title: "Settings",
        titleAr: "الإعدادات",
        url: "dashboard/settings",
        icon: Settings,
        roles: ["owner", "staff"],
      },
      {
        title: "Stock",
        titleAr: "المخزون",
        url: "dashboard/stock",
        icon: Package,
        roles: ["owner"],
      },
      {
        title: "Reviews",
        titleAr: "التقييمات",
        url: "dashboard/reviews",
        icon: Star,
        roles: ["owner"],
      },
      {
        title: "Hours",
        titleAr: "ساعات العمل",
        url: "dashboard/hours",
        icon: Clock,
        roles: ["owner"],
      },
    ],
  },
];

/**
 * Get the navigation items for a specific role.
 */
export function getNavByRole(role: UserRole): NavGroup[] {
  return dashboardNav
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0);
}

/**
 * Check if a path matches a nav item for active highlighting.
 */
export function isNavItemActive(pathname: string, itemUrl: string, slug: string): boolean {
  const fullPath = `/${slug}/${itemUrl}`;
  if (itemUrl === "dashboard") {
    return pathname === fullPath;
  }
  return pathname.startsWith(fullPath);
}
