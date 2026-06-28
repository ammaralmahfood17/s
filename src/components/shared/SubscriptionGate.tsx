'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { CreditCard, AlertCircle } from 'lucide-react';

interface Props {
  restaurantId: string;
  slug: string;
  children: React.ReactNode;
}

export function SubscriptionGate({ restaurantId, slug, children }: Props) {
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="card max-w-md text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-950/40 border border-red-900
                          flex items-center justify-center mx-auto">
            <CreditCard size={32} className="text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            الاشتراك منتهي
          </h1>
          <p className="text-sm text-muted-foreground">
            انتهى اشتراكك في دكان. يرجى التواصل معنا لتجديد الاشتراك.
          </p>
          <div className="bg-card border border-border rounded-xl p-4 text-sm text-muted-foreground">
            <p>للتجديد تواصل معنا:</p>
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
              ? 'اشتراكك متأخر — يرجى التجديد قريباً'
              : `ينتهي اشتراكك خلال ${daysLeft} يوم`
            }
          </span>
          <Link href={`/${slug}/dashboard/settings`}
            className="ms-auto text-xs text-orange-400 hover:text-orange-300 whitespace-nowrap">
            تجديد →
          </Link>
        </div>
      )}
      {children}
    </>
  );
}
