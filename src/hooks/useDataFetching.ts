'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Restaurant, Table, Category, Item, Variation, Addon } from '@/types';

// ── Keys (for manual invalidation) ─────────────────────────
export const queryKeys = {
  restaurant: (slug: string) => ['restaurant', 'slug', slug] as const,
  restaurantById: (id: string) => ['restaurant', 'id', id] as const,
  table: (qrToken: string) => ['table', qrToken] as const,
  menu: (restaurantId: string) => ['menu', restaurantId] as const,
  dashboard: (userId: string) => ['dashboard', userId] as const,
};

// ── Get restaurant by slug (for storefront) ────────────────
export function useRestaurantBySlug(slug: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.restaurant(slug),
    queryFn: async () => {
      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .single();
      return data as Restaurant | null;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,  // 5 min
  });
}

// ── Resolve table by QR token ──────────────────────────────
export function useTableByQrToken(qrToken: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.table(qrToken),
    queryFn: async () => {
      const { data } = await supabase
        .from('tables')
        .select('id, name_en, name_ar, restaurant_id, is_active')
        .eq('qr_token', qrToken)
        .single();
      return data as Pick<Table, 'id' | 'name_en' | 'name_ar' | 'restaurant_id' | 'is_active'> | null;
    },
    enabled: !!qrToken,
    staleTime: 10 * 60 * 1000,  // 10 min — tables rarely change
  });
}

// ── Full menu for a restaurant (storefront) ────────────────
export function useMenu(restaurantId: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.menu(restaurantId),
    queryFn: async () => {
      const [categoryRes, itemsRes, variationsRes, addonsRes] = await Promise.all([
        supabase.from('categories').select('*').eq('restaurant_id', restaurantId)
          .eq('is_visible', true).order('sort_order'),
        supabase.from('items').select('*').eq('restaurant_id', restaurantId)
          .eq('is_available', true).order('sort_order'),
        supabase.from('variations').select('*').eq('restaurant_id', restaurantId)
          .order('sort_order'),
        supabase.from('addons').select('*').eq('restaurant_id', restaurantId)
          .order('sort_order'),
      ]);

      const categories = (categoryRes.data ?? []) as Category[];
      const items = (itemsRes.data ?? []) as Item[];
      const variations = (variationsRes.data ?? []) as Variation[];
      const addons = (addonsRes.data ?? []) as Addon[];

      // Build maps
      const varMap: Record<string, Variation[]> = {};
      variations.forEach(v => {
        if (!varMap[v.item_id]) varMap[v.item_id] = [];
        varMap[v.item_id].push(v);
      });

      const addonMap: Record<string, Addon[]> = {};
      addons.forEach(a => {
        if (!addonMap[a.item_id]) addonMap[a.item_id] = [];
        addonMap[a.item_id].push(a);
      });

      return { categories, items, varMap, addonMap };
    },
    enabled: !!restaurantId,
    staleTime: 2 * 60 * 1000,  // 2 min cache
  });
}

// ── Get user's restaurant ID for dashboard ─────────────────
export function useMyRestaurant(userId: string | undefined) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.dashboard(userId ?? ''),
    queryFn: async () => {
      const { data: r } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', userId)
        .single();
      return r as { id: string } | null;
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
  });
}