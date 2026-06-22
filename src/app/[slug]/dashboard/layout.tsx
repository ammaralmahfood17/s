import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { SubscriptionGate } from '@/components/shared/SubscriptionGate';

export default async function DashboardLayout({
  children,
  params: { slug },
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/login?redirectTo=/${slug}/dashboard`);

  // Fetch restaurant by slug
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!restaurant) {
    notFound();
  }

  // Check if user is owner or staff
  const isOwner = restaurant.owner_id === user.id;
  let isStaff = false;

  if (!isOwner) {
    const { data: staff } = await supabase
      .from('restaurant_staff')
      .select('id')
      .eq('restaurant_id', restaurant.id)
      .eq('user_id', user.id)
      .single();
    isStaff = !!staff;
  }

  if (!isOwner && !isStaff) {
    // User doesn't have access to this restaurant's dashboard
    redirect('/login');
  }

  return (
    <DashboardShell user={user} restaurant={restaurant}>
      {restaurant ? (
        <SubscriptionGate restaurantId={restaurant.id} slug={slug}>
          {children}
        </SubscriptionGate>
      ) : (
        children
      )}
    </DashboardShell>
  );
}
