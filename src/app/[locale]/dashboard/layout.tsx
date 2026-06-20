import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { SubscriptionGate } from '@/components/shared/SubscriptionGate';

export default async function DashboardLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/login`);

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  return (
    <DashboardShell locale={locale} user={user} restaurant={restaurant}>
      {restaurant ? (
        <SubscriptionGate restaurantId={restaurant.id} locale={locale}>
          {children}
        </SubscriptionGate>
      ) : (
        children
      )}
    </DashboardShell>
  );
}
