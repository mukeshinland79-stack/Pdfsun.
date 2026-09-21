// PDFSun Progressive Web App (PWA) Service Worker - Master Brand Cache Purge Protocol (v5.0)
const CACHE_NAME = 'pdfsun-master-brand-v5.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/logo-light.svg?v=5.0_master_brand',
  '/logo-dark.svg?v=5.0_master_brand',
  '/logo-stacked.svg?v=5.0_master_brand',
  '/site.webmanifest?v=5.0_master_brand',
  '/manifest.json',
  '/favicon.ico?v=5.0_master_brand',
  '/favicon.svg?v=5.0_master_brand',
  '/favicon-16x16.png?v=5.0_master_brand',
  '/favicon-32x32.png?v=5.0_master_brand',
  '/favicon-48x48.png?v=5.0_master_brand',
  '/apple-touch-icon.png?v=5.0_master_brand',
  '/android-chrome-192x192.png?v=5.0_master_brand',
  '/android-chrome-512x512.png?v=5.0_master_brand',
  '/logo.png?v=5.0_master_brand'
];

// Detect development or preview environment
const isDev =
  self.location.hostname.includes('ais-dev') ||
  self.location.hostname.includes('localhost') ||
  self.location.hostname.includes('127.0.0.1');

// Install Event - Precache App Shell
self.addEventListener('install', (event) => {
  if (isDev) {
    self.skipWaiting();
    return;
  }
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[PDFSun SW v5.0] Pre-caching app shell & master brand assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Sovereign Automated Cache Purge Protocol for legacy caches & claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[PDFSun SW v5.0] Purging legacy cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(async () => {
      if (isDev) {
        console.log('[PDFSun SW] Unregistering dev service worker');
        await self.registration.unregister();
      }
      return self.clients.claim();
    })
  );
});

// Message Event Listener - For dynamic asset precaching & update triggers
self.addEventListener('message', (event) => {
  if (isDev || !event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CACHE_URLS' && Array.isArray(event.data.urls)) {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return Promise.allSettled(
          event.data.urls.map((url) =>
            fetch(url, { cache: 'no-cache' })
              .then((res) => {
                if (res && res.status === 200) {
                  return cache.put(url, res);
                }
              })
              .catch(() => {})
          )
        );
      })
    );
  }
});

self.addEventListener('fetch', (event) => {
  // Completely bypass Service Worker in development mode
  if (isDev) return;

  // Ignore non-GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // ALWAYS bypass cache for Vite dev server, node_modules, HMR, source code, and versioned JS pre-bundled chunks
  if (
    url.pathname.includes('/node_modules/') ||
    url.pathname.includes('/.vite/') ||
    url.pathname.includes('/@vite/') ||
    url.pathname.includes('/@fs/') ||
    url.pathname.includes('/src/') ||
    url.search.includes('v=') ||
    url.search.includes('t=') ||
    url.pathname.endsWith('.tsx') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('.jsx') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.mjs')
  ) {
    return;
  }

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

  // Network-first strategy for static assets
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (url.origin === location.origin ||
            url.hostname.includes('cdnjs') ||
            url.hostname.includes('jsdelivr') ||
            url.hostname.includes('fonts.googleapis.com') ||
            url.hostname.includes('fonts.gstatic.com'))
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
