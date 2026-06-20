'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { CreditCard, AlertCircle } from 'lucide-react';

interface Props {
  restaurantId: string;
  locale: string;
  children: React.ReactNode;
}

export function SubscriptionGate({ restaurantId, locale, children }: Props) {
  const isAr = locale === 'ar';
  const supabase = createClient();
  const [status, setStatus] = useState<string | null>(null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('status, current_period_end')
        .eq('restaurant_id', restaurantId)
        .single();

      if (data) {
        setStatus(data.status);
        const days = Math.ceil(
          (new Date(data.current_period_end).getTime() - Date.now()) / 86400000
        );
        setDaysLeft(days);
      }
      setLoading(false);
    };
    load();
  }, [restaurantId, supabase]);

  if (loading) return <>{children}</>;

  // Blocked states
  const blocked = status === 'cancelled' || (status === 'past_due' && daysLeft !== null && daysLeft < -7);

  if (blocked) {
    return (
      <div className="min-h-screen bg-[#0f0e0c] flex items-center justify-center p-4">
        <div className="card max-w-md text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-950/40 border border-red-900
                          flex items-center justify-center mx-auto">
            <CreditCard size={32} className="text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-[#fafaf9]">
            {isAr ? 'الاشتراك منتهي' : 'Subscription Expired'}
          </h1>
          <p className="text-sm text-[#a8a29e]">
            {isAr
              ? 'انتهى اشتراكك في دكان. يرجى التواصل معنا لتجديد الاشتراك.'
              : 'Your Dokan subscription has expired. Please contact us to renew.'}
          </p>
          <div className="bg-[#1a1916] border border-[#2a2825] rounded-xl p-4 text-sm text-[#a8a29e]">
            <p>{isAr ? 'للتجديد تواصل معنا:' : 'To renew, contact us:'}</p>
            <p className="text-brand-400 font-medium mt-1 font-cairo">
              +973 XXXX XXXX
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Warning states — show banner but allow access
  const showWarning =
    (status === 'past_due') ||
    (status === 'trialing' && daysLeft !== null && daysLeft <= 3) ||
    (status === 'active' && daysLeft !== null && daysLeft <= 5);

  return (
    <>
      {showWarning && (
        <div className="bg-orange-950/60 border-b border-orange-800 px-4 py-2.5
                        flex items-center gap-2 text-sm">
          <AlertCircle size={16} className="text-orange-400 flex-shrink-0" />
          <span className="text-orange-300">
            {status === 'past_due'
              ? (isAr ? 'اشتراكك متأخر — يرجى التجديد قريباً' : 'Subscription past due — please renew soon')
              : (isAr
                  ? `ينتهي اشتراكك خلال ${daysLeft} يوم`
                  : `Your subscription expires in ${daysLeft} day(s)`)
            }
          </span>
          <Link href={`/${locale}/dashboard/settings`}
            className="ms-auto text-xs text-orange-400 hover:text-orange-300 whitespace-nowrap">
            {isAr ? 'تجديد' : 'Renew'} →
          </Link>
        </div>
      )}
      {children}
    </>
  );
}
