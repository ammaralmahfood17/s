import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminShell from '@/components/admin/AdminShell';

export default async function AdminLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/login`);

  // Check super admin
  const { data: admin } = await supabase
    .from('super_admins')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!admin) redirect(`/${locale}/dashboard`);

  return (
    <AdminShell locale={locale} userEmail={user.email ?? ''}>
      {children}
    </AdminShell>
  );
}
