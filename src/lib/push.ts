'use client';

import { createClient } from '@/lib/supabase/client';

// ── VAPID public key (generate your own at https://web-push-codelab.glitch.me/)
// Set NEXT_PUBLIC_VAPID_PUBLIC_KEY in .env.local
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ── Register service worker ────────────────────────────────
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    return reg;
  } catch (err) {

    return null;
  }
}

// ── Subscribe to push ──────────────────────────────────────
export async function subscribeToPush(
  orderId: string,
  restaurantId: string
): Promise<boolean> {
  if (!VAPID_PUBLIC_KEY) {

    return false;
  }
  if (!('Notification' in window) || !('PushManager' in window)) return false;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const reg = await registerServiceWorker();
    if (!reg) return false;

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
    });

    const sub = subscription.toJSON();
    const supabase = createClient();

    await supabase.from('push_subscriptions').upsert({
      order_id: orderId,
      restaurant_id: restaurantId,
      endpoint: sub.endpoint!,
      p256dh: (sub.keys as Record<string, string>)?.p256dh ?? '',
      auth_key: (sub.keys as Record<string, string>)?.auth ?? '',
    }, { onConflict: 'order_id,endpoint' });

    return true;
  } catch (err) {

    return false;
  }
}

// ── Show local notification (no server needed for same-tab) ─
export function showLocalNotification(title: string, body: string, url?: string) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        tag: 'dokan-order',
        data: { url },
      });
    });
  }
}

// ── Check push support ─────────────────────────────────────
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

// ── Request notification permission ───────────────────────
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  return Notification.requestPermission();
}
