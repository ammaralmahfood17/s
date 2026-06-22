import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { QrCode, MapPin, Phone } from 'lucide-react';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RestaurantStorefrontPage({
  params: { slug },
}: {
  params: { slug: string };
}) {
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
            {restaurant.name_ar}
          </h1>
          {restaurant.address_ar && (
            <div className="flex items-center justify-center gap-1 mt-2 text-sm text-[#57534e]">
              <MapPin size={14} />
              {restaurant.address_ar}
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
              المطعم مغلق حالياً
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[#a8a29e]">
              اختر طاولتك للطلب
            </p>
            {(tables ?? []).map((table) => (
              <Link
                key={table.id}
                href={`/${slug}/t/${table.qr_token}`}
                className="card-hover flex items-center justify-between py-4 px-5 block"
              >
                <span className="font-medium text-[#fafaf9]">
                  {table.name_ar}
                </span>
                <QrCode size={18} className="text-brand-400" />
              </Link>
            ))}
            {(!tables || tables.length === 0) && (
              <div className="card text-center py-8 text-[#57534e] text-sm">
                لا توجد طاولات متاحة
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-[#3a3835]">
          مدعوم بـ دكان · Dokan
        </div>
      </div>
    </div>
  );
}
