// PDF Sun PRO AI Progressive Web App (PWA) Service Worker - Master Blue Suite (v6.0)
const CACHE_NAME = 'pdfsun-pro-ai-v6.0';
const WASM_CACHE_NAME = 'pdfsun-wasm-binaries-v6.0';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/logo-blue.svg',
  '/logo-light.svg',
  '/logo-dark.svg',
  '/logo-stacked.svg',
  '/assets/logo.svg',
  '/assets/pwa-512.png',
  '/assets/logo-horizontal.png',
  '/site.webmanifest',
  '/manifest.json',
  '/favicon.ico',
  '/favicon.svg',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/favicon-48x48.png',
  '/favicon-96x96.png',
  '/favicon-144x144.png',
  '/favicon-192x192.png',
  '/favicon-512x512.png',
  '/apple-touch-icon.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/logo.png'
];

// Detect development or preview environment
const isDev =
  self.location.hostname.includes('ais-dev') ||
  self.location.hostname.includes('localhost') ||
  self.location.hostname.includes('127.0.0.1');

// Install Event - Precache App Shell & Brand Suite
self.addEventListener('install', (event) => {
  if (isDev) {
    self.skipWaiting();
    return;
  }
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[PDF Sun PRO AI SW v6.0] Pre-caching app shell & blue suite assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Sovereign Automated Cache Purge Protocol for legacy caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME && cache !== WASM_CACHE_NAME) {
            console.log('[PDF Sun PRO AI SW v6.0] Purging legacy cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(async () => {
      if (isDev) {
        console.log('[PDF Sun PRO AI SW] Unregistering dev service worker');
        await self.registration.unregister();
      }
      return self.clients.claim();
    })
  );
});

// Message Event Listener
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
  if (isDev) return;
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // ALWAYS bypass cache for Vite dev server, node_modules, HMR, source code
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
    url.pathname.endsWith('.jsx')
  ) {
    return;
  }

  // 1. STRATEGY: Cache-First for WebAssembly .wasm binaries & Static Brand SVG/PNG Assets
  if (
    url.pathname.endsWith('.wasm') ||
    url.pathname.includes('/assets/logo') ||
    url.pathname.includes('/assets/favicon') ||
    url.pathname.includes('/favicon') ||
    url.pathname.includes('/logo-')
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            const targetCache = url.pathname.endsWith('.wasm') ? WASM_CACHE_NAME : CACHE_NAME;
            caches.open(targetCache).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 2. STRATEGY: Network-first with Offline Cache fallback for HTML navigations
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
          return caches.match('/') || caches.match('/index.html');
        })
    );
    return;
  }

  // 3. STRATEGY: Stale-While-Revalidate for UI scripts, stylesheets & Fonts
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (url.origin === location.origin ||
              url.hostname.includes('fonts.googleapis.com') ||
              url.hostname.includes('fonts.gstatic.com'))
          ) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
