'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { generateSlug, getPublicImageUrl } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Upload, Globe, Save, Plus, Clock, PauseCircle } from 'lucide-react';
import NextImage from 'next/image';
import { GOVERNORATES, type GovernorateKey } from '@/types';
import { OpeningHoursEditor, parseHours, type WeekHours } from '@/components/shared/OpeningHours';
import { PauseOrderingControl } from '@/components/dashboard/PauseOrdering';
import { RestaurantSwitcher } from '@/components/dashboard/RestaurantSwitcher';
import type { Restaurant } from '@/types';
import toast from 'react-hot-toast';

export default function SettingsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const isAr = locale === 'ar';
  const supabase = createClient();
  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'basic'|'hours'|'ordering'>('basic');

  const [form, setForm] = useState({
    name_en: '', name_ar: '',
    slug: '',
    description_en: '', description_ar: '',
    phone: '',
    address_en: '', address_ar: '',
    governorate: 'Capital' as GovernorateKey,
    is_open: true,
    logo_url: '',
    cover_url: '',
    prep_time_minutes: 15,
    opening_hours: {} as WeekHours,
  });

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: r } = await supabase
      .from('restaurants').select('*').eq('owner_id', user.id).single();
    if (r) {
      setRestaurant(r);
      setForm({
        name_en: r.name_en ?? '',
        name_ar: r.name_ar ?? '',
        slug: r.slug ?? '',
        description_en: r.description_en ?? '',
        description_ar: r.description_ar ?? '',
        phone: r.phone ?? '',
        address_en: r.address_en ?? '',
        address_ar: r.address_ar ?? '',
        governorate: r.governorate ?? 'Capital',
        is_open: r.is_open,
        logo_url: r.logo_url ?? '',
        cover_url: r.cover_url ?? '',
        prep_time_minutes: r.prep_time_minutes ?? 15,
        opening_hours: parseHours(r.opening_hours),
      });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const uploadImage = async (file: File, bucket: string, field: 'logo_url'|'cover_url') => {
    const ext = file.name.split('.').pop();
    const path = `${field}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (!error) {
      setForm(f => ({ ...f, [field]: path }));
      toast.success(isAr ? 'تم رفع الصورة' : 'Uploaded');
    } else {
      toast.error(isAr ? 'فشل الرفع' : 'Upload failed');
    }
  };

  const handleSave = async () => {
    if (!form.name_en || !form.name_ar || !form.slug) {
      toast.error(isAr ? 'يرجى ملء الحقول المطلوبة' : 'Fill required fields');
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      name_en: form.name_en, name_ar: form.name_ar, slug: form.slug,
      description_en: form.description_en, description_ar: form.description_ar,
      phone: form.phone, address_en: form.address_en, address_ar: form.address_ar,
      governorate: form.governorate, is_open: form.is_open,
      logo_url: form.logo_url, cover_url: form.cover_url,
      prep_time_minutes: form.prep_time_minutes,
      opening_hours: form.opening_hours,
    };

    if (restaurant) {
      const { error } = await supabase.from('restaurants').update(payload).eq('id', restaurant.id);
      if (error) toast.error(isAr ? 'حدث خطأ' : 'Error saving');
      else { toast.success(isAr ? 'تم الحفظ' : 'Saved'); load(); }
    } else {
      const { error } = await supabase.from('restaurants').insert({ ...payload, owner_id: user.id });
      if (error) {
        toast.error(error.message.includes('slug')
          ? (isAr ? 'الرابط مستخدم بالفعل' : 'Slug already taken')
          : (isAr ? 'حدث خطأ' : 'Error'));
      } else {
        toast.success(isAr ? 'تم إنشاء المطعم!' : 'Restaurant created!');
        load();
      }
    }
    setSaving(false);
  };

  if (loading) return <div className="p-6 text-[#57534e]">{isAr ? 'جار التحميل...' : 'Loading...'}</div>;

  const sections = [
    { key: 'basic',    labelEn: 'Basic Info',    labelAr: 'معلومات أساسية' },
    { key: 'hours',    labelEn: 'Opening Hours',  labelAr: 'ساعات العمل' },
    { key: 'ordering', labelEn: 'Ordering',        labelAr: 'الطلبات' },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-2xl space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#fafaf9]">
          {isAr ? 'إعدادات المطعم' : 'Restaurant Settings'}
        </h1>
      </div>

      {/* Multi-restaurant switcher (shows if user has 2+) */}
      {restaurant && (
        <div className="card py-2 px-0">
          <RestaurantSwitcher currentRestaurantId={restaurant.id} locale={locale} />
        </div>
      )}

      {/* Open/Closed */}
      {restaurant && (
        <div className="card flex items-center justify-between">
          <div>
            <div className="font-medium text-[#fafaf9] text-sm">{isAr ? 'حالة المطعم' : 'Restaurant Status'}</div>
            <div className={`text-xs mt-0.5 ${form.is_open ? 'text-green-400' : 'text-red-400'}`}>
              {form.is_open ? (isAr ? 'مفتوح — العملاء يمكنهم الطلب' : 'Open — customers can order') : (isAr ? 'مغلق' : 'Closed')}
            </div>
          </div>
          <div onClick={() => setForm(f => ({ ...f, is_open: !f.is_open }))}
            className={cn('w-12 h-6 rounded-full cursor-pointer transition-colors relative', form.is_open ? 'bg-green-500' : 'bg-[#2a2825]')}>
            <span className={cn('absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow', form.is_open ? 'translate-x-7' : 'translate-x-1')} />
          </div>
        </div>
      )}

      {/* Section tabs */}
      <div className="flex gap-1">
        {sections.map(s => (
          <button key={s.key} onClick={() => setActiveSection(s.key as 'basic'|'hours'|'ordering')}
            className={cn('flex-1 py-2 rounded-xl text-sm font-medium transition-all',
              activeSection === s.key ? 'bg-brand-500 text-[#0f0e0c]' : 'text-[#a8a29e] hover:text-[#fafaf9] bg-[#1a1916]')}>
            {isAr ? s.labelAr : s.labelEn}
          </button>
        ))}
      </div>

      {/* ── BASIC INFO ── */}
      {activeSection === 'basic' && (
        <div className="space-y-4">
          {/* Images */}
          <div className="card space-y-4">
            <h2 className="section-title">{isAr ? 'الصور' : 'Images'}</h2>
            {/* Cover */}
            <div>
              <label className="label">{isAr ? 'صورة الغلاف' : 'Cover Image'}</label>
              <div onClick={() => coverRef.current?.click()}
                className="relative h-32 rounded-xl border-2 border-dashed border-[#2a2825] overflow-hidden cursor-pointer hover:border-brand-500/50 transition-colors">
                {form.cover_url ? (
                  <NextImage src={getPublicImageUrl(form.cover_url,'restaurant-assets')} alt="cover" fill className="object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <Upload size={24} className="text-[#3a3835]" />
                    <span className="text-xs text-[#57534e]">{isAr ? 'انقر لرفع الغلاف' : 'Click to upload cover'}</span>
                  </div>
                )}
              </div>
              <input ref={coverRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f=e.target.files?.[0];if(f)uploadImage(f,'restaurant-assets','cover_url'); }} />
            </div>
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div onClick={() => logoRef.current?.click()}
                className="w-16 h-16 rounded-xl border-2 border-dashed border-[#2a2825] overflow-hidden cursor-pointer hover:border-brand-500/50 transition-colors flex items-center justify-center flex-shrink-0">
                {form.logo_url ? (
                  <NextImage src={getPublicImageUrl(form.logo_url,'restaurant-assets')} alt="logo" width={64} height={64} className="object-cover w-full h-full" />
                ) : <Upload size={20} className="text-[#3a3835]" />}
              </div>
              <div>
                <div className="text-sm text-[#a8a29e]">{isAr ? 'شعار المطعم' : 'Restaurant Logo'}</div>
                <div className="text-xs text-[#57534e]">{isAr ? 'انقر لرفع الشعار' : 'Click to upload'}</div>
              </div>
              <input ref={logoRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f=e.target.files?.[0];if(f)uploadImage(f,'restaurant-assets','logo_url'); }} />
            </div>
          </div>

          {/* Names */}
          <div className="card space-y-4">
            <h2 className="section-title">{isAr ? 'معلومات أساسية' : 'Basic Info'}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{isAr ? 'الاسم (عربي) *' : 'Name (Arabic) *'}</label>
                <input className="input text-right font-cairo" dir="rtl" value={form.name_ar}
                  onChange={e => setForm(f => ({...f, name_ar: e.target.value}))} placeholder="مطعم السلام" />
              </div>
              <div>
                <label className="label">{isAr ? 'الاسم (إنجليزي) *' : 'Name (English) *'}</label>
                <input className="input" value={form.name_en}
                  onChange={e => setForm(f => ({...f, name_en: e.target.value, slug: !restaurant ? generateSlug(e.target.value) : f.slug}))}
                  placeholder="Al Salam Restaurant" />
              </div>
            </div>
            {/* Slug */}
            <div>
              <label className="label">{isAr ? 'رابط المطعم *' : 'Restaurant URL *'}</label>
              <div className="flex items-center">
                <span className="text-xs text-[#57534e] bg-[#0f0e0c] border border-e-0 border-[#2a2825] px-3 py-3 rounded-s-xl whitespace-nowrap">dokan.bh/r/</span>
                <input className="input rounded-s-none border-s-0 flex-1" value={form.slug}
                  onChange={e => setForm(f => ({...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'-')}))} placeholder="al-salam" />
              </div>
            </div>
            {/* Descriptions */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{isAr ? 'الوصف (عربي)' : 'Description (AR)'}</label>
                <textarea className="input resize-none h-20 text-right font-cairo text-sm" dir="rtl"
                  value={form.description_ar} onChange={e => setForm(f => ({...f, description_ar: e.target.value}))} placeholder="وصف مطعمك..." />
              </div>
              <div>
                <label className="label">{isAr ? 'الوصف (إنجليزي)' : 'Description (EN)'}</label>
                <textarea className="input resize-none h-20 text-sm"
                  value={form.description_en} onChange={e => setForm(f => ({...f, description_en: e.target.value}))} placeholder="Describe your restaurant..." />
              </div>
            </div>
            {/* Contact */}
            <div>
              <label className="label">{isAr ? 'رقم الهاتف' : 'Phone Number'}</label>
              <input className="input" dir="ltr" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="+973 1234 5678" />
            </div>
            <div>
              <label className="label">{isAr ? 'المحافظة' : 'Governorate'}</label>
              <select className="input" value={form.governorate} onChange={e => setForm(f => ({...f, governorate: e.target.value as GovernorateKey}))}>
                {Object.entries(GOVERNORATES).map(([key, val]) => (
                  <option key={key} value={key}>{isAr ? val.ar : val.en}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{isAr ? 'العنوان (عربي)' : 'Address (AR)'}</label>
                <input className="input text-right font-cairo text-sm" dir="rtl" value={form.address_ar}
                  onChange={e => setForm(f => ({...f, address_ar: e.target.value}))} placeholder="المنامة، شارع الملك فهد" />
              </div>
              <div>
                <label className="label">{isAr ? 'العنوان (إنجليزي)' : 'Address (EN)'}</label>
                <input className="input text-sm" value={form.address_en}
                  onChange={e => setForm(f => ({...f, address_en: e.target.value}))} placeholder="Manama, King Fahd Ave" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── OPENING HOURS ── */}
      {activeSection === 'hours' && (
        <div className="card">
          <OpeningHoursEditor
            value={form.opening_hours}
            onChange={hours => setForm(f => ({...f, opening_hours: hours}))}
            locale={locale}
          />
        </div>
      )}

      {/* ── ORDERING SETTINGS ── */}
      {activeSection === 'ordering' && (
        <div className="space-y-4">
          {/* Prep time */}
          <div className="card space-y-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-brand-400" />
              <h2 className="text-sm font-semibold text-[#fafaf9]">
                {isAr ? 'وقت التحضير التقريبي' : 'Estimated Prep Time'}
              </h2>
            </div>
            <p className="text-xs text-[#57534e]">
              {isAr ? 'يظهر للعميل بعد تأكيد الطلب' : 'Shown to customer after order is placed'}
            </p>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="5" max="60" step="5"
                value={form.prep_time_minutes}
                onChange={e => setForm(f => ({...f, prep_time_minutes: parseInt(e.target.value)}))}
                className="flex-1 accent-brand-500"
              />
              <div className="w-24 text-center bg-[#0f0e0c] border border-[#2a2825] rounded-xl py-2">
                <span className="font-bold text-brand-400">{form.prep_time_minutes}</span>
                <span className="text-xs text-[#57534e]"> {isAr ? 'دقيقة' : 'min'}</span>
              </div>
            </div>
            <div className="flex gap-1.5">
              {[10, 15, 20, 30, 45].map(t => (
                <button key={t} onClick={() => setForm(f => ({...f, prep_time_minutes: t}))}
                  className={cn('flex-1 min-h-[40px] rounded-lg text-xs font-medium transition-all border touch-manipulation',
                    form.prep_time_minutes === t
                      ? 'bg-brand-500/20 border-brand-500 text-brand-400'
                      : 'border-[#2a2825] text-[#57534e] active:border-[#3a3835]')}>
                  {t}{isAr ? 'د' : 'm'}
                </button>
              ))}
            </div>
          </div>

          {/* Pause ordering */}
          {restaurant && (
            <div className="card space-y-3">
              <div className="flex items-center gap-2">
                <PauseCircle size={16} className="text-orange-400" />
                <h2 className="text-sm font-semibold text-[#fafaf9]">
                  {isAr ? 'إيقاف الطلبات مؤقتاً' : 'Pause Ordering'}
                </h2>
              </div>
              <p className="text-xs text-[#57534e]">
                {isAr
                  ? 'أوقف الطلبات الجديدة مؤقتاً عندما يكون المطبخ مشغولاً'
                  : 'Temporarily stop new orders when the kitchen is overwhelmed'}
              </p>
              <PauseOrderingControl
                restaurantId={restaurant.id}
                isPaused={restaurant.ordering_paused ?? false}
                pauseReasonEn={restaurant.pause_reason_en}
                pauseReasonAr={restaurant.pause_reason_ar}
                locale={locale}
                onUpdate={load}
              />
            </div>
          )}

          {/* Public link */}
          {restaurant && (
            <div className="card bg-[#0f0e0c] flex items-center gap-3">
              <Globe size={18} className="text-brand-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-[#57534e]">{isAr ? 'الرابط العام' : 'Public storefront URL'}</div>
                <div className="text-sm text-brand-400 truncate">dokan.bh/r/{restaurant.slug}</div>
              </div>
            </div>
          )}

          {/* Add new restaurant */}
          <button
            onClick={() => {
              setRestaurant(null);
              setForm({ name_en:'',name_ar:'',slug:'',description_en:'',description_ar:'',
                phone:'',address_en:'',address_ar:'',governorate:'Capital',is_open:true,
                logo_url:'',cover_url:'',prep_time_minutes:15,opening_hours:parseHours(null) });
              setActiveSection('basic');
            }}
            className="btn-secondary w-full text-sm flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            {isAr ? 'إضافة مطعم جديد' : 'Add New Restaurant'}
          </button>
        </div>
      )}

      {/* Save button */}
      <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3">
        <Save size={18} />
        {saving
          ? (isAr ? 'جار الحفظ...' : 'Saving...')
          : (restaurant
              ? (isAr ? 'حفظ التغييرات' : 'Save Changes')
              : (isAr ? 'إنشاء المطعم' : 'Create Restaurant'))
        }
      </button>
    </div>
  );
}
