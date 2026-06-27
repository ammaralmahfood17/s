// ============================================================
// DOKAN Service Worker — Push Notifications + Runtime Caching
// Place this file at: public/sw.js
// ============================================================

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `dokan-static-${CACHE_VERSION}`;
const IMAGE_CACHE = `dokan-images-${CACHE_VERSION}`;
const FONT_CACHE = `dokan-fonts-${CACHE_VERSION}`;

// ── Assets to pre-cache on install ───────────────────────────
const PRE_CACHE = [
  '/',
  '/icon-192.png',
  '/icon-512.png',
  '/badge-72.png',
];

// ── Install: pre-cache core assets ──────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRE_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: clean old caches ──────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== IMAGE_CACHE && k !== FONT_CACHE)
          .map((k) => caches.delete(k))
      );
    }).then(() => clients.claim())
  );
});

// ── Fetch: runtime caching strategies ───────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // ── Google Fonts: cache-first (they rarely change) ────
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(FONT_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // ── Image assets: cache-first ─────────────────────────
  if (request.destination === 'image' || /\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(IMAGE_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // ── Navigation requests: network-first (fresh pages) ──
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/');
      })
    );
    return;
  }

  // ── Other static assets: cache-first ─────────────────
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request);
    })
  );
});

// ── Push notifications (existing functionality) ──────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Dokan', body: event.data.text() };
  }

  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: '/badge-72.png',
    tag: data.tag || 'dokan-order',
    renotify: true,
    requireInteraction: data.requireInteraction || false,
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      orderId: data.orderId,
    },
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Dokan · دكان', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Background sync for offline order queuing (future)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    // Handle offline order sync
  }
});
