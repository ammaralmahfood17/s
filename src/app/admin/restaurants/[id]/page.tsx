'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Store, CreditCard, CheckCircle, XCircle,
  Clock, ArrowLeft, ExternalLink, Plus
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatBHD, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Payment, Plan } from '@/types';
import { toast } from 'sonner';

interface PageSubscription {
  id: string;
  status: string;
  plan_id: string;
  current_period_end: string;
  admin_notes: string | null;
  plans?: Plan | null;
}

interface PageRestaurant {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  phone: string | null;
  is_open: boolean;
  subscription_status: string;
}

const STATUS_BADGE: Record<string, string> = {
  active:    'badge-confirmed',
  trialing:  'badge-preparing',
  past_due:  'badge-cancelled',
  cancelled: 'badge-cancelled',
  paused:    'badge-pending',
  free:      'badge-confirmed',
};

export default function AdminRestaurantDetailPage({
  params: { id },
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const supabase = createClient();

  const [restaurant, setRestaurant] = useState<PageRestaurant | null>(null);
  const [subscription, setSubscription] = useState<PageSubscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
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

  const load = useCallback(async () => {
    try {
      const [restRes, subRes, plansRes, payRes] = await Promise.all([
        supabase.from('restaurants').select('*').eq('id', id).single(),
        supabase.from('subscriptions').select('*, plans(*)').eq('restaurant_id', id).order('created_at', { ascending: false }).limit(1),
        supabase.from('plans').select('*').eq('is_active', true),
        supabase.from('payments').select('*').eq('restaurant_id', id).order('paid_at', { ascending: false }),
      ]);

      setRestaurant(restRes.data as PageRestaurant | null);
      const latestSub = subRes.data?.[0] ?? null;
      setSubscription(latestSub as PageSubscription | null);
      setPlans((plansRes.data ?? []) as Plan[]);
      setPayments((payRes.data ?? []) as Payment[]);
    } catch (err) {

      toast.error('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => { load(); }, [load]);

  // Update subscription status manually
  const updateSubStatus = async (status: string) => {
    if (!subscription) {
      toast.error('لا يوجد اشتراك');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status })
        .eq('id', subscription.id);
      if (!error) {
        toast.success('تم تحديث الحالة');
        load();
      } else {
        toast.error('خطأ في تحديث الحالة');
      }
    } catch (err) {

      toast.error('حدث خطأ غير متوقع');
    }
    setSaving(false);
  };

  // Extend subscription
  const extendSubscription = async (months: number) => {
    if (!subscription) {
      toast.error('لا يوجد اشتراك لتمديده');
      return;
    }
    setSaving(true);
    try {
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
        toast.success(`تم التمديد لمدة ${months} شهر`);
        load();
      } else {

        toast.error('خطأ في تمديد الاشتراك');
      }
    } catch (err) {

      toast.error('حدث خطأ غير متوقع');
    }
    setSaving(false);
  };

  // Set free plan (Estikaneh pilot)
  const setFreePlan = async () => {
    if (!subscription) {
      toast.error('لا يوجد اشتراك');
      return;
    }
    setSaving(true);
    try {
      const yearFromNow = new Date();
      yearFromNow.setFullYear(yearFromNow.getFullYear() + 1);

      const freePlan = plans.find(p => p.price_bhd === 0);

      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          plan_id: freePlan?.id ?? subscription.plan_id,
          current_period_end: yearFromNow.toISOString(),
          admin_notes: 'تجربة مجانية — شريك إستكانة',
        })
        .eq('id', subscription.id);

      // Also update restaurant subscription_status
      await supabase.from('restaurants').update({ subscription_status: 'free' }).eq('id', id);

      if (!error) {
        toast.success('🎉 تم التعيين مجاناً لمدة سنة');
        load();
      }
    } catch (err) {

      toast.error('حدث خطأ غير متوقع');
    }
    setSaving(false);
  };

  // Record payment
  const recordPayment = async () => {
    if (!subscription) {
      toast.error('لا يوجد اشتراك. أنشئ اشتراكاً أولاً.');
      return;
    }
    setSaving(true);

    try {
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
        toast.success('✅ تم تسجيل الدفعة وتمديد الاشتراك');
        setPayForm({ amount_bhd: '5.000', payment_method: 'cash', reference: '', notes: '', period_months: '1' });
      } else {
        toast.error('خطأ في تسجيل الدفعة');
      }
    } catch (err) {

      toast.error('حدث خطأ غير متوقع');
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="p-6 text-muted-foreground">جار التحميل...</div>;
  }

  if (!restaurant) {
    return <div className="p-6 text-red-400">العربة غير موجودة</div>;
  }

  const sub = subscription;
  const daysLeft = sub
    ? Math.ceil((new Date(sub.current_period_end).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="p-4 sm:p-6 max-w-4xl space-y-5">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-muted-foreground">
        <ArrowLeft size={16} className="rtl:rotate-180" />
        رجوع
      </button>

      {/* Restaurant header */}
      <div className="card flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-border flex items-center justify-center text-2xl flex-shrink-0">
          🏪
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {restaurant.name_ar}
              </h1>
              <p className="text-sm text-muted-foreground font-mono mt-0.5">/{restaurant.slug}</p>
            </div>
            <a href={`/r/${restaurant.slug}`} target="_blank"
              className="text-muted-foreground hover:text-primary">
              <ExternalLink size={16} />
            </a>
          </div>
          <div className="flex gap-2 mt-2 flex-wrap">
            <span className={`badge ${STATUS_BADGE[restaurant.subscription_status] ?? 'badge-pending'}`}>
              {restaurant.subscription_status}
            </span>
            <span className={`badge ${restaurant.is_open ? 'badge-confirmed' : 'badge-cancelled'}`}>
              {restaurant.is_open ? 'مفتوح' : 'مغلق'}
            </span>
            {restaurant.phone && <span className="text-xs text-muted-foreground">{restaurant.phone}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Subscription status */}
        <div className="card space-y-4">
          <h2 className="section-title">الاشتراك</h2>

          {sub ? (
            <>
              <div className="space-y-2">
                {[
                  { label: 'الخطة', value: sub.plans?.name_ar ?? '—' },
                  { label: 'الحالة', value: sub.status },
                  { label: 'تاريخ الانتهاء', value: new Date(sub.current_period_end).toLocaleDateString('en-BH') },
                  { label: 'الأيام المتبقية', value: daysLeft !== null ? `${daysLeft} يوم` : '—' },
                  { label: 'ملاحظات', value: sub.admin_notes ?? '—' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className={cn('font-medium', row.label === 'الحالة' ? (STATUS_BADGE[row.value] ? 'text-primary' : '') : 'text-foreground')}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Quick status actions */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">تغيير الحالة:</p>
                <div className="flex gap-2 flex-wrap">
                  {['active', 'trialing', 'past_due', 'cancelled', 'paused'].map(s => (
                    <button key={s} onClick={() => updateSubStatus(s)} disabled={saving || sub.status === s}
                      className={cn(
                        'text-xs px-3 min-h-[40px] rounded-lg border transition-all touch-manipulation',
                        sub.status === s
                          ? 'bg-primary/20 border-primary text-primary'
                          : 'border-border text-muted-foreground hover:border-[#3a3835] hover:text-foreground'
                      )}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Extend buttons */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">تمديد الاشتراك:</p>
                <div className="flex gap-2">
                  {[1, 3, 6, 12].map(m => (
                    <button key={m} onClick={() => extendSubscription(m)} disabled={saving}
                      className="btn-secondary text-xs min-h-[40px] py-0 px-3">
                      +{m} شهر
                    </button>
                  ))}
                </div>
              </div>

              {/* Free pilot button */}
              <button onClick={setFreePlan} disabled={saving}
                className="w-full py-2.5 rounded-xl text-sm font-semibold
                           bg-yellow-950/60 border border-yellow-800 text-yellow-400
                           hover:bg-yellow-950 transition-all">
                🎁 تعيين مجاني لمدة سنة (تجربة)
              </button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">لا يوجد اشتراك</p>
          )}
        </div>

        {/* Record payment */}
        <div className="card space-y-4">
          <h2 className="section-title">تسجيل دفعة</h2>

          <div className="space-y-3">
            <div>
              <label className="label">المبلغ (د.ب.)</label>
              <input type="number" step="0.001" className="input"
                value={payForm.amount_bhd}
                onChange={e => setPayForm(f => ({ ...f, amount_bhd: e.target.value }))} />
            </div>

            <div>
              <label className="label">طريقة الدفع</label>
              <select className="input" value={payForm.payment_method}
                onChange={e => setPayForm(f => ({ ...f, payment_method: e.target.value }))}>
                <option value="cash">نقد</option>
                <option value="bank_transfer">تحويل بنكي</option>
                <option value="benefit">بنفت</option>
                <option value="other">أخرى</option>
              </select>
            </div>

            <div>
              <label className="label">رقم المرجع / الإيصال</label>
              <input className="input text-sm" value={payForm.reference}
                onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))}
                placeholder="رقم التحويل، رقم الإيصال..." />
            </div>

            <div>
              <label className="label">التمديد (شهور)</label>
              <select className="input" value={payForm.period_months}
                onChange={e => setPayForm(f => ({ ...f, period_months: e.target.value }))}>
                {[1,2,3,6,12].map(m => (
                  <option key={m} value={m}>{m} شهر{m > 1 ? '' : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">ملاحظات</label>
              <input className="input text-sm" value={payForm.notes}
                onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="ملاحظات اختيارية..." />
            </div>

            <button onClick={recordPayment} disabled={saving} className="btn-primary w-full">
              <Plus size={16} />
              {saving ? 'جار الحفظ...' : 'تسجيل الدفعة والتمديد'}
            </button>
          </div>
        </div>
      </div>

      {/* Payment history */}
      <div className="card">
        <h2 className="section-title">سجل الدفعات</h2>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">لا توجد دفعات مسجلة بعد</p>
        ) : (
          <div className="space-y-2 mt-2">
            {(payments ?? []).map((p: Payment) => (
              <div key={p.id} className="flex items-center gap-3 py-2 border-b border-border">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-foreground font-medium">
                    {formatBHD(p.amount_bhd)} — {p.payment_method}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(p.paid_at).toLocaleDateString('en-BH')}
                    {p.reference && ` · المرجع: ${p.reference}`}
                  </div>
                  {p.notes && <div className="text-xs text-muted-foreground italic">{p.notes}</div>}
                </div>
                <div className="text-xs text-muted-foreground flex-shrink-0">
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
