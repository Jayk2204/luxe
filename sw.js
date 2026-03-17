// ============================================================
// sw.js — LUXE Service Worker (PWA)
// ============================================================

const CACHE  = 'luxe-v1';
const STATIC = [
  '/',
  '/index.html',
  '/products.html',
  '/cart.html',
  '/auth.html',
  '/css/main.css',
  '/js/app.js',
  '/js/products.js',
  '/js/cart.js',
  '/js/firebase-config.js',
  '/js/auth.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&family=Bebas+Neue&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
];

// ── Install: cache static assets ─────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC.map(u => new Request(u, { mode: 'no-cors' }))))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: clear old caches ────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: network-first for API, cache-first for assets ──
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always network-first for Firebase / API calls
  if (url.hostname.includes('firebase') || url.hostname.includes('googleapis') || url.pathname.includes('/api/')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }

  // Cache-first for static assets
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const resClone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, resClone));
        return res;
      }).catch(() => {
        // Offline fallback for HTML pages
        if (e.request.mode === 'navigate') return caches.match('/index.html');
      });
    })
  );
});
