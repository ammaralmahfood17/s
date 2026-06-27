'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type { Restaurant } from '@/types';
import type { User } from '@supabase/supabase-js';
import {
  LogOut,
  QrCode, Search,
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
  SidebarSeparator,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { CommandMenu } from '@/components/shared/CommandMenu';
import { toast } from 'sonner';
import { dashboardNav } from '@/lib/nav';

interface Props {
  user: User;
  restaurant: Restaurant | null;
  children: React.ReactNode;
}

export default function DashboardShell({ user, restaurant, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const slug = pathname.split('/')[1] ?? '';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('تم تسجيل الخروج');
    router.push('/login');
  };

  const isNavActive = (itemUrl: string) => {
    const fullPath = `/${slug}/${itemUrl}`;
    if (itemUrl === 'dashboard') {
      return pathname === fullPath;
    }
    return pathname.startsWith(fullPath);
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-[#0f0e0c]">
        {/* ── Desktop Sidebar ── */}
        <Sidebar side="right" variant="sidebar" collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#f59e0b] flex items-center justify-center flex-shrink-0">
                <QrCode size={16} className="text-[#0f0e0c]" />
              </div>
              <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                <div className="font-bold text-[#fafaf9] text-sm leading-none">دكان</div>
                {restaurant && (
                  <div className="text-xs text-[#57534e] truncate mt-0.5">
                    {restaurant.name_ar}
                  </div>
                )}
              </div>
            </div>
          </SidebarHeader>

          {/* Status badges */}
          {restaurant && (
            <div className="px-3 py-2 group-data-[collapsible=icon]:hidden border-b border-[#1a1916]">
              <div className={cn(
                'flex items-center gap-2 text-xs font-medium px-2 py-1.5 rounded-lg',
                restaurant.is_open
                  ? 'text-green-400 bg-green-950/60'
                  : 'text-red-400 bg-red-950/60'
              )}>
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  restaurant.is_open ? 'bg-green-400' : 'bg-red-400'
                )} />
                {restaurant.is_open ? 'مفتوح' : 'مغلق'}
              </div>
              {restaurant.ordering_paused && (
                <div className="mt-1 flex items-center gap-2 text-xs font-medium px-2 py-1.5 rounded-lg text-orange-400 bg-orange-950/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                  الطلبات موقوفة مؤقتاً
                </div>
              )}
            </div>
          )}

          <SidebarContent>
            {dashboardNav.map((group, gi) => (
              <SidebarGroup key={gi}>
                <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
                  {group.groupAr}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const href = `/${slug}/${item.url}`;
                      return (
                        <SidebarMenuItem key={item.url}>
                          <SidebarMenuButton
                            asChild
                            isActive={isNavActive(item.url)}
                            tooltip={item.titleAr}
                          >
                            <Link href={href}>
                              <item.icon className="size-[1.1rem]" />
                              <span>{item.titleAr}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
                {gi < dashboardNav.length - 1 && <SidebarSeparator />}
              </SidebarGroup>
            ))}
          </SidebarContent>

          <SidebarFooter>
          <div className="group-data-[collapsible=icon]:hidden px-1 mb-1">
            <div className="text-xs text-[#57534e] truncate px-2 py-1">{user.email}</div>
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center justify-between px-2 py-1 group-data-[collapsible=icon]:hidden">
                <span className="text-xs text-[#57534e]">الثيم</span>
                <ThemeToggle />
              </div>
            </SidebarMenuItem>
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
          {/* Mobile header with sidebar trigger */}
          <header className="md:hidden flex items-center justify-between px-4 h-14 border-b border-[#1a1916] bg-[#0a0a08]/95 backdrop-blur-sm sticky top-0 z-30 safe-top">
            <SidebarTrigger />
            <span className="font-bold text-[#fafaf9] text-sm truncate">
              {restaurant?.name_ar || 'دكان'}
            </span>
            <div className="w-11" /> {/* spacer */}
          </header>

          {/* Keyboard shortcut hint */}
          <div className="hidden md:flex items-center justify-end gap-2 px-6 py-2 border-b border-[#1a1916] bg-[#0a0a08]/40">
            <span className="text-[10px] text-[#57534e] font-medium">⌘K للبحث</span>
            <kbd className="inline-flex items-center gap-0.5 rounded border border-[#2a2825] bg-[#1a1916] px-1.5 py-0.5 text-[10px] font-medium text-[#57534e]">
              <Search size={10} /> Ctrl+K
            </kbd>
            <span className="mx-1 text-[#2a2825]">·</span>
            <span className="text-[10px] text-[#57534e] font-medium">⌘⇧B للشريط</span>
          </div>

          {/* Page */}
          <main className="flex-1">
            {children}
          </main>
        </SidebarInset>

        {/* ── Command Palette (Ctrl+K) ── */}
        <CommandMenu basePath={`/${slug}`} />

        {/* ── Keyboard shortcut hint: close sidebar ── */}
        <div className="hidden md:block" />
      </div>
    </SidebarProvider>
  );
}
