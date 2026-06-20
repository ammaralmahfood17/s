'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Store, CreditCard, CheckCircle, XCircle,
  Clock, ArrowLeft, ExternalLink, Plus
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatBHD, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUS_BADGE: Record<string, string> = {
  active:    'badge-confirmed',
  trialing:  'badge-preparing',
  past_due:  'badge-cancelled',
  cancelled: 'badge-cancelled',
  paused:    'badge-pending',
  free:      'badge-confirmed',
};

export default function AdminRestaurantDetailPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  const isAr = locale === 'ar';
  const router = useRouter();
  const supabase = createClient();

  const [restaurant, setRestaurant] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Payment form
  const [payForm, setPayForm] = useState({
    amount_bhd: '5.000',
    payment_method: 'cash',
    reference: '',
    notes: '',
    period_months: '1',
  });

  const load = async () => {
    const [restRes, plansRes, payRes] = await Promise.all([
      supabase.from('restaurants').select(`
        *, subscriptions(*, plans(*))
      `).eq('id', id).single(),
      supabase.from('plans').select('*').eq('is_active', true),
      supabase.from('payments').select('*').eq('restaurant_id', id).order('paid_at', { ascending: false }),
    ]);

    setRestaurant(restRes.data);
    setSubscription(restRes.data?.subscriptions?.[0] ?? null);
    setPlans(plansRes.data ?? []);
    setPayments(payRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  // Update subscription status manually
  const updateSubStatus = async (status: string) => {
    if (!subscription) return;
    setSaving(true);
    const { error } = await supabase
      .from('subscriptions')
      .update({ status })
      .eq('id', subscription.id);
    if (!error) {
      toast.success(`Status updated to ${status}`);
      load();
    } else {
      toast.error('Error updating status');
    }
    setSaving(false);
  };

  // Extend subscription
  const extendSubscription = async (months: number) => {
    if (!subscription) return;
    setSaving(true);
    const currentEnd = new Date(subscription.current_period_end);
    const newEnd = new Date(currentEnd);
    newEnd.setMonth(newEnd.getMonth() + months);

    const { error } = await supabase
      .from('subscriptions')
      .update({
        current_period_end: newEnd.toISOString(),
        status: 'active',
      })
      .eq('id', subscription.id);

    if (!error) {
      toast.success(`Extended by ${months} month(s)`);
      load();
    }
    setSaving(false);
  };

  // Set free plan (Estikaneh pilot)
  const setFreePlan = async () => {
    if (!subscription) return;
    setSaving(true);
    const yearFromNow = new Date();
    yearFromNow.setFullYear(yearFromNow.getFullYear() + 1);

    const freePlan = plans.find(p => p.price_bhd === 0);

    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        plan_id: freePlan?.id ?? subscription.plan_id,
        current_period_end: yearFromNow.toISOString(),
        admin_notes: 'Free pilot — Estikaneh partner',
      })
      .eq('id', subscription.id);

    // Also update restaurant subscription_status
    await supabase.from('restaurants').update({ subscription_status: 'free' }).eq('id', id);

    if (!error) {
      toast.success('🎉 Set to FREE for 1 year');
      load();
    }
    setSaving(false);
  };

  // Record payment
  const recordPayment = async () => {
    if (!subscription) return;
    setSaving(true);

    const periodFrom = new Date(subscription.current_period_end);
    const periodTo = new Date(periodFrom);
    periodTo.setMonth(periodTo.getMonth() + parseInt(payForm.period_months));

    const { data: { user } } = await supabase.auth.getUser();

    const { error: payError } = await supabase.from('payments').insert({
      subscription_id: subscription.id,
      restaurant_id: id,
      amount_bhd: parseFloat(payForm.amount_bhd),
      payment_method: payForm.payment_method,
      reference: payForm.reference || null,
      notes: payForm.notes || null,
      period_from: periodFrom.toISOString(),
      period_to: periodTo.toISOString(),
      recorded_by: user?.id,
    });

    if (!payError) {
      // Extend subscription
      await extendSubscription(parseInt(payForm.period_months));
      toast.success('✅ Payment recorded & subscription extended');
      setPayForm({ amount_bhd: '5.000', payment_method: 'cash', reference: '', notes: '', period_months: '1' });
    } else {
      toast.error('Error recording payment');
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="p-6 text-[#57534e]">Loading...</div>;
  }

  if (!restaurant) {
    return <div className="p-6 text-red-400">Restaurant not found</div>;
  }

  const sub = subscription;
  const daysLeft = sub
    ? Math.ceil((new Date(sub.current_period_end).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="p-4 sm:p-6 max-w-4xl space-y-5">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-[#57534e] hover:text-[#a8a29e]">
        <ArrowLeft size={16} className="rtl:rotate-180" />
        {isAr ? 'رجوع' : 'Back'}
      </button>

      {/* Restaurant header */}
      <div className="card flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#2a2825] flex items-center justify-center text-2xl flex-shrink-0">
          🏪
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold text-[#fafaf9]">
                {isAr ? restaurant.name_ar : restaurant.name_en}
              </h1>
              <p className="text-sm text-[#57534e] font-mono mt-0.5">/{restaurant.slug}</p>
            </div>
            <a href={`/${locale}/r/${restaurant.slug}`} target="_blank"
              className="text-[#57534e] hover:text-brand-400">
              <ExternalLink size={16} />
            </a>
          </div>
          <div className="flex gap-2 mt-2 flex-wrap">
            <span className={`badge ${STATUS_BADGE[restaurant.subscription_status] ?? 'badge-pending'}`}>
              {restaurant.subscription_status}
            </span>
            <span className={`badge ${restaurant.is_open ? 'badge-confirmed' : 'badge-cancelled'}`}>
              {restaurant.is_open ? 'Open' : 'Closed'}
            </span>
            {restaurant.phone && <span className="text-xs text-[#57534e]">{restaurant.phone}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Subscription status */}
        <div className="card space-y-4">
          <h2 className="section-title">Subscription</h2>

          {sub ? (
            <>
              <div className="space-y-2">
                {[
                  { label: 'Plan', value: sub.plans?.name_en ?? '—' },
                  { label: 'Status', value: sub.status },
                  { label: 'Period End', value: new Date(sub.current_period_end).toLocaleDateString('en-BH') },
                  { label: 'Days Left', value: daysLeft !== null ? `${daysLeft} days` : '—' },
                  { label: 'Admin Notes', value: sub.admin_notes ?? '—' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span className="text-[#57534e]">{row.label}</span>
                    <span className={cn('font-medium', row.label === 'Status' ? (STATUS_BADGE[row.value] ? 'text-brand-400' : '') : 'text-[#fafaf9]')}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Quick status actions */}
              <div>
                <p className="text-xs text-[#57534e] mb-2">Change status:</p>
                <div className="flex gap-2 flex-wrap">
                  {['active', 'trialing', 'past_due', 'cancelled', 'paused'].map(s => (
                    <button key={s} onClick={() => updateSubStatus(s)} disabled={saving || sub.status === s}
                      className={cn(
                        'text-xs px-3 min-h-[40px] rounded-lg border transition-all touch-manipulation',
                        sub.status === s
                          ? 'bg-brand-500/20 border-brand-500 text-brand-400'
                          : 'border-[#2a2825] text-[#57534e] hover:border-[#3a3835] hover:text-[#fafaf9]'
                      )}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Extend buttons */}
              <div>
                <p className="text-xs text-[#57534e] mb-2">Extend subscription:</p>
                <div className="flex gap-2">
                  {[1, 3, 6, 12].map(m => (
                    <button key={m} onClick={() => extendSubscription(m)} disabled={saving}
                      className="btn-secondary text-xs min-h-[40px] py-0 px-3">
                      +{m}mo
                    </button>
                  ))}
                </div>
              </div>

              {/* Free pilot button */}
              <button onClick={setFreePlan} disabled={saving}
                className="w-full py-2.5 rounded-xl text-sm font-semibold
                           bg-yellow-950/60 border border-yellow-800 text-yellow-400
                           hover:bg-yellow-950 transition-all">
                🎁 Set FREE for 1 Year (Pilot)
              </button>
            </>
          ) : (
            <p className="text-sm text-[#57534e]">No subscription found</p>
          )}
        </div>

        {/* Record payment */}
        <div className="card space-y-4">
          <h2 className="section-title">Record Payment</h2>

          <div className="space-y-3">
            <div>
              <label className="label">Amount (BHD)</label>
              <input type="number" step="0.001" className="input"
                value={payForm.amount_bhd}
                onChange={e => setPayForm(f => ({ ...f, amount_bhd: e.target.value }))} />
            </div>

            <div>
              <label className="label">Payment Method</label>
              <select className="input" value={payForm.payment_method}
                onChange={e => setPayForm(f => ({ ...f, payment_method: e.target.value }))}>
                <option value="cash">Cash نقد</option>
                <option value="bank_transfer">Bank Transfer تحويل</option>
                <option value="benefit">Benefit بنفت</option>
                <option value="other">Other أخرى</option>
              </select>
            </div>

            <div>
              <label className="label">Reference / Receipt #</label>
              <input className="input text-sm" value={payForm.reference}
                onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))}
                placeholder="Transfer ref, receipt no..." />
            </div>

            <div>
              <label className="label">Extend by (months)</label>
              <select className="input" value={payForm.period_months}
                onChange={e => setPayForm(f => ({ ...f, period_months: e.target.value }))}>
                {[1,2,3,6,12].map(m => (
                  <option key={m} value={m}>{m} month{m > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Notes</label>
              <input className="input text-sm" value={payForm.notes}
                onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes..." />
            </div>

            <button onClick={recordPayment} disabled={saving} className="btn-primary w-full">
              <Plus size={16} />
              {saving ? 'Saving...' : 'Record Payment & Extend'}
            </button>
          </div>
        </div>
      </div>

      {/* Payment history */}
      <div className="card">
        <h2 className="section-title">Payment History</h2>
        {payments.length === 0 ? (
          <p className="text-sm text-[#57534e] py-4 text-center">No payments recorded yet</p>
        ) : (
          <div className="space-y-2 mt-2">
            {payments.map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 py-2 border-b border-[#1a1916]">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[#fafaf9] font-medium">
                    {formatBHD(p.amount_bhd, 'en')} — {p.payment_method}
                  </div>
                  <div className="text-xs text-[#57534e]">
                    {new Date(p.paid_at).toLocaleDateString('en-BH')}
                    {p.reference && ` · Ref: ${p.reference}`}
                  </div>
                  {p.notes && <div className="text-xs text-[#57534e] italic">{p.notes}</div>}
                </div>
                <div className="text-xs text-[#57534e] flex-shrink-0">
                  {new Date(p.period_from).toLocaleDateString('en-BH')} →{' '}
                  {new Date(p.period_to).toLocaleDateString('en-BH')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
