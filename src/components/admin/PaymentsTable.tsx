'use client';

import { useState, useMemo } from 'react';
import { formatBHD } from '@/lib/utils';
import { TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';

const METHOD_BADGE: Record<string, string> = {
  cash:          'badge-confirmed',
  bank_transfer: 'badge-preparing',
  benefit:       'badge-ready',
  other:         'badge-pending',
};

const METHOD_LABEL: Record<string, string> = {
  cash:          'نقد',
  bank_transfer: 'تحويل بنكي',
  benefit:       'بنفت',
  other:         'أخرى',
};

const PER_PAGE = 25;
export default function PaymentsTable({ rows }: { rows: Record<string, any>[] }) {
  const [page, setPage] = useState(1);
  // Stats computed from ALL rows
  const stats = useMemo(() => {
    const thisMonth = new Date();
    thisMonth.setDate(1); thisMonth.setHours(0, 0, 0, 0);
    const monthlyTotal = rows
      .filter((p: any) => new Date(p.paid_at) >= thisMonth)
      .reduce((s: number, p: any) => s + Number(p.amount_bhd), 0);
    const allTimeTotal = rows.reduce((s: number, p: any) => s + Number(p.amount_bhd), 0);
    return { monthlyTotal, allTimeTotal, count: rows.length };
  }, [rows]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = rows.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  return (
    <div className="p-4 sm:p-6 max-w-6xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">
          سجل المدفوعات
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="stat-card">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp size={14} className="text-primary" />
            <span className="stat-label text-xs">هذا الشهر</span>
          </div>
          <div className="stat-value text-primary">{formatBHD(stats.monthlyTotal)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label text-xs mb-1">الإجمالي الكلي</div>
          <div className="stat-value text-foreground">{formatBHD(stats.allTimeTotal)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label text-xs mb-1">عدد الدفعات</div>
          <div className="stat-value">{stats.count}</div>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="block md:hidden space-y-2">
        {paginated.map((p: any) => (
          <div key={p.id} className="card-hover">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-primary">{formatBHD(p.amount_bhd)}</span>
              <span className={`badge ${METHOD_BADGE[p.payment_method] ?? 'badge-pending'}`}>
                {METHOD_LABEL[p.payment_method] ?? p.payment_method}
              </span>
            </div>
            <div className="text-sm text-foreground font-medium">
              {p.restaurants?.name_ar ?? '—'}
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>{new Date(p.paid_at).toLocaleDateString('en-BH')}</span>
              {p.reference && <span className="font-mono">#{p.reference}</span>}
            </div>
            {p.notes && (
              <div className="mt-1 text-xs text-muted-foreground truncate">
                {p.notes}
              </div>
            )}
          </div>
        ))}

        {paginated.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p>لا توجد مدفوعات بعد</p>
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="card overflow-hidden p-0 hidden md:block">
        <div className="overflow-x-auto table-scroll">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-border">
                {['التاريخ', 'العربة', 'المبلغ', 'طريقة الدفع', 'المرجع', 'الفترة', 'ملاحظات'].map(h => (
                  <th key={h} className="text-start text-xs font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((p: any) => (
                <tr key={p.id} className="border-b border-border hover:bg-card transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(p.paid_at).toLocaleDateString('en-BH')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground text-sm">{p.restaurants?.name_ar ?? '—'}</div>
                    <div className="text-xs text-muted-foreground font-mono">{p.restaurants?.slug}</div>
                  </td>
                  <td className="px-4 py-3 font-bold text-primary">
                    {formatBHD(p.amount_bhd)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${METHOD_BADGE[p.payment_method] ?? 'badge-pending'}`}>
                      {METHOD_LABEL[p.payment_method] ?? p.payment_method}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                    {p.reference ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(p.period_from).toLocaleDateString('en-BH')} →{' '}
                    {new Date(p.period_to).toLocaleDateString('en-BH')}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[120px] truncate">
                    {p.notes ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {rows.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <p>لا توجد مدفوعات بعد</p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-xs text-muted-foreground">
            الصفحة {safePage} من {totalPages} · {rows.length} دفعة
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="p-2 rounded-lg border border-border hover:bg-card disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(safePage - 2, totalPages - 4));
              const num = start + i;
              if (num > totalPages) return null;
              return (
                <button
                  key={num}
                  onClick={() => setPage(num)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                    num === safePage
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border hover:bg-card text-muted-foreground'
                  }`}
                >
                  {num}
                </button>
              );
            })}

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="p-2 rounded-lg border border-border hover:bg-card disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
