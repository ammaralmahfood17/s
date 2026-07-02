'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard, Store, CreditCard, LogOut,
  Shield, Wallet,
} from 'lucide-react';
import { UnifiedShell } from '@/components/ui/unified-shell';
import { toast } from 'sonner';

interface Props {
  userEmail: string;
  children: React.ReactNode;
}

const navItems = [
  { href: '/admin',               icon: LayoutDashboard, label: 'نظرة عامة' },
  { href: '/admin/restaurants',   icon: Store,           label: 'العربات' },
  { href: '/admin/subscriptions', icon: CreditCard,      label: 'الاشتراكات' },
  { href: '/admin/payments',      icon: Wallet,          label: 'المدفوعات' },
];

export default function AdminShell({ userEmail, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('تم تسجيل الخروج');
    router.push('/login');
  };

  const isActive = (href: string) =>
    pathname === href || (href !== '/admin' && pathname.startsWith(href));

  return (
    <UnifiedShell
      sidebarHeader={
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center flex-shrink-0">
            <Shield size={16} className="text-white" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <div className="font-bold text-foreground text-sm leading-none">لوحة الإدارة</div>
            <div className="text-xs text-muted-foreground mt-0.5">Super Admin Panel</div>
          </div>
        </div>
      }
      sidebar={navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`sidebar-link ${isActive(item.href) ? 'sidebar-link-active' : ''}`}
        >
          <item.icon className="size-4 shrink-0" />
          <span>{item.label}</span>
        </Link>
      ))}
      sidebarFooter={
        <div className="p-2 space-y-1">
          <div className="px-3 py-1.5 text-xs text-muted-foreground truncate group-data-[collapsible=icon]:hidden">
            {userEmail}
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-full border border-destructive/30 px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="size-3.5" />
            تسجيل الخروج
          </button>
        </div>
      }
      headerContent={
        <span className="truncate font-bold">لوحة الإدارة</span>
      }
    >
      {children}
    </UnifiedShell>
  );
}
