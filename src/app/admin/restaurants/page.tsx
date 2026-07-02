import { createClient } from '@/lib/supabase/server';
import RestaurantsTable from '@/components/admin/RestaurantsTable';
import type { Restaurant } from '@/types';

interface RestaurantRow extends Restaurant {
  subscriptions?: {
    status: string;
    current_period_end: string;
    trial_ends_at: string | null;
    plan_id: string;
    plans?: { name_en: string; name_ar: string } | null;
  }[];
}

export default async function AdminRestaurantsPage() {
  const supabase = createClient();

  const { data: restaurants } = await supabase
    .from('restaurants')
    .select(`
      *,
      subscriptions(status, current_period_end, trial_ends_at, plan_id,
        plans(name_en, name_ar))
    `)
    .order('created_at', { ascending: false });

  const rows = (restaurants ?? []) as RestaurantRow[];

  return (
    <div className="p-4 sm:p-6 max-w-6xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            جميع العربات
          </h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} مسجلة
          </p>
        </div>
      </div>

      <RestaurantsTable rows={rows} />
    </div>
  );
}
