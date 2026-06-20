import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { QrCode, MapPin, Phone } from 'lucide-react';
import { notFound } from 'next/navigation';

export default async function RestaurantStorefrontPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  const isAr = locale === 'ar';
  const supabase = createClient();

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!restaurant) notFound();

  const { data: tables } = await supabase
    .from('tables')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('is_active', true)
    .order('sort_order');

  return (
    <div className="min-h-screen bg-[#0f0e0c] flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <div>
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20
                          flex items-center justify-center mx-auto mb-4">
            <QrCode size={32} className="text-brand-400" />
          </div>
          <h1 className="text-2xl font-bold text-[#fafaf9]">
            {isAr ? restaurant.name_ar : restaurant.name_en}
          </h1>
          {restaurant.address_en && (
            <div className="flex items-center justify-center gap-1 mt-2 text-sm text-[#57534e]">
              <MapPin size={14} />
              {isAr ? restaurant.address_ar : restaurant.address_en}
            </div>
          )}
          {restaurant.phone && (
            <div className="flex items-center justify-center gap-1 mt-1 text-sm text-[#57534e]">
              <Phone size={14} />
              {restaurant.phone}
            </div>
          )}
        </div>

        {!restaurant.is_open ? (
          <div className="card text-center py-8">
            <div className="text-4xl mb-3">🔒</div>
            <p className="text-[#a8a29e] font-medium">
              {isAr ? 'المطعم مغلق حالياً' : 'Restaurant is currently closed'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[#a8a29e]">
              {isAr ? 'اختر طاولتك للطلب' : 'Select your table to order'}
            </p>
            {(tables ?? []).map((table) => (
              <Link
                key={table.id}
                href={`/${locale}/r/${slug}/t/${table.qr_token}`}
                className="card-hover flex items-center justify-between py-4 px-5 block"
              >
                <span className="font-medium text-[#fafaf9]">
                  {isAr ? table.name_ar : table.name_en}
                </span>
                <QrCode size={18} className="text-brand-400" />
              </Link>
            ))}
            {(!tables || tables.length === 0) && (
              <div className="card text-center py-8 text-[#57534e] text-sm">
                {isAr ? 'لا توجد طاولات متاحة' : 'No tables available'}
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-[#3a3835]">
          {isAr ? 'مدعوم بـ دكان · Dokan' : 'Powered by Dokan · دكان'}
        </div>
      </div>
    </div>
  );
}
