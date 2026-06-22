'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  QrCode, LayoutDashboard, UtensilsCrossed, ClipboardList,
  ChefHat, Grid3x3, BarChart3, Settings, LogOut,
  Menu, X, Shield
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Restaurant } from '@/types';
import type { User } from '@supabase/supabase-js';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Props {
  user: User;
  restaurant: Restaurant | null;
  children: React.ReactNode;
}

export default function DashboardShell({ user, restaurant, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Extract slug from path: /{slug}/dashboard/...
  const slug = pathname.split('/')[1] ?? '';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('تم تسجيل الخروج');
    router.push('/login');
  };

  const navItems = [
    { href: `/${slug}/dashboard`,           icon: LayoutDashboard,  label: 'لوحة التحكم' },
    { href: `/${slug}/dashboard/orders`,    icon: ClipboardList,   label: 'الطلبات' },
    { href: `/${slug}/dashboard/kitchen`,   icon: ChefHat,         label: 'المطبخ' },
    { href: `/${slug}/dashboard/menu`,      icon: UtensilsCrossed, label: 'القائمة' },
    { href: `/${slug}/dashboard/tables`,    icon: Grid3x3,         label: 'الطاولات' },
    { href: `/${slug}/dashboard/analytics`, icon: BarChart3,       label: 'التحليلات' },
    { href: `/${slug}/dashboard/settings`,  icon: Settings,        label: 'الإعدادات' },
  ];

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-[#1a1916]">
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center flex-shrink-0">
          <QrCode size={16} className="text-[#0f0e0c]" />
        </div>
        <div className="min-w-0">
          <div className="font-bold text-[#fafaf9] text-sm leading-none">دكان</div>
          {restaurant && (
            <div className="text-xs text-[#57534e] truncate mt-0.5">
              {restaurant.name_ar}
            </div>
          )}
        </div>
      </div>

      {/* Open/closed toggle */}
      {restaurant && (
        <div className="px-4 py-3 border-b border-[#1a1916] space-y-1.5">
          <div className={cn(
            'flex items-center gap-2 text-xs font-medium px-2 py-1.5 rounded-lg',
            restaurant.is_open
              ? 'text-green-400 bg-green-950'
              : 'text-red-400 bg-red-950'
          )}>
            <span className={cn(
              'w-1.5 h-1.5 rounded-full',
              restaurant.is_open ? 'bg-green-400' : 'bg-red-400'
            )} />
            {restaurant.is_open ? 'مفتوح' : 'مغلق'}
          </div>
          {restaurant.ordering_paused && (
            <div className="flex items-center gap-2 text-xs font-medium px-2 py-1.5 rounded-lg
                            text-orange-400 bg-orange-950/60">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              الطلبات موقوفة مؤقتاً
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== `/${slug}/dashboard` && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                isActive ? 'sidebar-link-active' : 'sidebar-link'
              )}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-[#1a1916] space-y-1">
        {/* Subscription status pill */}
        {restaurant && (
          <AdminLinkOrSubStatus
            restaurantId={restaurant.id}
            slug={slug}
          />
        )}

        {/* Storefront link */}
        {restaurant && (
          <Link href={`/${restaurant.slug}`} target="_blank" className="sidebar-link">
            <QrCode size={18} />
            <span>الواجهة العامة</span>
          </Link>
        )}

        {/* Logout */}
        <button onClick={handleLogout}
          className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-950/40">
          <LogOut size={18} />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );

  // Primary tabs shown in the mobile bottom bar — most-used pages only
  const mobileTabs = [
    { href: `/${slug}/dashboard`,         icon: LayoutDashboard, label: 'الرئيسية' },
    { href: `/${slug}/dashboard/orders`,  icon: ClipboardList,   label: 'الطلبات' },
    { href: `/${slug}/dashboard/kitchen`, icon: ChefHat,         label: 'المطبخ' },
    { href: `/${slug}/dashboard/menu`,    icon: UtensilsCrossed, label: 'القائمة' },
  ];

  return (
    <div className="min-h-screen bg-[#0f0e0c] flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 flex-shrink-0
                         bg-[#0a0a08] border-e border-[#1a1916]">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay (for secondary pages) */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-64 max-w-[80vw] bg-[#0a0a08] border-e border-[#1a1916]
                          flex flex-col z-10 safe-top safe-bottom">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-3 end-3 w-11 h-11 flex items-center justify-center
                         text-[#57534e] hover:text-[#fafaf9] touch-manipulation"
            >
              <X size={20} />
            </button>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center gap-3 px-4 h-14
                           border-b border-[#1a1916] bg-[#0a0a08]/95 backdrop-blur-sm
                           sticky top-0 z-30 safe-top">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-11 h-11 -ms-2 flex items-center justify-center text-[#a8a29e]
                       active:text-[#fafaf9] touch-manipulation flex-shrink-0"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded bg-brand-500 flex items-center justify-center flex-shrink-0">
              <QrCode size={12} className="text-[#0f0e0c]" />
            </div>
            <span className="font-bold text-[#fafaf9] text-sm flex-shrink-0">دكان</span>
            {restaurant && (
              <span className="text-xs text-[#57534e] truncate">
                — {restaurant.name_ar}
              </span>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          {children}
        </main>

        {/* Mobile bottom tab bar */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[#0a0a08]/95 backdrop-blur-sm
                        border-t border-[#1a1916] safe-bottom">
          <div className="flex items-stretch">
            {mobileTabs.map((tab) => {
              const isActive = pathname === tab.href ||
                (tab.href !== `/${slug}/dashboard` && pathname.startsWith(tab.href));
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px]',
                    'touch-manipulation transition-colors',
                    isActive ? 'text-brand-400' : 'text-[#57534e] active:text-[#a8a29e]'
                  )}
                >
                  <tab.icon size={20} />
                  <span className="text-[10px] font-medium">{tab.label}</span>
                </Link>
              );
            })}
            {/* "More" opens the full sidebar drawer */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px]
                         text-[#57534e] active:text-[#a8a29e] touch-manipulation transition-colors"
            >
              <Menu size={20} />
              <span className="text-[10px] font-medium">أكثر</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}

// ── Shows Admin link for super admins, or subscription status for others ──
function AdminLinkOrSubStatus({
  restaurantId,
  slug,
}: {
  restaurantId: string;
  slug: string;
}) {
  const supabase = createClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [subStatus, setSubStatus] = useState<string | null>(null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [adminRes, subRes] = await Promise.all([
        supabase.from('super_admins').select('id').eq('user_id', user.id).single(),
        supabase.from('subscriptions').select('status, current_period_end').eq('restaurant_id', restaurantId).single(),
      ]);

      setIsAdmin(!!adminRes.data);

      if (subRes.data) {
        setSubStatus(subRes.data.status);
        const days = Math.ceil(
          (new Date(subRes.data.current_period_end).getTime() - Date.now()) / 86400000
        );
        setDaysLeft(days);
      }
    };
    load();
  }, [restaurantId, supabase]);

  if (isAdmin) {
    return (
      <Link href={`/admin`}
        className="sidebar-link text-red-400 hover:text-red-300 hover:bg-red-950/20">
        <Shield size={18} />
        <span>لوحة الإدارة</span>
      </Link>
    );
  }

  if (!subStatus) return null;

  const STATUS_COLOR: Record<string, string> = {
    active:    'text-green-400 bg-green-950',
    free:      'text-green-400 bg-green-950',
    trialing:  'text-yellow-400 bg-yellow-950',
    past_due:  'text-red-400 bg-red-950',
    cancelled: 'text-red-400 bg-red-950',
    paused:    'text-[#a8a29e] bg-[#1a1916]',
  };

  const STATUS_LABEL: Record<string, string> = {
    active:    'نشط',
    free:      'مجاني ✨',
    trialing:  'تجريبي',
    past_due:  'متأخر',
    cancelled: 'منتهي',
    paused:    'موقوف',
  };

  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium ${STATUS_COLOR[subStatus] ?? 'text-[#a8a29e] bg-[#1a1916]'}`}>
      <span>{STATUS_LABEL[subStatus] ?? subStatus}</span>
      {daysLeft !== null && subStatus !== 'free' && (
        <span className="opacity-70">
          {daysLeft > 0 ? `${daysLeft}d` : 'منتهي'}
        </span>
      )}
    </div>
  );
}
