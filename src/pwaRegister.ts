import { useState, useEffect, useCallback } from 'react';

// Custom Type Definitions for PWA & Service Worker Lifecycle
export interface PWAState {
  isOffline: boolean;
  isInstallable: boolean;
  isOfflineReady: boolean;
  isUpdateAvailable: boolean;
  cachedAssetsCount: number;
}

const SW_URL = '/sw.js';
const CACHE_NAME = 'pdfsun-v1';

// Default list of core routes, fonts, icons, and static assets to precache for offline PDF tool functionality
export const CORE_PWA_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/sw.js',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap',
  'https://fonts.gstatic.com',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
];

/**
 * Executes a Stale-While-Revalidate fetch strategy for static assets
 */
export async function fetchWithStaleWhileRevalidate(requestUrl: string, cacheName: string = CACHE_NAME): Promise<Response> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return fetch(requestUrl);
  }

  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(requestUrl);

  // Fetch fresh asset in background to revalidate cache
  const networkFetch = fetch(requestUrl, { mode: requestUrl.startsWith('http') ? 'cors' : 'same-origin' })
    .then(async (response) => {
      if (response && response.ok) {
        await cache.put(requestUrl, response.clone());
      }
      return response;
    })
    .catch(() => cachedResponse || new Response('Offline Asset Unavailable', { status: 503 }));

  // Return cached asset immediately if available, revalidating in background
  return cachedResponse || networkFetch;
}

/**
 * Aggressively precaches all Google Fonts, SVG icons, stylesheet links, and tool icons
 */
export async function precacheAppFontsAndIcons(): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) return false;

  try {
    const cache = await caches.open(CACHE_NAME);
    const fontAndIconUrls = new Set<string>([
      'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap',
    ]);

    // Gather all icons, stylesheets, and font links in current document
    document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"], link[rel="icon"], link[rel="apple-touch-icon"], link[rel="preconnect"]').forEach((link) => {
      if (link.href && !link.href.startsWith('data:')) fontAndIconUrls.add(link.href);
    });

    // Gather external SVG icons or image assets
    document.querySelectorAll<HTMLImageElement>('img[src], svg image').forEach((img) => {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('data:')) fontAndIconUrls.add(src);
    });

    await Promise.allSettled(
      Array.from(fontAndIconUrls).map(async (url) => {
        try {
          const match = await cache.match(url);
          if (!match) {
            const res = await fetch(url, { mode: url.startsWith('http') ? 'cors' : 'same-origin' });
            if (res.ok) await cache.put(url, res);
          }
        } catch {
          // Ignore individual network failures
        }
      })
    );

    console.log('[PDFSun PWA] Fonts, icons, and static CSS assets aggressively precached.');
    return true;
  } catch {
    return false;
  }
}

/**
 * Pre-caches specific URLs into the PDFSun Service Worker CacheStorage
 */
export async function precacheToolAssets(urls: string[] = CORE_PWA_ASSETS): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return false;
  }

  try {
    const cache = await caches.open(CACHE_NAME);
    const fetchPromises = urls.map(async (url) => {
      try {
        const response = await fetch(url, { cache: 'no-cache', mode: url.startsWith('http') ? 'cors' : 'same-origin' });
        if (response.ok) {
          await cache.put(url, response.clone());
        }
      } catch (err) {
        console.warn(`[PDFSun PWA] Could not precache ${url}:`, err);
      }
    });

    await Promise.allSettled(fetchPromises);
    console.log('[PDFSun PWA] Core assets & fonts precached successfully for offline use.');
    return true;
  } catch (error) {
    console.error('[PDFSun PWA] Precache error:', error);
    return false;
  }
}

/**
 * Discovers and precaches all loaded script, style, font, and image assets on the current DOM page
 */
export async function precacheLoadedAppShell(): Promise<number> {
  if (typeof window === 'undefined' || !('caches' in window)) return 0;

  try {
    const cache = await caches.open(CACHE_NAME);
    const assetUrls = new Set<string>([
      '/',
      '/index.html',
      '/manifest.json',
      window.location.pathname,
    ]);

    // Include core static assets
    CORE_PWA_ASSETS.forEach((u) => assetUrls.add(u));

    // Find all scripts, stylesheet links, fonts, and images on current DOM
    document.querySelectorAll<HTMLScriptElement>('script[src]').forEach((s) => {
      if (s.src) assetUrls.add(s.src);
    });
    document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"], link[rel="modulepreload"], link[rel="icon"], link[rel="apple-touch-icon"]').forEach((l) => {
      if (l.href) assetUrls.add(l.href);
    });
    document.querySelectorAll<HTMLImageElement>('img[src]').forEach((img) => {
      if (img.src && !img.src.startsWith('data:')) assetUrls.add(img.src);
    });

    const urlsToFetch = Array.from(assetUrls);
    let cachedCount = 0;

    await Promise.allSettled(
      urlsToFetch.map(async (url) => {
        try {
          const match = await cache.match(url);
          if (!match) {
            const res = await fetch(url, { mode: url.startsWith('http') ? 'cors' : 'same-origin' });
            if (res.ok) {
              await cache.put(url, res.clone());
              cachedCount++;
            }
          } else {
            cachedCount++;
          }
        } catch {
          // Ignore fetch failures during offline cache scan
        }
      })
    );

    return cachedCount;
  } catch {
    return 0;
  }
}

let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Registers the PDFSun Service Worker and initializes background asset precaching & update polling.
 */
export function registerServiceWorker(options?: {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOfflineReady?: () => void;
}) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(SW_URL)
      .then((registration) => {
        swRegistration = registration;
        console.log('[PDFSun PWA] ServiceWorker registered with scope:', registration.scope);

        // Send cache trigger to SW if active
        if (registration.active) {
          registration.active.postMessage({
            type: 'CACHE_URLS',
            urls: CORE_PWA_ASSETS,
          });
        }

        // Check for service worker update every hour when online
        setInterval(() => {
          if (navigator.onLine && registration) {
            registration.update().catch(() => {});
          }
        }, 60 * 60 * 1000);

        // Check for updates on state change
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('[PDFSun PWA] New update available.');
                options?.onUpdate?.(registration);
                window.dispatchEvent(new CustomEvent('pwa-update-available', { detail: registration }));
              } else {
                console.log('[PDFSun PWA] Content is fully cached for offline use.');
                options?.onOfflineReady?.();
                options?.onSuccess?.(registration);
                window.dispatchEvent(new CustomEvent('pwa-offline-ready'));
              }
            }
          };
        };

        if (registration.active) {
          options?.onSuccess?.(registration);
          // Warm up cache in background
          precacheLoadedAppShell();
        }
      })
      .catch((error) => {
        console.error('[PDFSun PWA] ServiceWorker registration failed:', error);
      });

    // Handle controller change (SW update activated)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

/**
 * Communicates with active service worker to force activate waiting SW
 */
export function updateServiceWorker(): void {
  if (swRegistration && swRegistration.waiting) {
    swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}

/**
 * Manually checks for service worker updates from the server
 */
export async function checkForUpdates(): Promise<boolean> {
  if (swRegistration && navigator.onLine) {
    try {
      await swRegistration.update();
      return swRegistration.waiting !== null;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Clears old or corrupt PWA caches
 */
export async function clearPWACache(): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) return false;
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    console.log('[PDFSun PWA] Caches cleared.');
    return true;
  } catch {
    return false;
  }
}

/**
 * React hook to access PWA installation, offline status, update availability, and offline caching readiness.
 */
export function usePWAStatus() {
  const [isOffline, setIsOffline] = useState<boolean>(() => (typeof navigator !== 'undefined' ? !navigator.onLine : false));
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isOfflineReady, setIsOfflineReady] = useState<boolean>(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState<boolean>(false);
  const [cachedAssetsCount, setCachedAssetsCount] = useState<number>(0);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleOfflineReady = () => setIsOfflineReady(true);
    const handleUpdateAvailable = () => setIsUpdateAvailable(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-offline-ready', handleOfflineReady);
    window.addEventListener('pwa-update-available', handleUpdateAvailable);

    // Initial cache check & warm-up
    precacheLoadedAppShell().then((count) => {
      setCachedAssetsCount(count);
      if (count > 0) setIsOfflineReady(true);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-offline-ready', handleOfflineReady);
      window.removeEventListener('pwa-update-available', handleUpdateAvailable);
    };
  }, []);

  const installPWA = useCallback(async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
      }
    } catch (err) {
      console.error('[PDFSun PWA] Error installing PWA:', err);
    }
  }, [deferredPrompt]);

  const triggerPrecache = useCallback(async (customUrls?: string[]) => {
    const success = await precacheToolAssets(customUrls);
    if (success) {
      const count = await precacheLoadedAppShell();
      setCachedAssetsCount(count);
      setIsOfflineReady(true);
    }
    return success;
  }, []);

  return {
    isOffline,
    isInstallable,
    isOfflineReady,
    isUpdateAvailable,
    cachedAssetsCount,
    installPWA,
    updateServiceWorker,
    checkForUpdates,
    clearPWACache,
    precacheAssets: triggerPrecache,
  };
}


