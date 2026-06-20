'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Download, QrCode, Trash2, ToggleLeft, ToggleRight, Printer } from 'lucide-react';
import QRCode from 'qrcode';
import { createClient } from '@/lib/supabase/client';
import type { Table } from '@/types';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

function QRModal({
  table,
  restaurantSlug,
  locale,
  onClose,
}: {
  table: Table;
  restaurantSlug: string;
  locale: string;
  onClose: () => void;
}) {
  const isAr = locale === 'ar';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://dokan.bh'}/${locale}/r/${restaurantSlug}/t/${table.qr_token}`;

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

    // Create a styled download canvas
    const downloadCanvas = document.createElement('canvas');
    downloadCanvas.width = 400;
    downloadCanvas.height = 500;
    const ctx = downloadCanvas.getContext('2d')!;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.roundRect(0, 0, 400, 500, 20);
    ctx.fill();

    // Draw QR
    ctx.drawImage(canvas, 72, 80, 256, 256);

    // Table name
    ctx.fillStyle = '#0f0e0c';
    ctx.font = 'bold 24px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(isAr ? table.name_ar : table.name_en, 200, 60);

    // "Scan to order" text
    ctx.font = '16px system-ui';
    ctx.fillStyle = '#57534e';
    ctx.fillText(isAr ? 'امسح للطلب' : 'Scan to Order', 200, 375);

    // Dokan branding
    ctx.font = 'bold 18px system-ui';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('دكان · Dokan', 200, 450);

    const link = document.createElement('a');
    link.download = `dokan-qr-${table.name_en.replace(/\s+/g, '-')}.png`;
    link.href = downloadCanvas.toDataURL('image/png');
    link.click();
    toast.success(isAr ? 'تم التحميل' : 'Downloaded');
  };

  const printQR = () => window.print();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 safe-x">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1a1916] border border-[#2a2825] rounded-2xl p-5 sm:p-6
                      w-full max-w-sm max-h-[92dvh] overflow-y-auto overscroll-contain
                      text-center shadow-2xl animate-slide-up safe-bottom">
        <h2 className="font-bold text-[#fafaf9] text-lg mb-1">
          {isAr ? table.name_ar : table.name_en}
        </h2>
        <p className="text-xs text-[#57534e] mb-6 break-all">{url}</p>

        {/* QR Canvas — scales to fit narrow screens */}
        <div className="flex justify-center mb-6">
          <div className="p-3 sm:p-4 bg-[#fafaf9] rounded-2xl inline-block max-w-full">
            <canvas ref={canvasRef} className="block max-w-full h-auto" style={{ width: 'min(220px, 100%)' }} />
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={downloadQR} className="btn-primary flex-1 text-sm">
            <Download size={16} />
            {isAr ? 'تحميل' : 'Download'}
          </button>
          <button onClick={printQR} className="btn-secondary flex-1 text-sm no-print">
            <Printer size={16} />
            {isAr ? 'طباعة' : 'Print'}
          </button>
        </div>

        <button onClick={onClose} className="btn-ghost w-full mt-3 text-sm">
          {isAr ? 'إغلاق' : 'Close'}
        </button>
      </div>
    </div>
  );
}

export default function TablesPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const isAr = locale === 'ar';
  const supabase = createClient();

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantSlug, setRestaurantSlug] = useState('');
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrTable, setQrTable] = useState<Table | null>(null);
  const [adding, setAdding] = useState(false);
  const [newNameEn, setNewNameEn] = useState('');
  const [newNameAr, setNewNameAr] = useState('');

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

  useEffect(() => { load(); }, []);

  const addTable = async () => {
    if (!restaurantId || !newNameEn || !newNameAr) {
      toast.error(isAr ? 'يرجى ملء الاسمين' : 'Fill both names');
      return;
    }
    const { error } = await supabase.from('tables').insert({
      restaurant_id: restaurantId,
      name_en: newNameEn,
      name_ar: newNameAr,
      sort_order: tables.length,
    });
    if (!error) {
      toast.success(isAr ? 'تمت إضافة الطاولة' : 'Table added');
      setAdding(false);
      setNewNameEn('');
      setNewNameAr('');
      load();
    }
  };

  const toggleActive = async (table: Table) => {
    await supabase.from('tables').update({ is_active: !table.is_active }).eq('id', table.id);
    load();
  };

  const deleteTable = async (id: string) => {
    if (!confirm(isAr ? 'حذف الطاولة؟' : 'Delete table?')) return;
    await supabase.from('tables').delete().eq('id', id);
    toast.success(isAr ? 'تم الحذف' : 'Deleted');
    load();
  };

  if (loading) {
    return <div className="p-6 text-[#57534e]">{isAr ? 'جار التحميل...' : 'Loading...'}</div>;
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#fafaf9]">
            {isAr ? 'الطاولات' : 'Tables'}
          </h1>
          <p className="text-sm text-[#57534e]">
            {isAr ? 'أنشئ رموز QR لكل طاولة' : 'Generate QR codes for each table'}
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="btn-primary text-sm"
        >
          <Plus size={16} />
          {isAr ? 'إضافة طاولة' : 'Add Table'}
        </button>
      </div>

      {/* Add table form */}
      {adding && (
        <div className="card space-y-3 animate-slide-up border-brand-500/30">
          <h3 className="font-semibold text-[#fafaf9] text-sm">
            {isAr ? 'طاولة جديدة' : 'New Table'}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{isAr ? 'الاسم (عربي) *' : 'Name (Arabic) *'}</label>
              <input
                className="input text-right font-cairo"
                dir="rtl"
                value={newNameAr}
                onChange={e => setNewNameAr(e.target.value)}
                placeholder={isAr ? 'طاولة 1' : 'طاولة 1'}
              />
            </div>
            <div>
              <label className="label">{isAr ? 'الاسم (إنجليزي) *' : 'Name (English) *'}</label>
              <input
                className="input"
                value={newNameEn}
                onChange={e => setNewNameEn(e.target.value)}
                placeholder="Table 1"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setAdding(false); setNewNameEn(''); setNewNameAr(''); }}
              className="btn-secondary flex-1 text-sm">
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button onClick={addTable} className="btn-primary flex-1 text-sm">
              {isAr ? 'إضافة' : 'Add Table'}
            </button>
          </div>
        </div>
      )}

      {/* Tables grid */}
      {tables.length === 0 ? (
        <div className="card text-center py-16">
          <QrCode size={48} className="text-[#3a3835] mx-auto mb-3" />
          <p className="text-[#a8a29e] font-medium">
            {isAr ? 'لا توجد طاولات بعد' : 'No tables yet'}
          </p>
          <p className="text-sm text-[#57534e] mt-1">
            {isAr
              ? 'أضف طاولات وأنشئ رموز QR للعملاء'
              : 'Add tables and generate QR codes for customers'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tables.map((table) => (
            <div
              key={table.id}
              className={cn(
                'card flex items-center gap-3 transition-all',
                !table.is_active && 'opacity-50'
              )}
            >
              {/* QR preview thumbnail */}
              <div
                className="w-12 h-12 rounded-xl bg-[#fafaf9] flex items-center justify-center
                            flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setQrTable(table)}
              >
                <QrCode size={28} className="text-[#0f0e0c]" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[#fafaf9] text-sm">
                  {isAr ? table.name_ar : table.name_en}
                </div>
                <div className="text-xs text-[#57534e]">
                  {isAr ? table.name_en : table.name_ar}
                </div>
                <div className={cn(
                  'text-xs mt-0.5 font-medium',
                  table.is_active ? 'text-green-400' : 'text-[#57534e]'
                )}>
                  {table.is_active
                    ? (isAr ? 'نشط' : 'Active')
                    : (isAr ? 'غير نشط' : 'Inactive')
                  }
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => setQrTable(table)}
                  className="btn-ghost py-1.5 px-2 text-brand-400 hover:text-brand-300"
                  title={isAr ? 'عرض QR' : 'View QR'}
                >
                  <QrCode size={16} />
                </button>
                <button
                  onClick={() => toggleActive(table)}
                  className="btn-ghost py-1.5 px-2"
                  title={isAr ? 'تفعيل/تعطيل' : 'Toggle active'}
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
          locale={locale}
          onClose={() => setQrTable(null)}
        />
      )}
    </div>
  );
}
