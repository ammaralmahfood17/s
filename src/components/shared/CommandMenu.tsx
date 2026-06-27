'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  ChefHat,
  Grid3x3,
  BarChart3,
  Settings,
  Hand,
  Package,
  Car,
  Search,
  X,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface PageEntry {
  id: string;
  label: string;
  labelEn: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  description: string;
}

const pages: PageEntry[] = [
  {
    id: 'dashboard',
    label: 'لوحة التحكم',
    labelEn: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    description: 'نظرة عامة على المطعم والإحصائيات',
  },
  {
    id: 'menu',
    label: 'القائمة',
    labelEn: 'Menu',
    icon: UtensilsCrossed,
    href: '/dashboard/menu',
    description: 'إدارة أصناف القائمة والفئات',
  },
  {
    id: 'orders',
    label: 'الطلبات',
    labelEn: 'Orders',
    icon: ClipboardList,
    href: '/dashboard/orders',
    description: 'عرض وإدارة الطلبات الواردة',
  },
  {
    id: 'kitchen',
    label: 'المطبخ',
    labelEn: 'Kitchen',
    icon: ChefHat,
    href: '/dashboard/kitchen',
    description: 'شاشة عرض الطلبات في المطبخ',
  },
  {
    id: 'tables',
    label: 'الطاولات',
    labelEn: 'Tables',
    icon: Grid3x3,
    href: '/dashboard/tables',
    description: 'إدارة ترتيب الطاولات',
  },
  {
    id: 'analytics',
    label: 'التحليلات',
    labelEn: 'Analytics',
    icon: BarChart3,
    href: '/dashboard/analytics',
    description: 'تقارير المبيعات والأداء',
  },
  {
    id: 'settings',
    label: 'الإعدادات',
    labelEn: 'Settings',
    icon: Settings,
    href: '/dashboard/settings',
    description: 'إعدادات المطعم والملف الشخصي',
  },
  {
    id: 'manual-order',
    label: 'طلب يدوي',
    labelEn: 'Manual Order',
    icon: Hand,
    href: '/dashboard/manual-order',
    description: 'إنشاء طلب يدوي للعميل',
  },
  {
    id: 'stock',
    label: 'المخزون',
    labelEn: 'Stock',
    icon: Package,
    href: '/dashboard/stock',
    description: 'إدارة المخزون والمواد',
  },
  {
    id: 'car',
    label: 'السيارة',
    labelEn: 'Car',
    icon: Car,
    href: '/dashboard/car',
    description: 'خدمة الطلبات للسيارات',
  },
];

interface CommandMenuProps {
  basePath?: string;
}

export function CommandMenu({ basePath = '' }: CommandMenuProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = (href: string) => {
    setOpen(false);
    router.push(`${basePath}${href}`);
  };

  return (
    <>
      {/* Hidden trigger button for screen readers */}
      <button
        onClick={() => setOpen(true)}
        className="hidden"
        aria-label="Open command menu"
      />

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="ابحث عن صفحة... / Search pages..." />
        <CommandList>
          <CommandEmpty className="py-8 text-center text-sm text-[#a8a29e]">
            <Search className="mx-auto mb-2 h-5 w-5 opacity-50" />
            لا توجد نتائج — No results found
          </CommandEmpty>
          <CommandGroup heading="الصفحات — Pages">
            {pages.map((page) => (
              <CommandItem
                key={page.id}
                value={`${page.label} ${page.labelEn} ${page.id}`}
                onSelect={() => handleSelect(page.href)}
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a1916] text-[#a8a29e]">
                  <page.icon className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-[#fafaf9]">
                    {page.label}
                  </span>
                  <span className="text-xs text-[#57534e]">
                    {page.description}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
