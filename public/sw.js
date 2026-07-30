// PDFSun Progressive Web App (PWA) Service Worker
const CACHE_NAME = 'pdfsun-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install Event - Precache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[PDFSun SW] Pre-caching app shell and core assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up stale caches & claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[PDFSun SW] Removing stale cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Smart caching strategy for offline availability
self.addEventListener('fetch', (event) => {
  // Ignore non-GET requests or external extensions
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Handle HTML navigation requests (Network-first with Offline Cache fallback)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/', responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          console.log('[PDFSun SW] Network failed. Serving cached app shell for navigation.');
          return caches.match('/') || caches.match('/index.html');
        })
    );
    return;
  }

  // Stale-While-Revalidate strategy for static assets (JS, CSS, images, WASM, fonts)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (url.origin === location.origin || url.hostname.includes('cdnjs') || url.hostname.includes('jsdelivr'))
          ) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch((err) => {
          // Silent catch on offline network failure for assets already cached
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
