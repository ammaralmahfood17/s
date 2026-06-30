import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { QrCode, MapPin, Phone, Car, Package } from 'lucide-react';
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

  const { data: allTables } = await supabase
    .from('tables')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('is_active', true)
    .order('sort_order');

  const tables = (allTables ?? []);
  const driveThru = tables.find(t => t.name_en === 'Drive Thru');
  const externalPickup = tables.find(t => t.name_en === 'External Pickup');
  const regularTables = tables.filter(t => t.name_en !== 'Drive Thru' && t.name_en !== 'External Pickup');

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
            {/* Non-dine-in options */}
            {driveThru && (
              <Link
                href={`/${slug}/car`}
                className="card-hover flex items-center justify-between py-4 px-5 block"
              >
                <div className="flex items-center gap-3">
                  <Car size={20} className="text-primary" />
                  <span className="font-medium text-foreground">طلب من السيارة</span>
                </div>
                <QrCode size={18} className="text-primary" />
              </Link>
            )}
            {externalPickup && (
              <Link
                href={`/${slug}/external`}
                className="card-hover flex items-center justify-between py-4 px-5 block"
              >
                <div className="flex items-center gap-3">
                  <Package size={20} className="text-brand-400" />
                  <span className="font-medium text-foreground">طلب من الخارج (Takeaway)</span>
                </div>
                <QrCode size={18} className="text-brand-400" />
              </Link>
            )}

            {/* Divider if both non-dine-in and dine-in options exist */}
            {regularTables.length > 0 && (driveThru || externalPickup) && (
              <div className="flex items-center gap-2 py-1">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">طلب داخل المطعم</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            )}

            {regularTables.map((table) => (
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
            {regularTables.length === 0 && !driveThru && !externalPickup && (
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
