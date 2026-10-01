// Service Worker for Yokohama Attendance Mobile PWA
const CACHE_NAME = 'attendance-pwa-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Strictly bypass service worker for Next.js build assets, admin, console, and APIs
  if (
    event.request.method !== 'GET' || 
    url.pathname.startsWith('/_next/') || 
    url.pathname.startsWith('/admin') || 
    url.pathname.startsWith('/console') || 
    url.pathname.startsWith('/api')
  ) {
    return;
  }

  // Network-First strategy
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
