// =============================================================
// PWA Service Worker - Offline-First Architecture
// Caches shell + API responses, queues offline mutations
// =============================================================

const CACHE_NAME = 'reimburseflow-v1';
const API_BASE = 'http://localhost:3001/api';

// App shell assets to cache on install
const SHELL_ASSETS = [
  '/',
  '/index.html',
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate event - delete old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch event - network-first for API, cache-first for assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API requests: network-first with cache fallback
  if (url.href.startsWith(API_BASE) && event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // POST/PATCH offline queueing for expense mutations
  if (url.href.startsWith(API_BASE) && ['POST', 'PATCH'].includes(event.request.method)) {
    event.respondWith(
      fetch(event.request).catch(async () => {
        // Queue the request for background sync
        const body = await event.request.clone().text();
        const queue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
        queue.push({
          url: event.request.url,
          method: event.request.method,
          body,
          timestamp: Date.now(),
        });
        localStorage.setItem('offline_queue', JSON.stringify(queue));

        return new Response(
          JSON.stringify({ offline: true, message: 'Queued for sync when online' }),
          { status: 202, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

// Background sync for queued mutations
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-expenses') {
    event.waitUntil(syncQueuedRequests());
  }
});

async function syncQueuedRequests() {
  const queue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
  const remaining = [];
  for (const req of queue) {
    try {
      await fetch(req.url, {
        method: req.method,
        body: req.body,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      remaining.push(req);
    }
  }
  localStorage.setItem('offline_queue', JSON.stringify(remaining));

  // Notify all clients
  const clients = await self.clients.matchAll();
  clients.forEach((client) => client.postMessage({ type: 'SYNC_COMPLETE', remaining: remaining.length }));
}

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? { title: 'ReimburseFlow', body: 'You have a new update.' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      tag: 'reimburseflow',
      data: data.url,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow(event.notification.data || '/')
  );
});
