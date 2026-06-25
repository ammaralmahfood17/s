import { createClient } from '@/lib/supabase/server';
import { formatBHD } from '@/lib/utils';
import { TrendingUp } from 'lucide-react';
import type { Payment } from '@/types';

export default async function AdminPaymentsPage() {
  const supabase = createClient();

  const { data: payments } = await supabase
    .from('payments')
    .select(`
      *,
      restaurants(name_en, name_ar, slug)
    `)
    .order('paid_at', { ascending: false })
    .limit(100);

  const rows = payments ?? [];

  // Stats
  const thisMonth = new Date();
  thisMonth.setDate(1); thisMonth.setHours(0,0,0,0);
  const monthlyTotal = rows
    .filter((p: Payment) => new Date(p.paid_at) >= thisMonth)
    .reduce((s: number, p: Payment) => s + Number(p.amount_bhd), 0);

  const allTimeTotal = rows.reduce((s: number, p: Payment) => s + Number(p.amount_bhd), 0);

  const METHOD_BADGE: Record<string, string> = {
    cash:          'badge-confirmed',
    bank_transfer: 'badge-preparing',
    benefit:       'badge-ready',
    other:         'badge-pending',
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#fafaf9]">
          سجل المدفوعات
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="stat-card">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp size={14} className="text-brand-400" />
            <span className="stat-label text-xs">هذا الشهر</span>
          </div>
          <div className="stat-value text-brand-400">{formatBHD(monthlyTotal)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label text-xs mb-1">الإجمالي الكلي</div>
          <div className="stat-value text-purple-400">{formatBHD(allTimeTotal)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label text-xs mb-1">عدد الدفعات</div>
          <div className="stat-value">{rows.length}</div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto table-scroll">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-[#2a2825]">
                {['التاريخ', 'العربة', 'المبلغ', 'طريقة الدفع', 'المرجع', 'الفترة', 'ملاحظات'].map(h => (
                  <th key={h} className="text-start text-xs font-semibold text-[#57534e] px-4 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(rows ?? []).map((p: Payment) => (
                <tr key={p.id} className="border-b border-[#1a1916] hover:bg-[#1a1916] transition-colors">
                  <td className="px-4 py-3 text-xs text-[#a8a29e] whitespace-nowrap">
                    {new Date(p.paid_at).toLocaleDateString('en-BH')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#fafaf9] text-sm">{p.restaurants?.name_ar ?? '—'}</div>
                    <div className="text-xs text-[#57534e] font-mono">{p.restaurants?.slug}</div>
                  </td>
                  <td className="px-4 py-3 font-bold text-brand-400">
                    {formatBHD(p.amount_bhd)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${METHOD_BADGE[p.payment_method] ?? 'badge-pending'}`}>
                      {p.payment_method === 'cash' ? 'نقد' :
                       p.payment_method === 'bank_transfer' ? 'تحويل بنكي' :
                       p.payment_method === 'benefit' ? 'بنفت' : p.payment_method}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#57534e] font-mono">
                    {p.reference ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#57534e] whitespace-nowrap">
                    {new Date(p.period_from).toLocaleDateString('en-BH')} →{' '}
                    {new Date(p.period_to).toLocaleDateString('en-BH')}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#57534e] max-w-[120px] truncate">
                    {p.notes ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {rows.length === 0 && (
            <div className="text-center py-16 text-[#57534e]">
              <p>لا توجد مدفوعات بعد</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
