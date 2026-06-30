'use client';

import { useState } from 'react';
import { Package, AlertCircle, RotateCcw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Item } from '@/types';

interface Props {
  item: Item & { stock_enabled?: boolean; stock_count?: number | null; sold_out?: boolean };
  onUpdate: () => void;
}

export function StockControl({ item, onUpdate }: Props) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const toggleSoldOut = async () => {
    const next = !item.sold_out;
    setLoading(true);
    const res = await fetch('/api/app/stock', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: item.id, sold_out: next, is_available: !next }),
    });

    if (!res.ok) {
      toast.error('حدث خطأ');
    } else {
      toast.success(next ? 'تم تحديد العنصر كنافذ المخزون' : 'تم إعادة تفعيل العنصر');
      onUpdate();
    }
    setLoading(false);
  };

  const updateStock = async (count: number) => {
    setLoading(true);
    const res = await fetch('/api/app/stock', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: item.id, stock_count: count, stock_enabled: true }),
    });

    if (!res.ok) {
      toast.error('حدث خطأ');
    } else {
      toast.success('تم تحديث المخزون');
      onUpdate();
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-2">
      {item.sold_out && (
        <span className="text-xs bg-red-950 text-red-400 px-2 py-0.5 rounded-full font-medium">
          نافذ المخزون
        </span>
      )}
      {item.stock_enabled && item.stock_count != null && !item.sold_out && (
        <span className={cn(
          'text-xs px-2 py-0.5 rounded-full font-medium',
          item.stock_count <= 0 ? 'bg-red-950 text-red-400' :
          item.stock_count <= 5 ? 'bg-yellow-950 text-yellow-400' :
          'bg-green-950 text-green-400'
        )}>
          {item.stock_count === 0 ? 'نفذ' : `${item.stock_count} متبقي`}
        </span>
      )}
      <button
        onClick={toggleSoldOut}
        disabled={loading}
        className={cn(
          'text-xs px-2 py-1 rounded-lg transition-colors touch-manipulation',
          item.sold_out
            ? 'bg-green-900/40 text-green-400 hover:bg-green-800/40'
            : 'bg-red-900/40 text-red-400 hover:bg-red-800/40'
        )}
      >
        {item.sold_out ? 'إعادة تفعيل' : 'نفذ المخزون'}
      </button>
    </div>
  );
}

// ── Quick "sold out" toggle for the kitchen display ──
export function KitchenStockToggle({
  itemNameAr,
  itemId,
}: {
  itemNameAr: string;
  itemId: string | null;
}) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  if (!itemId) return null;

  const markSoldOut = async () => {
    if (!confirm(`تحديد "${itemNameAr}" كنافذ المخزون؟`)) return;

    setLoading(true);
    await fetch('/api/app/stock', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: itemId, sold_out: true, is_available: false }),
    });
    setLoading(false);
    toast.success('تم تحديد العنصر كنافذ المخزون');
  };

  return (
    <button
      onClick={markSoldOut}
      disabled={loading}
      className="text-xs text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-950
                 px-2 py-1 rounded-lg transition-all touch-manipulation"
    >
      {loading ? '...' : 'نفذ المخزون'}
    </button>
  );
}
