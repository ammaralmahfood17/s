'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  subscriptionId: string;
  restaurantId: string;
  currentStatus: string;
}

/**
 * Quick inline actions for admin subscription rows.
 * Mark a subscription as paid (+1 month) in one click.
 */
export function AdminQuickActions({ subscriptionId, restaurantId, currentStatus }: Props) {
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const markPaid = async () => {
    if (!confirm('تأكيد تسديد الاشتراك وتمديده شهراً؟')) return;
    setSaving(true);
    try {
      // Get current end date
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('current_period_end')
        .eq('id', subscriptionId)
        .single();

      const currentEnd = sub?.current_period_end
        ? new Date(sub.current_period_end)
        : new Date();

      // If already expired, start from now
      if (currentEnd < new Date()) currentEnd.setTime(Date.now());

      const newEnd = new Date(currentEnd);
      newEnd.setMonth(newEnd.getMonth() + 1);

      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          current_period_end: newEnd.toISOString(),
        })
        .eq('id', subscriptionId);

      if (!error) {
        // Also update restaurant subscription_status
        await supabase
          .from('restaurants')
          .update({ subscription_status: 'active' })
          .eq('id', restaurantId);

        toast.success('✅ تم تسديد الاشتراك وتمديده لشهر');
        // Refresh the page to reflect changes
        window.location.reload();
      } else {
        toast.error('خطأ في تحديث الاشتراك');
      }
    } catch (err) {

      toast.error('حدث خطأ غير متوقع');
    }
    setSaving(false);
  };

  // Only show for non-active subscriptions (expired, past_due, cancelled)
  if (currentStatus === 'active' || currentStatus === 'free') return null;

  return (
    <button
      onClick={markPaid}
      disabled={saving}
      className="inline-flex items-center gap-1 text-xs font-semibold
                 bg-green-950/50 border border-green-800/50 text-green-400
                 hover:bg-green-900 hover:text-green-300
                 px-2.5 py-1.5 rounded-lg transition-all touch-manipulation
                 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <CheckCircle size={12} />
      {saving ? '...' : 'تسديد + شهر'}
    </button>
  );
}
