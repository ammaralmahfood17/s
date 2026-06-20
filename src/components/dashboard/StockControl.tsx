'use client';

import { useState } from 'react';
import { Package, AlertCircle, RotateCcw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Item } from '@/types';

interface Props {
  item: Item & { stock_enabled?: boolean; stock_count?: number | null; sold_out?: boolean };
  locale: string;
  onUpdate: () => void;
}

export function StockControl({ item, locale, onUpdate }: Props) {
  const isAr = locale === 'ar';
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const toggleSoldOut = async () => {
    setLoading(true);
    const newVal = !item.sold_out;
    const { error } = await supabase
      .from('items')
      .update({ sold_out: newVal, is_available: !newVal })
      .eq('id', item.id);

    if (!error) {
      toast.success(
        newVal
          ? (isAr ? 'تم تحديد العنصر كنافذ المخزون' : 'Marked as sold out')
          : (isAr ? 'تم استعادة العنصر' : 'Item restored')
      );
      onUpdate();
    }
    setLoading(false);
  };

  const updateStock = async (count: number) => {
    setLoading(true);
    const { error } = await supabase
      .from('items')
      .update({
        stock_count: count,
        sold_out: count <= 0,
        is_available: count > 0,
      })
      .eq('id', item.id);

    if (!error) {
      toast.success(isAr ? 'تم تحديث المخزون' : 'Stock updated');
      onUpdate();
    }
    setLoading(false);
  };

  const toggleStockTracking = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('items')
      .update({
        stock_enabled: !item.stock_enabled,
        stock_count: !item.stock_enabled ? (item.stock_count ?? 10) : null,
        sold_out: false,
        is_available: true,
      })
      .eq('id', item.id);

    if (!error) onUpdate();
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Sold out badge */}
      {item.sold_out && (
        <span className="text-xs bg-red-950 text-red-400 border border-red-900
                         px-2 py-0.5 rounded-full font-medium">
          {isAr ? 'نفذ' : 'Sold Out'}
        </span>
      )}

      {/* Stock count if tracking enabled */}
      {item.stock_enabled && !item.sold_out && (
        <div className="flex items-center gap-1">
          <Package size={12} className={cn(
            (item.stock_count ?? 0) <= 3 ? 'text-red-400' :
            (item.stock_count ?? 0) <= 10 ? 'text-yellow-400' : 'text-green-400'
          )} />
          <input
            type="number"
            min="0"
            value={item.stock_count ?? ''}
            onChange={e => updateStock(parseInt(e.target.value) || 0)}
            className="w-14 text-xs bg-[#0f0e0c] border border-[#2a2825] rounded-lg
                       px-2 py-1 text-[#fafaf9] focus:outline-none focus:border-brand-500"
            disabled={loading}
          />
        </div>
      )}

      {/* Toggle sold out button */}
      <button
        onClick={toggleSoldOut}
        disabled={loading}
        className={cn(
          'text-xs px-2 py-1 rounded-lg border transition-all',
          item.sold_out
            ? 'bg-green-950 border-green-900 text-green-400 hover:bg-green-900'
            : 'bg-red-950/50 border-red-900/50 text-red-400 hover:bg-red-950'
        )}
        title={item.sold_out
          ? (isAr ? 'استعادة العنصر' : 'Mark as available')
          : (isAr ? 'تحديد كنافذ المخزون' : 'Mark as sold out')
        }
      >
        {item.sold_out
          ? <RotateCcw size={12} />
          : <AlertCircle size={12} />
        }
      </button>
    </div>
  );
}

// ── Quick sold-out toggle for kitchen display ──────────────
export function KitchenStockToggle({
  itemNameEn,
  itemNameAr,
  itemId,
  locale,
}: {
  itemNameEn: string;
  itemNameAr: string;
  itemId: string | null;
  locale: string;
}) {
  const isAr = locale === 'ar';
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  if (!itemId) return null;

  const markSoldOut = async () => {
    if (!confirm(
      isAr
        ? `تحديد "${itemNameAr}" كنافذ المخزون؟`
        : `Mark "${itemNameEn}" as sold out?`
    )) return;

    setLoading(true);
    await supabase
      .from('items')
      .update({ sold_out: true, is_available: false })
      .eq('id', itemId);
    setLoading(false);
    toast.success(isAr ? 'تم تحديد العنصر كنافذ المخزون' : 'Marked as sold out');
  };

  return (
    <button
      onClick={markSoldOut}
      disabled={loading}
      className="text-xs text-[#57534e] hover:text-red-400 transition-colors"
      title={isAr ? 'نفذ المخزون' : 'Mark sold out'}
    >
      <AlertCircle size={11} />
    </button>
  );
}
