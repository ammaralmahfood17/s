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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <div>
          <div className="brand-icon w-16 h-16 rounded-2xl mx-auto mb-4"
               style={{ width: 64, height: 64 }}>
            <span className="text-xl">د</span>
          </div>
          <h1 className="text-2xl font-black text-foreground">
            {restaurant.name_ar}
          </h1>
          {restaurant.address_ar && (
            <div className="flex items-center justify-center gap-1 mt-2 text-sm text-muted-foreground">
              <MapPin size={14} />
              {restaurant.address_ar}
            </div>
          )}
          {restaurant.phone && (
            <div className="flex items-center justify-center gap-1 mt-1 text-sm text-muted-foreground">
              <Phone size={14} />
              {restaurant.phone}
            </div>
          )}
        </div>

        {!restaurant.is_open ? (
          <div className="card text-center py-8">
            <div className="text-4xl mb-3">🔒</div>
            <p className="text-muted-foreground font-medium">
              المطعم مغلق حالياً
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              اختر طاولتك للطلب
            </p>
            {(tables ?? []).map((table) => (
              <Link
                key={table.id}
                href={`/${slug}/t/${table.qr_token}`}
                className="card-hover flex items-center justify-between py-4 px-5 block"
              >
                <span className="font-medium text-foreground">
                  {table.name_ar}
                </span>
                <QrCode size={18} className="text-primary" />
              </Link>
            ))}
            {(!tables || tables.length === 0) && (
              <div className="card text-center py-8 text-muted-foreground text-sm">
                لا توجد طاولات متاحة
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground/40">
          مدعوم بـ دكان · Dokan
        </div>
      </div>
    </div>
  );
}
