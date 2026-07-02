import { createClient } from '@/lib/supabase/server';
import PaymentsTable from '@/components/admin/PaymentsTable';
import type { Payment } from '@/types';

export default async function AdminPaymentsPage() {
  const supabase = createClient();

  const { data: payments } = await supabase
    .from('payments')
    .select(`
      *,
      restaurants(name_en, name_ar, slug)
    `)
    .order('paid_at', { ascending: false });

  const rows = (payments ?? []) as Payment[];

  return <PaymentsTable rows={rows as any} />;
}
