'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Store, CreditCard, Users,
  Menu, X, QrCode, LogOut, Shield
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Props {
  locale: string;
  userEmail: string;
  children: React.ReactNode;
}

const navItems = (locale: string) => [
  { href: `/${locale}/admin`,               icon: LayoutDashboard, en: 'Overview',      ar: 'نظرة عامة' },
  { href: `/${locale}/admin/restaurants`,   icon: Store,           en: 'Restaurants',   ar: 'العربات' },
  { href: `/${locale}/admin/subscriptions`, icon: CreditCard,      en: 'Subscriptions', ar: 'الاشتراكات' },
  { href: `/${locale}/admin/payments`,      icon: CreditCard,      en: 'Payments',      ar: 'المدفوعات' },
];

export default function AdminShell({ locale, userEmail, children }: Props) {
  const isAr = locale === 'ar';
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out');
    router.push(`/${locale}/login`);
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-[#1a1916]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center flex-shrink-0">
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-[#fafaf9] text-sm">Dokan Admin</div>
            <div className="text-xs text-[#57534e]">Super Admin Panel</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems(locale).map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== `/${locale}/admin` && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(isActive ? 'sidebar-link-active' : 'sidebar-link')}
            >
              <item.icon size={18} />
              <span>{isAr ? item.ar : item.en}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-[#1a1916] space-y-1">
        <div className="px-3 py-2 text-xs text-[#57534e] truncate">{userEmail}</div>
        <Link href={`/${locale}/dashboard`} className="sidebar-link">
          <QrCode size={18} />
          <span>{isAr ? 'لوحة المطعم' : 'Restaurant Dashboard'}</span>
        </Link>
        <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-950/40">
          <LogOut size={18} />
          <span>{isAr ? 'تسجيل الخروج' : 'Log out'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f0e0c] flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 bg-[#0a0a08] border-e border-[#1a1916]">
        <Sidebar />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 max-w-[80vw] bg-[#0a0a08] border-e border-[#1a1916]
                          flex flex-col z-10 safe-top safe-bottom">
            <button onClick={() => setSidebarOpen(false)}
              className="absolute top-3 end-3 w-11 h-11 flex items-center justify-center
                         text-[#57534e] active:text-[#fafaf9] touch-manipulation">
              <X size={20} />
            </button>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-3 px-4 h-14 border-b border-[#1a1916]
                           bg-[#0a0a08]/95 backdrop-blur-sm sticky top-0 z-30 safe-top">
          <button onClick={() => setSidebarOpen(true)}
            className="w-11 h-11 -ms-2 flex items-center justify-center text-[#a8a29e]
                       active:text-[#fafaf9] touch-manipulation flex-shrink-0">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <Shield size={16} className="text-red-400 flex-shrink-0" />
            <span className="font-bold text-[#fafaf9] text-sm truncate">Dokan Admin</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto safe-bottom">{children}</main>
      </div>
    </div>
  );
}
