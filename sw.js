/**
 * Tacosium MVP — Service Worker
 * Strategy:
 *   - App shell (HTML / root)        → Stale-While-Revalidate
 *   - Same-origin static assets      → Cache-First
 *   - Tailwind CDN (cross-origin)    → Stale-While-Revalidate (opaque-safe)
 *
 * Goal: After the first load, the festival booth game must boot from cache
 * even with zero connectivity (cellular dead-zones in crowded areas).
 */

const CACHE_VERSION = 'tacosium-v1';
const TAILWIND_CDN = 'https://cdn.tailwindcss.com';

// Precache the app shell.
const PRECACHE_URLS = [
  './',
  './index.html',
  './sw.js',
  TAILWIND_CDN,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      // `{cache: 'reload'}` avoids the HTTP cache when fetching the precache list.
      cache.addAll(
        PRECACHE_URLS.map((u) => new Request(u, { cache: 'reload' }))
      )
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/**
 * Stale-While-Revalidate: return cached copy immediately, refresh in background.
 * Works for both same-origin and opaque cross-origin responses.
 */
function staleWhileRevalidate(request) {
  return caches.open(CACHE_VERSION).then((cache) =>
    cache.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && (response.ok || response.type === 'opaque')) {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => cached); // offline — fall back to cache
      return cached || networkFetch;
    })
  );
}

/**
 * Cache-First: serve from cache; if missing, hit the network and cache it.
 */
function cacheFirst(request) {
  return caches.open(CACHE_VERSION).then((cache) =>
    cache.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.ok) cache.put(request, response.clone());
        return response;
      });
    })
  );
}

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GET; everything else (POST, etc.) goes straight to network.
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Navigation requests (HTML) → SWR so we always have a working shell offline.
  if (req.mode === 'navigate' || (req.destination === 'document')) {
    event.respondWith(
      staleWhileRevalidate(req).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Tailwind CDN → SWR (opaque-safe).
  if (url.origin === 'https://cdn.tailwindcss.com') {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  // Same-origin static assets → Cache-First.
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // Other cross-origin → SWR best effort.
  event.respondWith(staleWhileRevalidate(req));
});
