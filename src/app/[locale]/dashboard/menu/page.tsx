'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, GripVertical,
  ChevronDown, ChevronRight, Image, Tag, Star
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatBHD, getPublicImageUrl } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Category, Item, Variation, Addon } from '@/types';
import toast from 'react-hot-toast';
import NextImage from 'next/image';
import { StockControl } from '@/components/dashboard/StockControl';

// ── Item Form Modal ────────────────────────────────────────
function ItemModal({
  restaurantId,
  categoryId,
  item,
  locale,
  onClose,
  onSaved,
}: {
  restaurantId: string;
  categoryId: string;
  item: Item | null;
  locale: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isAr = locale === 'ar';
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name_en: item?.name_en ?? '',
    name_ar: item?.name_ar ?? '',
    description_en: item?.description_en ?? '',
    description_ar: item?.description_ar ?? '',
    price: item?.price?.toString() ?? '',
    is_available: item?.is_available ?? true,
    is_featured: item?.is_featured ?? false,
    tags: item?.tags ?? [] as string[],
    image_url: item?.image_url ?? '',
  });
  const [variations, setVariations] = useState<Partial<Variation>[]>([]);
  const [addons, setAddons] = useState<Partial<Addon>[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (item) {
      // Load variations and addons
      const load = async () => {
        const [{ data: vars }, { data: adds }] = await Promise.all([
          supabase.from('variations').select('*').eq('item_id', item.id).order('sort_order'),
          supabase.from('addons').select('*').eq('item_id', item.id).order('sort_order'),
        ]);
        setVariations(vars ?? []);
        setAddons(adds ?? []);
      };
      load();
    }
  }, [item, supabase]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${restaurantId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('menu-images')
      .upload(path, file, { upsert: true });
    if (!error) {
      setForm((f) => ({ ...f, image_url: path }));
      toast.success(isAr ? 'تم رفع الصورة' : 'Image uploaded');
    } else {
      toast.error(isAr ? 'فشل الرفع' : 'Upload failed');
    }
    setUploading(false);
  };

  const toggleTag = (tag: string) => {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag)
        ? f.tags.filter((t) => t !== tag)
        : [...f.tags, tag],
    }));
  };

  const handleSave = async () => {
    if (!form.name_en || !form.name_ar || !form.price) {
      toast.error(isAr ? 'يرجى ملء الحقول المطلوبة' : 'Fill required fields');
      return;
    }
    setSaving(true);

    const payload = {
      restaurant_id: restaurantId,
      category_id: categoryId || null,
      ...form,
      price: parseFloat(form.price),
    };

    let itemId = item?.id;

    if (item) {
      const { error } = await supabase.from('items').update(payload).eq('id', item.id);
      if (error) { toast.error('Error'); setSaving(false); return; }
    } else {
      const { data, error } = await supabase.from('items').insert(payload).select().single();
      if (error || !data) { toast.error('Error'); setSaving(false); return; }
      itemId = data.id;
    }

    // Save variations
    if (itemId && variations.length > 0) {
      await supabase.from('variations').delete().eq('item_id', itemId);
      await supabase.from('variations').insert(
        variations.map((v, i) => ({
          item_id: itemId,
          name_en: v.name_en ?? '',
          name_ar: v.name_ar ?? '',
          price_modifier: v.price_modifier ?? 0,
          sort_order: i,
        }))
      );
    }

    // Save addons
    if (itemId && addons.length > 0) {
      await supabase.from('addons').delete().eq('item_id', itemId);
      await supabase.from('addons').insert(
        addons.map((a, i) => ({
          item_id: itemId,
          name_en: a.name_en ?? '',
          name_ar: a.name_ar ?? '',
          price: a.price ?? 0,
          sort_order: i,
        }))
      );
    }

    toast.success(isAr ? 'تم الحفظ' : 'Saved');
    onSaved();
    onClose();
    setSaving(false);
  };

  const TAGS = ['spicy', 'vegan', 'vegetarian', 'gluten-free', 'halal'];
  const TAG_LABELS: Record<string, { en: string; ar: string }> = {
    'spicy':       { en: '🌶 Spicy',        ar: '🌶 حار' },
    'vegan':       { en: '🌱 Vegan',        ar: '🌱 نباتي صرف' },
    'vegetarian':  { en: '🥗 Vegetarian',   ar: '🥗 نباتي' },
    'gluten-free': { en: '🌾 Gluten-free',  ar: '🌾 خالٍ من الغلوتين' },
    'halal':       { en: '✅ Halal',        ar: '✅ حلال' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1a1916] border border-[#2a2825] rounded-t-3xl sm:rounded-2xl
                      w-full max-w-xl max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain shadow-2xl">
        <div className="sticky top-0 bg-[#1a1916] border-b border-[#2a2825] px-5 py-4
                        flex items-center justify-between z-10">
          <h2 className="font-bold text-[#fafaf9]">
            {item
              ? (isAr ? 'تعديل العنصر' : 'Edit Item')
              : (isAr ? 'إضافة عنصر' : 'Add Item')
            }
          </h2>
          <button onClick={onClose}
            className="w-11 h-11 -me-2 flex items-center justify-center text-[#57534e]
                       active:text-[#fafaf9] text-xl touch-manipulation">×</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Image */}
          <div>
            <label className="label">{isAr ? 'صورة العنصر' : 'Item Image'}</label>
            <div className="flex gap-3 items-center">
              {form.image_url ? (
                <div className="w-20 h-20 rounded-xl overflow-hidden border border-[#2a2825] flex-shrink-0">
                  <NextImage
                    src={getPublicImageUrl(form.image_url)}
                    alt="item"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl bg-[#0f0e0c] border border-dashed border-[#3a3835]
                                flex items-center justify-center flex-shrink-0">
                  <Image size={20} className="text-[#3a3835]" />
                </div>
              )}
              <div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="btn-secondary text-sm"
                  disabled={uploading}
                >
                  {uploading
                    ? (isAr ? 'جار الرفع...' : 'Uploading...')
                    : (isAr ? 'رفع صورة' : 'Upload Image')
                  }
                </button>
                {form.image_url && (
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, image_url: '' }))}
                    className="text-xs text-red-400 hover:text-red-300 block mt-1"
                  >
                    {isAr ? 'إزالة الصورة' : 'Remove'}
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </div>
          </div>

          {/* Names */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{isAr ? 'الاسم (عربي) *' : 'Name (Arabic) *'}</label>
              <input
                className="input text-right font-cairo"
                dir="rtl"
                value={form.name_ar}
                onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))}
                placeholder="برجر كلاسيكي"
              />
            </div>
            <div>
              <label className="label">{isAr ? 'الاسم (إنجليزي) *' : 'Name (English) *'}</label>
              <input
                className="input"
                value={form.name_en}
                onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))}
                placeholder="Classic Burger"
              />
            </div>
          </div>

          {/* Descriptions */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{isAr ? 'الوصف (عربي)' : 'Description (AR)'}</label>
              <textarea
                className="input resize-none h-20 text-right font-cairo text-sm"
                dir="rtl"
                value={form.description_ar}
                onChange={e => setForm(f => ({ ...f, description_ar: e.target.value }))}
                placeholder="وصف العنصر..."
              />
            </div>
            <div>
              <label className="label">{isAr ? 'الوصف (إنجليزي)' : 'Description (EN)'}</label>
              <textarea
                className="input resize-none h-20 text-sm"
                value={form.description_en}
                onChange={e => setForm(f => ({ ...f, description_en: e.target.value }))}
                placeholder="Item description..."
              />
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="label">{isAr ? 'السعر (د.ب.) *' : 'Price (BHD) *'}</label>
            <div className="relative">
              <input
                type="number"
                step="0.001"
                min="0"
                className="input"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="0.000"
              />
              <span className="absolute end-3 top-1/2 -translate-y-1/2 text-[#57534e] text-sm">
                {isAr ? 'د.ب.' : 'BHD'}
              </span>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setForm(f => ({ ...f, is_available: !f.is_available }))}
                className={cn(
                  'w-10 h-6 rounded-full transition-colors relative',
                  form.is_available ? 'bg-brand-500' : 'bg-[#2a2825]'
                )}
              >
                <span className={cn(
                  'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                  form.is_available ? 'translate-x-5' : 'translate-x-1'
                )} />
              </div>
              <span className="text-sm text-[#a8a29e]">
                {isAr ? 'متاح' : 'Available'}
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setForm(f => ({ ...f, is_featured: !f.is_featured }))}
                className={cn(
                  'w-10 h-6 rounded-full transition-colors relative',
                  form.is_featured ? 'bg-yellow-500' : 'bg-[#2a2825]'
                )}
              >
                <span className={cn(
                  'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                  form.is_featured ? 'translate-x-5' : 'translate-x-1'
                )} />
              </div>
              <span className="text-sm text-[#a8a29e]">
                <Star size={12} className="inline mb-0.5" /> {isAr ? 'مميز' : 'Featured'}
              </span>
            </label>
          </div>

          {/* Tags */}
          <div>
            <label className="label">{isAr ? 'التصنيفات' : 'Tags'}</label>
            <div className="flex flex-wrap gap-2">
              {TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'text-xs px-3 py-1 rounded-full border transition-all',
                    form.tags.includes(tag)
                      ? 'bg-brand-500/20 border-brand-500 text-brand-400'
                      : 'border-[#2a2825] text-[#57534e] hover:border-[#3a3835]'
                  )}
                >
                  {TAG_LABELS[tag]?.[isAr ? 'ar' : 'en']}
                </button>
              ))}
            </div>
          </div>

          {/* Variations */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">
                {isAr ? 'الأحجام / الخيارات' : 'Sizes / Variations'}
              </label>
              <button
                type="button"
                onClick={() => setVariations(v => [...v, { name_en: '', name_ar: '', price_modifier: 0 }])}
                className="text-xs text-brand-400 active:text-brand-300 min-h-[40px] px-2 touch-manipulation"
              >
                + {isAr ? 'إضافة' : 'Add'}
              </button>
            </div>
            {variations.map((v, i) => (
              <div key={i} className="bg-[#0f0e0c] border border-[#2a2825] rounded-xl p-2.5 mb-2 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="input text-sm text-right font-cairo"
                    dir="rtl"
                    placeholder={isAr ? 'صغير' : 'Small'}
                    value={v.name_ar ?? ''}
                    onChange={e => setVariations(vars => vars.map((x, j) => j === i ? { ...x, name_ar: e.target.value } : x))}
                  />
                  <input
                    className="input text-sm"
                    placeholder="Small"
                    value={v.name_en ?? ''}
                    onChange={e => setVariations(vars => vars.map((x, j) => j === i ? { ...x, name_en: e.target.value } : x))}
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.001"
                    className="input text-sm flex-1"
                    placeholder="+0.000"
                    value={v.price_modifier ?? 0}
                    onChange={e => setVariations(vars => vars.map((x, j) => j === i ? { ...x, price_modifier: parseFloat(e.target.value) } : x))}
                  />
                  <button type="button" onClick={() => setVariations(v => v.filter((_, j) => j !== i))}
                    className="w-11 h-11 flex-shrink-0 flex items-center justify-center text-red-400
                               active:text-red-300 active:bg-red-950/30 rounded-lg touch-manipulation">×</button>
                </div>
              </div>
            ))}
          </div>

          {/* Addons */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">
                {isAr ? 'الإضافات' : 'Add-ons / Extras'}
              </label>
              <button
                type="button"
                onClick={() => setAddons(a => [...a, { name_en: '', name_ar: '', price: 0 }])}
                className="text-xs text-brand-400 active:text-brand-300 min-h-[40px] px-2 touch-manipulation"
              >
                + {isAr ? 'إضافة' : 'Add'}
              </button>
            </div>
            {addons.map((a, i) => (
              <div key={i} className="bg-[#0f0e0c] border border-[#2a2825] rounded-xl p-2.5 mb-2 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="input text-sm text-right font-cairo"
                    dir="rtl"
                    placeholder={isAr ? 'جبنة إضافية' : 'Extra Cheese'}
                    value={a.name_ar ?? ''}
                    onChange={e => setAddons(adds => adds.map((x, j) => j === i ? { ...x, name_ar: e.target.value } : x))}
                  />
                  <input
                    className="input text-sm"
                    placeholder="Extra Cheese"
                    value={a.name_en ?? ''}
                    onChange={e => setAddons(adds => adds.map((x, j) => j === i ? { ...x, name_en: e.target.value } : x))}
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    className="input text-sm flex-1"
                    placeholder="0.000"
                    value={a.price ?? 0}
                    onChange={e => setAddons(adds => adds.map((x, j) => j === i ? { ...x, price: parseFloat(e.target.value) } : x))}
                  />
                  <button type="button" onClick={() => setAddons(a => a.filter((_, j) => j !== i))}
                    className="w-11 h-11 flex-shrink-0 flex items-center justify-center text-red-400
                               active:text-red-300 active:bg-red-950/30 rounded-lg touch-manipulation">×</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#1a1916] border-t border-[#2a2825] px-5 py-4 flex gap-3 safe-bottom">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex-1"
          >
            {saving ? (isAr ? 'جار الحفظ...' : 'Saving...') : (isAr ? 'حفظ' : 'Save')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Menu Page ─────────────────────────────────────────
export default function MenuPage({ params: { locale } }: { params: { locale: string } }) {
  const isAr = locale === 'ar';
  const supabase = createClient();

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [editItem, setEditItem] = useState<Item | null | 'new'>(null);
  const [activeCatId, setActiveCatId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: r } = await supabase.from('restaurants').select('id').eq('owner_id', user.id).single();
    if (!r) return;
    setRestaurantId(r.id);

    const [{ data: cats }, { data: its }] = await Promise.all([
      supabase.from('categories').select('*').eq('restaurant_id', r.id).order('sort_order'),
      supabase.from('items').select('*').eq('restaurant_id', r.id).order('sort_order'),
    ]);
    setCategories(cats ?? []);
    setItems(its ?? []);
    if (cats?.length) setExpanded([cats[0].id]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addCategory = async () => {
    if (!restaurantId) return;
    const nameEn = prompt(isAr ? 'اسم الصنف (إنجليزي):' : 'Category name (English):');
    const nameAr = prompt(isAr ? 'اسم الصنف (عربي):' : 'Category name (Arabic):');
    if (!nameEn || !nameAr) return;
    const { error } = await supabase.from('categories').insert({
      restaurant_id: restaurantId,
      name_en: nameEn,
      name_ar: nameAr,
      sort_order: categories.length,
    });
    if (!error) { toast.success(isAr ? 'تم إضافة الصنف' : 'Category added'); load(); }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm(isAr ? 'حذف الصنف وجميع عناصره؟' : 'Delete category and all its items?')) return;
    await supabase.from('categories').delete().eq('id', id);
    toast.success(isAr ? 'تم الحذف' : 'Deleted');
    load();
  };

  const toggleItemAvailability = async (item: Item) => {
    await supabase.from('items').update({ is_available: !item.is_available }).eq('id', item.id);
    load();
  };

  const deleteItem = async (id: string) => {
    if (!confirm(isAr ? 'حذف العنصر؟' : 'Delete item?')) return;
    await supabase.from('items').delete().eq('id', id);
    toast.success(isAr ? 'تم الحذف' : 'Deleted');
    load();
  };

  const toggleExpand = (id: string) => {
    setExpanded(e => e.includes(id) ? e.filter(x => x !== id) : [...e, id]);
  };

  if (loading) {
    return <div className="p-6 text-[#57534e]">{isAr ? 'جار التحميل...' : 'Loading...'}</div>;
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg sm:text-xl font-bold text-[#fafaf9]">
          {isAr ? 'القائمة' : 'Menu'}
        </h1>
        <button onClick={addCategory} className="btn-primary text-sm flex-shrink-0">
          <Plus size={16} />
          <span className="hidden sm:inline">{isAr ? 'إضافة صنف' : 'Add Category'}</span>
          <span className="sm:hidden">{isAr ? 'صنف' : 'Category'}</span>
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-3">🍽</div>
          <p className="text-[#a8a29e] font-medium">
            {isAr ? 'لا توجد أصناف بعد' : 'No categories yet'}
          </p>
          <p className="text-sm text-[#57534e] mt-1">
            {isAr ? 'ابدأ بإضافة صنف للقائمة' : 'Start by adding a category'}
          </p>
          <button onClick={addCategory} className="btn-primary mt-4 mx-auto">
            <Plus size={16} />
            {isAr ? 'إضافة صنف' : 'Add Category'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => {
            const catItems = items.filter(i => i.category_id === cat.id);
            const isOpen = expanded.includes(cat.id);

            return (
              <div key={cat.id} className="card overflow-hidden">
                {/* Category header */}
                <div
                  className="flex items-center gap-2 sm:gap-3 cursor-pointer touch-manipulation"
                  onClick={() => toggleExpand(cat.id)}
                >
                  <div className="text-xl w-8 text-center flex-shrink-0">{cat.emoji || '🍴'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[#fafaf9] text-sm sm:text-base truncate">
                      {isAr ? cat.name_ar : cat.name_en}
                    </div>
                    <div className="text-xs text-[#57534e]">
                      {catItems.length} {isAr ? 'عنصر' : 'items'}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveCatId(cat.id);
                        setEditItem('new');
                      }}
                      className="flex items-center gap-1 text-xs text-[#a8a29e] active:text-[#fafaf9]
                                 min-h-[40px] px-2.5 rounded-lg active:bg-[#1a1916]
                                 touch-manipulation transition-colors"
                    >
                      <Plus size={14} />
                      <span className="hidden sm:inline">{isAr ? 'عنصر' : 'Item'}</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id); }}
                      className="w-10 h-10 flex items-center justify-center text-red-400
                                 active:text-red-300 active:bg-red-950/30 rounded-lg
                                 touch-manipulation transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                    {isOpen ? <ChevronDown size={16} className="text-[#57534e]" /> : <ChevronRight size={16} className="text-[#57534e]" />}
                  </div>
                </div>

                {/* Items */}
                {isOpen && (
                  <div className="mt-3 space-y-2">
                    {catItems.length === 0 ? (
                      <div className="text-center py-6 text-[#57534e] text-sm border-t border-[#2a2825]">
                        {isAr ? 'لا توجد عناصر. أضف أول عنصر.' : 'No items. Add the first one.'}
                      </div>
                    ) : (
                      catItems.map((item) => (
                        <div
                          key={item.id}
                          className={cn(
                            'rounded-xl border transition-all p-3',
                            item.is_available
                              ? 'border-[#2a2825] bg-[#0f0e0c]'
                              : 'border-[#1a1916] bg-[#0a0a08] opacity-60'
                          )}
                        >
                          {/* Top row: image + name/price — tap to edit */}
                          <button
                            onClick={() => { setActiveCatId(cat.id); setEditItem(item); }}
                            className="flex items-center gap-3 w-full text-start touch-manipulation"
                          >
                            {item.image_url ? (
                              <NextImage
                                src={getPublicImageUrl(item.image_url)}
                                alt={item.name_en}
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-[#1a1916] flex items-center
                                              justify-center flex-shrink-0 text-xl">
                                🍴
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-[#fafaf9] text-sm truncate">
                                  {isAr ? item.name_ar : item.name_en}
                                </span>
                                {item.is_featured && <Star size={13} className="text-yellow-500 flex-shrink-0" />}
                              </div>
                              <div className="text-brand-400 text-sm font-semibold">
                                {formatBHD(item.price, locale as 'en' | 'ar')}
                              </div>
                              {item.tags?.length > 0 && (
                                <div className="flex gap-1 mt-1 flex-wrap">
                                  {item.tags.map(tag => (
                                    <span key={tag} className="text-xs bg-[#1a1916] text-[#57534e] px-1.5 py-0.5 rounded">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            <Pencil size={15} className="text-[#3a3835] flex-shrink-0" />
                          </button>

                          {/* Bottom row: stock control + quick actions — 44px targets */}
                          <div className="flex items-center justify-between gap-2 mt-2.5 pt-2.5
                                          border-t border-[#1a1916]">
                            <StockControl
                              item={item as Item & { stock_enabled?: boolean; stock_count?: number | null; sold_out?: boolean }}
                              locale={locale}
                              onUpdate={load}
                            />
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => toggleItemAvailability(item)}
                                className="w-11 h-11 flex items-center justify-center text-[#a8a29e]
                                           active:text-[#fafaf9] active:bg-[#1a1916] rounded-lg
                                           touch-manipulation transition-colors"
                              >
                                {item.is_available ? <Eye size={16} /> : <EyeOff size={16} />}
                              </button>
                              <button
                                onClick={() => deleteItem(item.id)}
                                className="w-11 h-11 flex items-center justify-center text-red-400
                                           active:text-red-300 active:bg-red-950/30 rounded-lg
                                           touch-manipulation transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Item Modal */}
      {editItem !== null && restaurantId && (
        <ItemModal
          restaurantId={restaurantId}
          categoryId={activeCatId}
          item={editItem === 'new' ? null : editItem}
          locale={locale}
          onClose={() => setEditItem(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
