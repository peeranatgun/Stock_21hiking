// sw.js — Service Worker for 21Hiking Stock PWA
const CACHE_NAME = '21hiking-stock-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/products.html',
  '/brands.html',
  '/sales.html',
  '/expenses.html',
  '/reports.html',
  '/style.css',
  '/app.js',
  '/auth.js',
  '/brands.js',
  '/products.js',
  '/sales.js',
  '/expenses.js',
  '/reports.js',
  '/storage.js',
  '/supabase.js',
  '/manifest.json',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  // Network first for API calls, cache first for assets
  if (request.url.includes('supabase.co')) {
    event.respondWith(fetch(request).catch(() => new Response('offline', { status: 503 })));
    return;
  }
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok && request.method === 'GET') {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(c => c.put(request, clone));
      }
      return response;
    }))
  );
});
