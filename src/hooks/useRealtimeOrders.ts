'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { OrderWithItems, OrderStatus } from '@/types';

export function useRealtimeOrders(restaurantId: string) {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`*, table:tables(*), order_items(*)`)
      .eq('restaurant_id', restaurantId)
      .not('status', 'in', '("delivered","cancelled")')
      .order('created_at', { ascending: true });

    if (!error && data) setOrders(data as OrderWithItems[]);
    setLoading(false);
  }, [restaurantId, supabase]);

  useEffect(() => {
    if (!restaurantId) return;
    fetchOrders();

    const channel = supabase
      .channel(`orders-${restaurantId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'orders',
        filter: `restaurant_id=eq.${restaurantId}`,
      }, async (payload) => {
        if (payload.eventType === 'INSERT') {
          const { data } = await supabase
            .from('orders')
            .select(`*, table:tables(*), order_items(*)`)
            .eq('id', payload.new.id)
            .maybeSingle();
          if (data) setOrders((prev) => [...prev, data as OrderWithItems]);
        } else if (payload.eventType === 'UPDATE') {
          const { data: freshOrder } = await supabase
            .from('orders')
            .select(`*, table:tables(*), order_items(*)`)
            .eq('id', payload.new.id)
            .maybeSingle();
          if (freshOrder) {
            setOrders((prev) =>
              prev.map((o) => o.id === freshOrder.id ? (freshOrder as OrderWithItems) : o)
            );
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [restaurantId, fetchOrders, supabase]);

  // Update status via server API route (with tenant check)
  const updateStatus = async (orderId: string, status: OrderStatus, locale = 'ar') => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, locale }),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  return { orders, loading, updateStatus, refetch: fetchOrders };
}

export function useOrderStatus(orderId: string) {
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!orderId) return;
    const fetchOrder = async () => {
      const { data } = await supabase
        .from('orders')
        .select(`*, table:tables(*), order_items(*)`)
        .eq('id', orderId)
        .maybeSingle();
      if (data) setOrder(data as OrderWithItems);
      setLoading(false);
    };
    fetchOrder();

    const channel = supabase
      .channel(`order-${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'orders',
        filter: `id=eq.${orderId}`,
      }, async (payload) => {
        const { data: freshOrder } = await supabase
          .from('orders')
          .select(`*, table:tables(*), order_items(*)`)
          .eq('id', orderId)
          .maybeSingle();
        if (freshOrder) setOrder(freshOrder as OrderWithItems);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId, supabase]);

  return { order, loading };
}
