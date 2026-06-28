import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// ── Install web-push: npm install web-push @types/web-push ──
// Set in .env.local:
//   VAPID_PUBLIC_KEY=...
//   VAPID_PRIVATE_KEY=...
//   VAPID_EMAIL=mailto:admin@dokan.bh

const STATUS_MESSAGES: Record<string, { en: string; ar: string; requireInteraction: boolean }> = {
  confirmed: {
    en: 'Your order has been confirmed! 🎉',
    ar: 'تم تأكيد طلبك! 🎉',
    requireInteraction: false,
  },
  preparing: {
    en: 'Your order is being prepared 🍳',
    ar: 'جارٍ تحضير طلبك 🍳',
    requireInteraction: false,
  },
  ready: {
    en: 'Your order is READY! Come pick it up 🔔',
    ar: 'طلبك جاهز! تفضل بالاستلام 🔔',
    requireInteraction: true,
  },
  cancelled: {
    en: 'Your order was cancelled.',
    ar: 'تم إلغاء طلبك.',
    requireInteraction: false,
  },
};

export async function POST(request: NextRequest) {
  try {
    const { orderId, status, locale = 'ar' } = await request.json();

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Missing orderId or status' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get push subscriptions for this order
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth_key')
      .eq('order_id', orderId);

    if (!subs || subs.length === 0) {
      return NextResponse.json({ sent: 0 });
    }

    // Get order number for notification title
    const { data: order } = await supabase
      .from('orders')
      .select('order_number')
      .eq('id', orderId)
      .single();

    const msg = STATUS_MESSAGES[status];
    if (!msg) return NextResponse.json({ sent: 0 });

    const isAr = locale === 'ar';
    const title = `Dokan ${order?.order_number ?? ''} · ${isAr ? 'دكان' : 'Dokan'}`;
    const body = isAr ? msg.ar : msg.en;

    // Try to use web-push if available
    let sent = 0;
    try {
      const webpush = await import('web-push');

      if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
        webpush.default.setVapidDetails(
          process.env.VAPID_EMAIL ?? 'mailto:admin@dokan.bh',
          process.env.VAPID_PUBLIC_KEY,
          process.env.VAPID_PRIVATE_KEY
        );

        await Promise.allSettled(
          subs.map((sub: { endpoint: string; p256dh: string; auth_key: string }) =>
            webpush.default.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth_key },
              },
              JSON.stringify({
                title,
                body,
                tag: `order-${orderId}`,
                requireInteraction: msg.requireInteraction,
                url: `/ar/track/${orderId}`,
                orderId,
                icon: '/icon-192.png',
              })
            )
          )
        );
        sent = subs.length;
      }
    } catch {
      // web-push not installed — push silently skipped

    }

    return NextResponse.json({ sent });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
