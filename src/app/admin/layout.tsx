import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminShell from '@/components/admin/AdminShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirectTo=/admin');

  // Check super admin
  const { data: admin } = await supabase
    .from('super_admins')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!admin) redirect('/login');

  return (
    <AdminShell userEmail={user.email ?? ''}>
      {children}
    </AdminShell>
  );
}
