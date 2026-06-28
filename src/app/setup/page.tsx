'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QrCode, Store } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { generateSlug, getPublicImageUrl } from '@/lib/utils';
import { GOVERNORATES, type GovernorateKey } from '@/types';
import { toast } from 'sonner';

export default function SetupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [loading, setLoading] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);

  const handleNameChange = (value: string) => {
    setNameAr(value);
    if (!slugEdited) {
      setSlug(generateSlug(value));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim()) {
      toast.error('يرجى إدخال اسم العربة');
      return;
    }
    if (!slug.trim()) {
      toast.error('يرجى إدخال الرابط');
      return;
    }

    setLoading(true);

    // Check slug availability
    const { data: existing } = await supabase
      .from('restaurants')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      toast.error('الرابط محجوب، اختر اسماً آخر');
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('يرجى تسجيل الدخول أولاً');
      router.push('/login');
      return;
    }

    const { error } = await supabase.from('restaurants').insert({
      owner_id: user.id,
      name_ar: nameAr.trim(),
      name_en: nameEn.trim() || nameAr.trim(),
      slug: slug.trim(),
      phone: phone.trim() || null,
      governorate: governorate || null,
      is_open: true,
    });

    if (error) {
      toast.error('حدث خطأ في إنشاء العربة');

      setLoading(false);
      return;
    }

    // Auto-create Drive Thru table
    const { data: newRestaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('slug', slug.trim())
      .single();

    if (newRestaurant) {
      await supabase.from('tables').insert({
        restaurant_id: newRestaurant.id,
        name_en: 'Drive Thru',
        name_ar: 'طلب سيارات',
        sort_order: 0,
        is_active: true,
      });
    }

    toast.success('تم إنشاء العربة بنجاح!');
    router.push(`/${slug}/dashboard`);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-brand-500 flex items-center justify-center mx-auto mb-4">
            <Store size={24} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">إنشاء عربة جديدة</h1>
          <p className="text-sm text-muted-foreground mt-1">أدخل بيانات مطعمك لبدء استقبال الطلبات</p>
        </div>

        <form onSubmit={handleCreate} className="card space-y-5">
          {/* Name Arabic */}
          <div>
            <label className="label">اسم العربة (عربي) *</label>
            <input
              type="text"
              value={nameAr}
              onChange={(e) => handleNameChange(e.target.value)}
              className="input font-cairo"
              placeholder="مثال: وقت الشاي"
              dir="rtl"
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label className="label">الرابط (slug)</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">dokanstore.xyz/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }}
                className="input flex-1"
                placeholder="tea-time"
                dir="ltr"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">سيتم تعبئته تلقائياً من الاسم العربي</p>
          </div>

          {/* Name English */}
          <div>
            <label className="label">اسم العربة (إنجليزي — اختياري)</label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              className="input"
              placeholder="Tea Time"
              dir="ltr"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="label">رقم الجوال (اختياري)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input"
              placeholder="+973 XXXX XXXX"
              dir="ltr"
            />
          </div>

          {/* Governorate */}
          <div>
            <label className="label">المحافظة (اختياري)</label>
            <select
              value={governorate}
              onChange={(e) => setGovernorate(e.target.value)}
              className="input"
            >
              <option value="">اختر المحافظة</option>
              {Object.entries(GOVERNORATES).map(([key, name]) => (
                <option key={key} value={key}>
                  {name.ar}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-base"
          >
            {loading ? 'جار الإنشاء...' : 'إنشاء العربة 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
}