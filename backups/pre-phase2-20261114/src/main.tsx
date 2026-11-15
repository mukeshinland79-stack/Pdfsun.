import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from './lib/i18n';
import { ErrorBoundary } from './components/ErrorBoundary';
import { registerServiceWorker } from './pwaRegister';
import { setupGlobalFetchInterceptor } from './lib/fetchInterceptor';

// Initialize global network fetch interceptor to handle errors, 4xx/5xx responses, and timeouts
setupGlobalFetchInterceptor();

// Defer Service Worker registration until after load & idle to protect LCP/INP
if (typeof window !== 'undefined') {
  const scheduleSw = () => {
    if (typeof (window as any).requestIdleCallback === 'function') {
      (window as any).requestIdleCallback(() => registerServiceWorker(), { timeout: 3000 });
    } else {
      setTimeout(() => registerServiceWorker(), 1500);
    }
  };
  if (document.readyState === 'complete') {
    scheduleSw();
  } else {
    window.addEventListener('load', scheduleSw, { once: true });
  }
}

// Silence benign Vite HMR WebSocket connection warnings & third-party ad/sodar fetch noise in sandboxed preview
if (typeof window !== 'undefined') {
  const isBenignNoise = (str: string): boolean => {
    const s = str.toLowerCase();
    return (
      s.includes('websocket closed') ||
      s.includes('clean finish') ||
      s.includes('websocket closed without') ||
      s.includes('failed to connect to websocket') ||
      s.includes('[vite] failed to connect') ||
      s.includes('transition was aborted') ||
      s.includes('invalid state') ||
      s.includes('sodar') ||
      s.includes('adtrafficquality') ||
      s.includes('googlesyndication') ||
      s.includes('doubleclick') ||
      s.includes('googleadservices') ||
      s.includes('clarity.ms') ||
      s.includes('pagead2') ||
      s.includes('failed to fetch') ||
      s.includes('load failed') ||
      s.includes('networkerror when attempting to fetch resource') ||
      s.includes('the user aborted a request') ||
      s.includes('aborterror') ||
      s.includes('resizeobserver loop') ||
      s.includes('the play() request was interrupted')
    );
  };

  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const msg = args.map((a) => (typeof a === 'object' ? String(a?.message || JSON.stringify(a)) : String(a))).join(' ');
    if (isBenignNoise(msg)) {
      return;
    }
    originalConsoleError.apply(console, args);
  };

  // Global Unhandled Promise Rejection & Error Handler
  // Pdfsun.in ke unexpected app crashes aur debug logs ko handle karta hai.
  window.addEventListener('unhandledrejection', (event) => {
    // Silent handling of WebSocket closures and non-critical network drops
    const reasonMsg = String(
      event.reason?.message ||
      event.reason?.reason ||
      event.reason?.stack ||
      event.reason ||
      ''
    );

    if (
      event.reason &&
      (reasonMsg.includes('WebSocket') ||
       reasonMsg.includes('websocket') ||
       isBenignNoise(reasonMsg))
    ) {
      console.warn('[Pdfsun Network] Handled silent WebSocket rejection:', event.reason);
      event.preventDefault(); // Unhandled Error Alert ko rokta hai
      if (typeof event.stopPropagation === 'function') {
        event.stopPropagation();
      }
      return;
    }

    // Generic fallback handling for other async rejections
    console.warn('[Pdfsun Global Rejection Handler]:', event.reason);
    event.preventDefault();
    if (typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    }
  });

  window.addEventListener('error', (event) => {
    const errorMsg = String(event.message || event.error?.message || '');
    if (isBenignNoise(errorMsg)) {
      event.preventDefault();
      if (typeof event.stopPropagation === 'function') {
        event.stopPropagation();
      }
      return;
    }
    console.error('[Pdfsun Global Error Caught]:', event.error || event.message);
  });
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <LanguageProvider>
          <HelmetProvider>
            <App />
          </HelmetProvider>
        </LanguageProvider>
      </ErrorBoundary>
    </StrictMode>,
  );
}
