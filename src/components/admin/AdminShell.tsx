'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard, Store, CreditCard, LogOut,
  Shield, Wallet, Search,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { CommandMenu } from '@/components/shared/CommandMenu';
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
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        {/* ── Sidebar ── */}
        <Sidebar side="right" variant="sidebar" collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center flex-shrink-0">
                <Shield size={16} className="text-white" />
              </div>
              <div className="group-data-[collapsible=icon]:hidden">
                <div className="font-bold text-foreground text-sm leading-none">لوحة الإدارة</div>
                <div className="text-xs text-muted-foreground mt-0.5">Super Admin Panel</div>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">الإدارة</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.href)}
                        tooltip={item.label}
                      >
                        <Link href={item.href}>
                          <item.icon className="size-[1.1rem]" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <div className="group-data-[collapsible=icon]:hidden px-1 mb-1">
              <div className="text-xs text-muted-foreground truncate px-2 py-1">{userEmail}</div>
            </div>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="تسجيل الخروج"
                  onClick={handleLogout}
                  className="text-red-400 hover:text-red-300 hover:bg-red-950/40"
                >
                  <LogOut className="size-[1.1rem]" />
                  <span>تسجيل الخروج</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        {/* ── Main Content ── */}
        <SidebarInset>
          {/* Mobile header */}
          <header className="md:hidden flex items-center gap-3 px-4 h-14 border-b border-border bg-sidebar/95 backdrop-blur-sm sticky top-0 z-30 safe-top">
            <SidebarTrigger />
            <Shield size={16} className="text-red-400 flex-shrink-0" />
            <span className="font-bold text-foreground text-sm truncate">لوحة الإدارة</span>
          </header>

          {/* Keyboard shortcut hint */}
          <div className="hidden md:flex items-center justify-end gap-2 px-6 py-2 border-b border-border bg-sidebar/40">
            <span className="text-[10px] text-muted-foreground font-medium">⌘K للبحث</span>
            <kbd className="inline-flex items-center gap-0.5 rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              <Search size={10} /> Ctrl+K
            </kbd>
            <span className="mx-1 text-muted">·</span>
            <span className="text-[10px] text-muted-foreground font-medium">⌘⇧B للشريط</span>
          </div>

          <main className="flex-1">
            {children}
          </main>
        </SidebarInset>

        {/* ── Command Palette ── */}
        <CommandMenu />
      </div>
    </SidebarProvider>
  );
}