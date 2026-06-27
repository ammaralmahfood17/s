'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Download, QrCode, Trash2, ToggleLeft, ToggleRight, Printer, Car } from 'lucide-react';
import QRCode from 'qrcode';
import { createClient } from '@/lib/supabase/client';
import type { Table } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

function QRModal({
  table,
  restaurantSlug,
  onClose,
}: {
  table: Table;
  restaurantSlug: string;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://dokanstore.xyz'}/${restaurantSlug}/t/${table.qr_token}`;
  const isDriveThru = table.name_en === 'Drive Thru';

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 256,
        margin: 2,
        color: { dark: '#0f0e0c', light: '#fafaf9' },
      });
    }
  }, [url]);

  const downloadQR = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const downloadCanvas = document.createElement('canvas');
    downloadCanvas.width = 400;
    downloadCanvas.height = 500;
    const ctx = downloadCanvas.getContext('2d')!;

    ctx.fillStyle = '#ffffff';
    ctx.roundRect(0, 0, 400, 500, 20);
    ctx.fill();

    ctx.drawImage(canvas, 72, 80, 256, 256);

    ctx.fillStyle = '#0f0e0c';
    ctx.font = 'bold 24px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(table.name_ar, 200, 60);

    ctx.font = '16px system-ui';
    ctx.fillStyle = '#57534e';
    ctx.fillText(isDriveThru ? 'اطلب من السيارة' : 'امسح للطلب', 200, 375);

    ctx.font = 'bold 18px system-ui';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('دكان', 200, 450);

    const link = document.createElement('a');
    link.download = `dokan-qr-${table.name_en.replace(/\s+/g, '-')}.png`;
    link.href = downloadCanvas.toDataURL('image/png');
    link.click();
    toast.success('تم التحميل');
  };

  const printQR = () => window.print();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 safe-x">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1a1916] border border-[#2a2825] rounded-2xl p-5 sm:p-6
                      w-full max-w-sm max-h-[92dvh] overflow-y-auto overscroll-contain
                      text-center shadow-2xl animate-slide-up safe-bottom">
        <h2 className="font-bold text-[#fafaf9] text-lg mb-1">
          {table.name_ar}
        </h2>
        {isDriveThru && (
          <div className="inline-flex items-center gap-1 text-xs text-brand-400 bg-brand-500/10
                          px-2 py-0.5 rounded-full mb-2">
            <Car size={12} />
            طلب سيارات
          </div>
        )}
        <p className="text-xs text-[#57534e] mb-6 break-all">{url}</p>

        <div className="flex justify-center mb-6">
          <div className="p-3 sm:p-4 bg-[#fafaf9] rounded-2xl inline-block max-w-full">
            <canvas ref={canvasRef} className="block max-w-full h-auto" style={{ width: 'min(220px, 100%)' }} />
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={downloadQR} className="btn-primary flex-1 text-sm">
            <Download size={16} />
            تحميل
          </button>
          <button onClick={printQR} className="btn-secondary flex-1 text-sm no-print">
            <Printer size={16} />
            طباعة
          </button>
        </div>

        <button onClick={onClose} className="btn-ghost w-full mt-3 text-sm">
          إغلاق
        </button>
      </div>
    </div>
  );
}

export default function TablesPage() {
  const supabase = createClient();

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantSlug, setRestaurantSlug] = useState('');
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrTable, setQrTable] = useState<Table | null>(null);
  const [adding, setAdding] = useState(false);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: r } = await supabase
      .from('restaurants')
      .select('id, slug')
      .eq('owner_id', user.id)
      .single();
    if (!r) return;
    setRestaurantId(r.id);
    setRestaurantSlug(r.slug);

    const { data: tbls } = await supabase
      .from('tables')
      .select('*')
      .eq('restaurant_id', r.id)
      .order('sort_order');
    setTables(tbls ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [load]);

  const addTable = async () => {
    if (!restaurantId) return;

    // Count only non-Drive-Thru tables
    const tableCount = tables.filter(t => t.name_en !== 'Drive Thru').length + 1;

    const { error } = await supabase.from('tables').insert({
      restaurant_id: restaurantId,
      name_en: `Table ${tableCount}`,
      name_ar: `طاولة ${tableCount}`,
      sort_order: tables.length,
    });
    if (!error) {
      toast.success('تمت إضافة الطاولة');
      setAdding(false);
      load();
    } else {
      toast.error('حدث خطأ');
    }
  };

  const toggleActive = async (table: Table) => {
    await supabase.from('tables').update({ is_active: !table.is_active }).eq('id', table.id);
    load();
  };

  const deleteTable = async (id: string) => {
    if (!confirm('حذف الطاولة؟')) return;
    await supabase.from('tables').delete().eq('id', id);
    toast.success('تم الحذف');
    load();
  };

  if (loading) {
    return <div className="p-6 text-[#57534e]">جار التحميل...</div>;
  }

  // Separate Drive Thru from regular tables
  const driveThruTable = tables.find(t => t.name_en === 'Drive Thru');
  const regularTables = tables.filter(t => t.name_en !== 'Drive Thru');

  return (
    <div className="p-4 sm:p-6 max-w-3xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#fafaf9]">
            الطاولات
          </h1>
          <p className="text-sm text-[#57534e]">
            أنشئ رموز QR لكل طاولة
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="btn-primary text-sm"
        >
          <Plus size={16} />
          إضافة طاولة
        </button>
      </div>

      {/* Drive Thru card */}
      {driveThruTable && (
        <div className="card border-brand-500/30 bg-brand-500/5 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center flex-shrink-0">
            <Car size={24} className="text-brand-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[#fafaf9] text-sm flex items-center gap-2">
              طلب سيارات (Drive Thru)
              <span className="text-xs bg-brand-500/20 text-brand-400 px-1.5 py-0.5 rounded-full">افتراضي</span>
            </div>
            <div className="text-xs text-[#57534e]">
              الرابط: {process.env.NEXT_PUBLIC_APP_URL ?? 'https://dokanstore.xyz'}/{restaurantSlug}/t/{driveThruTable.qr_token}
            </div>
          </div>
          <button
            onClick={() => setQrTable(driveThruTable)}
            className="btn-ghost py-1.5 px-2 text-brand-400 hover:text-brand-300"
          >
            <QrCode size={16} />
          </button>
        </div>
      )}

      {/* Add table trigger */}
      {adding && (
        <div className="card space-y-3 animate-slide-up border-brand-500/30">
          <h3 className="font-semibold text-[#fafaf9] text-sm">
            طاولة جديدة
          </h3>
          <p className="text-xs text-[#57534e]">
            سيتم إنشاء طاولة {regularTables.length + 1} تلقائياً
          </p>
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)}
              className="btn-secondary flex-1 text-sm">
              إلغاء
            </button>
            <button onClick={addTable} className="btn-primary flex-1 text-sm">
              إضافة طاولة {regularTables.length + 1}
            </button>
          </div>
        </div>
      )}

      {/* Regular tables */}
      {regularTables.length === 0 ? (
        <div className="card text-center py-16">
          <QrCode size={48} className="text-[#3a3835] mx-auto mb-3" />
          <p className="text-[#a8a29e] font-medium">
            لا توجد طاولات بعد
          </p>
          <p className="text-sm text-[#57534e] mt-1">
            أضف طاولات وأنشئ رموز QR للعملاء
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {regularTables.map((table) => (
            <div
              key={table.id}
              className={cn(
                'card flex items-center gap-3 transition-all',
                !table.is_active && 'opacity-50'
              )}
            >
              <div
                className="w-12 h-12 rounded-xl bg-[#fafaf9] flex items-center justify-center
                            flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setQrTable(table)}
              >
                <QrCode size={28} className="text-[#0f0e0c]" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[#fafaf9] text-sm">
                  {table.name_ar}
                </div>
                <div className={cn(
                  'text-xs mt-0.5 font-medium',
                  table.is_active ? 'text-green-400' : 'text-[#57534e]'
                )}>
                  {table.is_active ? 'نشط' : 'غير نشط'}
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => setQrTable(table)}
                  className="btn-ghost py-1.5 px-2 text-brand-400 hover:text-brand-300"
                  title="عرض QR"
                >
                  <QrCode size={16} />
                </button>
                <button
                  onClick={() => toggleActive(table)}
                  className="btn-ghost py-1.5 px-2"
                  title="تفعيل/تعطيل"
                >
                  {table.is_active
                    ? <ToggleRight size={18} className="text-green-400" />
                    : <ToggleLeft size={18} className="text-[#57534e]" />
                  }
                </button>
                <button
                  onClick={() => deleteTable(table.id)}
                  className="btn-ghost py-1.5 px-2 text-red-400 hover:text-red-300"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Modal */}
      {qrTable && (
        <QRModal
          table={qrTable}
          restaurantSlug={restaurantSlug}
          onClose={() => setQrTable(null)}
        />
      )}
    </div>
  );
}
