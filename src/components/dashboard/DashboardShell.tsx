'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Restaurant } from '@/types';
import type { User } from '@supabase/supabase-js';
import { LogOut } from 'lucide-react';
import { UnifiedShell } from '@/components/ui/unified-shell';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardBottomNav from '@/components/dashboard/DashboardBottomNav';
import { type UserRole } from '@/lib/nav';
import { toast } from 'sonner';

interface Props {
  user: User;
  restaurant: Restaurant | null;
  children: React.ReactNode;
  role?: UserRole;
}

export default function DashboardShell({ user, restaurant, children, role }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const slug = pathname.split('/')[1] ?? '';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('تم تسجيل الخروج');
    router.push('/login');
  };

  return (
    <UnifiedShell
      sidebarHeader={
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#CFF7EE' }}>
            <span className="text-sm font-black" style={{ color: '#004956' }}>د</span>
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <div className="font-bold text-sm leading-none" style={{ color: '#004956' }}>دكان</div>
            <div className="text-xs mt-0.5" style={{ color: '#004956/60' }}>لوحة التحكم</div>
          </div>
        </div>
      }
      sidebar={
        <DashboardSidebar
          user={user}
          restaurant={restaurant}
          slug={slug}
          role={role}
        />
      }
      sidebarFooter={
        <div className="p-2">
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
        <span className="truncate font-bold">{restaurant?.name_ar || 'دكان'}</span>
      }
      bottomNav={
        <DashboardBottomNav slug={slug} restaurant={restaurant} role={role} />
      }
      basePath={`/${slug}`}
    >
      {children}
    </UnifiedShell>
  );
}
