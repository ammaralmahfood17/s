'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  QrCode, LayoutDashboard, UtensilsCrossed, ClipboardList,
  ChefHat, Grid3x3, BarChart3, Users, Settings, LogOut,
  Menu, X, Globe, Shield
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Restaurant } from '@/types';
import type { User } from '@supabase/supabase-js';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Props {
  locale: string;
  user: User;
  restaurant: Restaurant | null;
  children: React.ReactNode;
}

const navItems = (locale: string) => [
  { href: `/${locale}/dashboard`,           icon: LayoutDashboard, labelEn: 'Dashboard', labelAr: 'لوحة التحكم' },
  { href: `/${locale}/dashboard/orders`,    icon: ClipboardList,   labelEn: 'Orders',    labelAr: 'الطلبات' },
  { href: `/${locale}/dashboard/kitchen`,   icon: ChefHat,         labelEn: 'Kitchen',   labelAr: 'المطبخ' },
  { href: `/${locale}/dashboard/menu`,      icon: UtensilsCrossed, labelEn: 'Menu',      labelAr: 'القائمة' },
  { href: `/${locale}/dashboard/tables`,    icon: Grid3x3,         labelEn: 'Tables',    labelAr: 'الطاولات' },
  { href: `/${locale}/dashboard/analytics`, icon: BarChart3,       labelEn: 'Analytics', labelAr: 'التحليلات' },
  { href: `/${locale}/dashboard/team`,      icon: Users,           labelEn: 'Team',      labelAr: 'الفريق' },
  { href: `/${locale}/dashboard/settings`,  icon: Settings,        labelEn: 'Settings',  labelAr: 'الإعدادات' },
];

export default function DashboardShell({ locale, user, restaurant, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAr = locale === 'ar';
  const oppositeLocale = isAr ? 'en' : 'ar';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success(isAr ? 'تم تسجيل الخروج' : 'Logged out');
    router.push(`/${locale}/login`);
  };

  const switchLocale = () => {
    const newPath = pathname.replace(`/${locale}`, `/${oppositeLocale}`);
    router.push(newPath);
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-[#1a1916]">
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center flex-shrink-0">
          <QrCode size={16} className="text-[#0f0e0c]" />
        </div>
        <div className="min-w-0">
          <div className="font-bold text-[#fafaf9] text-sm leading-none">
            {isAr ? 'دكان' : 'Dokan'}
          </div>
          {restaurant && (
            <div className="text-xs text-[#57534e] truncate mt-0.5">
              {isAr ? restaurant.name_ar : restaurant.name_en}
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
            {restaurant.is_open
              ? (isAr ? 'مفتوح' : 'Open')
              : (isAr ? 'مغلق' : 'Closed')
            }
          </div>
          {restaurant.ordering_paused && (
            <div className="flex items-center gap-2 text-xs font-medium px-2 py-1.5 rounded-lg
                            text-orange-400 bg-orange-950/60">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              {isAr ? 'الطلبات موقوفة مؤقتاً' : 'Ordering Paused'}
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems(locale).map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== `/${locale}/dashboard` && pathname.startsWith(item.href));
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
              <span>{isAr ? item.labelAr : item.labelEn}</span>
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
            locale={locale}
            isAr={isAr}
          />
        )}

        {/* Language switcher */}
        <button onClick={switchLocale} className="sidebar-link w-full">
          <Globe size={18} />
          <span>{isAr ? 'English' : 'العربية'}</span>
        </button>

        {/* Storefront link */}
        {restaurant && (
          <Link href={`/${locale}/r/${restaurant.slug}`} target="_blank" className="sidebar-link">
            <QrCode size={18} />
            <span>{isAr ? 'الواجهة العامة' : 'Storefront'}</span>
          </Link>
        )}

        {/* Logout */}
        <button onClick={handleLogout}
          className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-950/40">
          <LogOut size={18} />
          <span>{isAr ? 'تسجيل الخروج' : 'Log out'}</span>
        </button>
      </div>
    </div>
  );

  // Primary tabs shown in the mobile bottom bar — most-used pages only
  const mobileTabs = [
    { href: `/${locale}/dashboard`,         icon: LayoutDashboard, en: 'Home',    ar: 'الرئيسية' },
    { href: `/${locale}/dashboard/orders`,  icon: ClipboardList,   en: 'Orders',  ar: 'الطلبات' },
    { href: `/${locale}/dashboard/kitchen`, icon: ChefHat,         en: 'Kitchen', ar: 'المطبخ' },
    { href: `/${locale}/dashboard/menu`,    icon: UtensilsCrossed, en: 'Menu',    ar: 'القائمة' },
  ];

  return (
    <div className="min-h-screen bg-[#0f0e0c] flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 flex-shrink-0
                         bg-[#0a0a08] border-e border-[#1a1916]">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay (for secondary pages: Tables/Analytics/Team/Settings) */}
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
        {/* Top bar (mobile) — safe-area aware */}
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
            <span className="font-bold text-[#fafaf9] text-sm flex-shrink-0">
              {isAr ? 'دكان' : 'Dokan'}
            </span>
            {restaurant && (
              <span className="text-xs text-[#57534e] truncate">
                — {isAr ? restaurant.name_ar : restaurant.name_en}
              </span>
            )}
          </div>
        </header>

        {/* Page content — bottom padding clears the mobile tab bar */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          {children}
        </main>

        {/* Mobile bottom tab bar — primary nav, thumb-reachable */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[#0a0a08]/95 backdrop-blur-sm
                        border-t border-[#1a1916] safe-bottom">
          <div className="flex items-stretch">
            {mobileTabs.map((tab) => {
              const isActive = pathname === tab.href ||
                (tab.href !== `/${locale}/dashboard` && pathname.startsWith(tab.href));
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
                  <span className="text-[10px] font-medium">{isAr ? tab.ar : tab.en}</span>
                </Link>
              );
            })}
            {/* "More" opens the full sidebar drawer for secondary pages */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px]
                         text-[#57534e] active:text-[#a8a29e] touch-manipulation transition-colors"
            >
              <Menu size={20} />
              <span className="text-[10px] font-medium">{isAr ? 'أكثر' : 'More'}</span>
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
  locale,
  isAr,
}: {
  restaurantId: string;
  locale: string;
  isAr: boolean;
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
      <Link href={`/${locale}/admin`}
        className="sidebar-link text-red-400 hover:text-red-300 hover:bg-red-950/20">
        <Shield size={18} />
        <span>{isAr ? 'لوحة الإدارة' : 'Admin Panel'}</span>
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

  const STATUS_LABEL: Record<string, { en: string; ar: string }> = {
    active:    { en: 'Active',    ar: 'نشط' },
    free:      { en: 'Free ✨',  ar: 'مجاني ✨' },
    trialing:  { en: 'Trial',    ar: 'تجريبي' },
    past_due:  { en: 'Past Due', ar: 'متأخر' },
    cancelled: { en: 'Expired',  ar: 'منتهي' },
    paused:    { en: 'Paused',   ar: 'موقوف' },
  };

  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium ${STATUS_COLOR[subStatus] ?? 'text-[#a8a29e] bg-[#1a1916]'}`}>
      <span>{STATUS_LABEL[subStatus]?.[isAr ? 'ar' : 'en'] ?? subStatus}</span>
      {daysLeft !== null && subStatus !== 'free' && (
        <span className="opacity-70">
          {daysLeft > 0 ? `${daysLeft}d` : isAr ? 'منتهي' : 'expired'}
        </span>
      )}
    </div>
  );
}

