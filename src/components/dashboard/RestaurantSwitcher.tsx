'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Plus, Store } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Restaurant } from '@/types';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface Props {
  currentRestaurantId: string;
  locale: string;
}

export function RestaurantSwitcher({ currentRestaurantId, locale }: Props) {
  const isAr = locale === 'ar';
  const supabase = createClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [current, setCurrent] = useState<Restaurant | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all restaurants user owns or is staff of
      const { data: owned } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at');

      const { data: staffed } = await supabase
        .from('restaurant_staff')
        .select('restaurant_id, restaurants(*)')
        .eq('user_id', user.id)
        .neq('role', 'owner');

      const staffRestaurants = (staffed ?? [])
        .flatMap((s: { restaurant_id: string; restaurants: Record<string, unknown>[] }) => s.restaurants ?? [])
        .filter(Boolean);

      const all = [
        ...(owned ?? []),
        ...staffRestaurants,
      ] as Restaurant[];

      // Deduplicate
      const unique = all.filter((r, i) => all.findIndex(x => x.id === r.id) === i);
      setRestaurants(unique);
      setCurrent(unique.find(r => r.id === currentRestaurantId) ?? unique[0] ?? null);
    };
    load();
  }, [currentRestaurantId, supabase]);

  // Only show switcher if user has 2+ restaurants
  if (restaurants.length <= 1) return null;

  return (
    <div className="relative px-3 pb-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl
                   bg-[#0f0e0c] border border-[#2a2825] hover:border-[#3a3835]
                   transition-all text-sm"
      >
        <Store size={14} className="text-brand-400 flex-shrink-0" />
        <span className="flex-1 text-start text-[#fafaf9] truncate">
          {current ? (isAr ? current.name_ar : current.name_en) : '...'}
        </span>
        <ChevronDown size={14} className={cn(
          'text-[#57534e] transition-transform flex-shrink-0',
          open && 'rotate-180'
        )} />
      </button>

      {open && (
        <div className="absolute top-full left-3 right-3 z-50 mt-1
                        bg-[#1a1916] border border-[#2a2825] rounded-xl
                        shadow-2xl overflow-hidden animate-slide-up">
          {restaurants.map(r => (
            <button
              key={r.id}
              onClick={() => {
                setOpen(false);
                // Store preference in localStorage
                localStorage.setItem('dokan_active_restaurant', r.id);
                router.refresh();
              }}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2.5 text-sm text-start',
                'hover:bg-[#2a2825] transition-colors',
                r.id === currentRestaurantId && 'bg-brand-500/10 text-brand-400'
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="text-[#fafaf9] truncate">
                  {isAr ? r.name_ar : r.name_en}
                </div>
                <div className="text-xs text-[#57534e]">
                  {r.is_open ? (isAr ? 'مفتوح' : 'Open') : (isAr ? 'مغلق' : 'Closed')}
                  {r.ordering_paused && ` · ${isAr ? 'موقوف' : 'Paused'}`}
                </div>
              </div>
              {r.id === currentRestaurantId && (
                <span className="text-xs text-brand-400">✓</span>
              )}
            </button>
          ))}

          <div className="border-t border-[#2a2825]">
            <button
              onClick={() => {
                setOpen(false);
                router.push(`/${locale}/dashboard/settings?new=1`);
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm
                         text-brand-400 hover:bg-[#2a2825] transition-colors"
            >
              <Plus size={14} />
              {isAr ? 'إضافة مطعم جديد' : 'Add new restaurant'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
