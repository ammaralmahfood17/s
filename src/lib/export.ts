'use client';

import { createClient } from '@/lib/supabase/client';
import type { Order, OrderItem } from '@/types';

function escapeCSV(val: unknown): string {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => headers.map(h => escapeCSV(row[h])).join(',')),
  ];
  return lines.join('\n');
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Export all orders for a date range ────────────────────
export async function exportOrdersCSV(
  restaurantId: string,
  dateFrom: string,
  dateTo: string,
  locale: 'en' | 'ar' = 'ar'
): Promise<void> {
  const supabase = createClient();

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, order_number, status, customer_name, notes,
      subtotal, total, payment_method, created_at,
      table:tables(name_en, name_ar),
      order_items(
        item_name_en, item_name_ar, quantity,
        unit_price, line_total, addons, notes
      )
    `)
    .eq('restaurant_id', restaurantId)
    .gte('created_at', `${dateFrom}T00:00:00`)
    .lte('created_at', `${dateTo}T23:59:59`)
    .order('created_at', { ascending: false });

  if (!orders || orders.length === 0) {
    alert(locale === 'ar' ? 'لا توجد طلبات في هذه الفترة' : 'No orders in this period');
    return;
  }

  // Flatten orders × items into rows
  const rows: Record<string, unknown>[] = [];

  for (const order of (orders as unknown) as (Order & {
    table?: { name_en: string; name_ar: string };
    order_items?: (OrderItem & { addons: { name_en: string; price: number }[] })[];
  })[]) {
    const items = order.order_items ?? [];

    if (items.length === 0) {
      rows.push({
        'Order Number': order.order_number,
        'Date': new Date(order.created_at).toLocaleDateString('en-BH'),
        'Time': new Date(order.created_at).toLocaleTimeString('en-BH', { hour: '2-digit', minute: '2-digit' }),
        'Table (EN)': order.table?.name_en ?? '',
        'Table (AR)': order.table?.name_ar ?? '',
        'Customer': order.customer_name ?? '',
        'Status': order.status,
        'Item (EN)': '',
        'Item (AR)': '',
        'Qty': '',
        'Unit Price (BHD)': '',
        'Addons': '',
        'Line Total (BHD)': '',
        'Order Total (BHD)': order.total?.toFixed(3),
        'Payment': order.payment_method,
        'Notes': order.notes ?? '',
      });
    } else {
      items.forEach((item, idx) => {
        rows.push({
          'Order Number': idx === 0 ? order.order_number : '',
          'Date': idx === 0 ? new Date(order.created_at).toLocaleDateString('en-BH') : '',
          'Time': idx === 0 ? new Date(order.created_at).toLocaleTimeString('en-BH', { hour: '2-digit', minute: '2-digit' }) : '',
          'Table (EN)': idx === 0 ? (order.table?.name_en ?? '') : '',
          'Table (AR)': idx === 0 ? (order.table?.name_ar ?? '') : '',
          'Customer': idx === 0 ? (order.customer_name ?? '') : '',
          'Status': idx === 0 ? order.status : '',
          'Item (EN)': item.item_name_en,
          'Item (AR)': item.item_name_ar,
          'Qty': item.quantity,
          'Unit Price (BHD)': item.unit_price?.toFixed(3),
          'Addons': (item.addons ?? []).map((a: { name_en: string; price: number }) => `${a.name_en} (+${a.price.toFixed(3)})`).join('; '),
          'Line Total (BHD)': item.line_total?.toFixed(3),
          'Order Total (BHD)': idx === 0 ? order.total?.toFixed(3) : '',
          'Payment': idx === 0 ? order.payment_method : '',
          'Notes': idx === 0 ? (order.notes ?? '') : '',
        });
      });
    }
  }

  const csv = toCSV(rows);
  const filename = `dokan-orders-${dateFrom}-to-${dateTo}.csv`;
  downloadCSV(csv, filename);
}

// ── Export top items report ────────────────────────────────
export async function exportItemsReportCSV(
  restaurantId: string,
  dateFrom: string,
  dateTo: string
): Promise<void> {
  const supabase = createClient();

  const { data: orderIds } = await supabase
    .from('orders')
    .select('id')
    .eq('restaurant_id', restaurantId)
    .gte('created_at', `${dateFrom}T00:00:00`)
    .lte('created_at', `${dateTo}T23:59:59`)
    .neq('status', 'cancelled');

  if (!orderIds?.length) {
    alert('No data');
    return;
  }

  const { data: items } = await supabase
    .from('order_items')
    .select('item_name_en, item_name_ar, quantity, line_total')
    .in('order_id', orderIds.map((o: { id: string }) => o.id));

  const itemMap: Record<string, { name_en: string; name_ar: string; qty: number; revenue: number }> = {};

  for (const item of (items ?? []) as { item_name_en: string; item_name_ar: string; quantity: number; line_total: number }[]) {
    const k = item.item_name_en;
    if (!itemMap[k]) itemMap[k] = { name_en: k, name_ar: item.item_name_ar, qty: 0, revenue: 0 };
    itemMap[k].qty += item.quantity;
    itemMap[k].revenue += Number(item.line_total);
  }

  const rows = Object.values(itemMap)
    .sort((a, b) => b.qty - a.qty)
    .map((item, i) => ({
      'Rank': i + 1,
      'Item (EN)': item.name_en,
      'Item (AR)': item.name_ar,
      'Qty Sold': item.qty,
      'Revenue (BHD)': item.revenue.toFixed(3),
    }));

  downloadCSV(toCSV(rows), `dokan-items-${dateFrom}-to-${dateTo}.csv`);
}
