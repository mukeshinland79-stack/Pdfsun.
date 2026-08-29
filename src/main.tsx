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

// Register Service Worker for PWA Offline Capability
registerServiceWorker();

// Silence benign Vite HMR WebSocket connection warnings & third-party ad/sodar fetch noise in sandboxed preview
if (typeof window !== 'undefined') {
  const isBenignNoise = (str: string): boolean => {
    const s = str.toLowerCase();
    return (
      s.includes('websocket closed without opened') ||
      s.includes('failed to connect to websocket') ||
      s.includes('[vite] failed to connect') ||
      s.includes('transition was aborted') ||
      s.includes('invalid state') ||
      s.includes('sodar') ||
      s.includes('adtrafficquality') ||
      s.includes('googlesyndication') ||
      s.includes('doubleclick') ||
      s.includes('googleadservices')
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

  window.addEventListener('unhandledrejection', (event) => {
    const reasonStr = String(
      event.reason?.message ||
      event.reason?.reason ||
      event.reason?.stack ||
      event.reason ||
      ''
    );
    if (isBenignNoise(reasonStr)) {
      event.preventDefault();
      if (typeof event.stopPropagation === 'function') {
        event.stopPropagation();
      }
    }
  });

  window.addEventListener('error', (event) => {
    const errorMsg = String(event.message || event.error?.message || '');
    if (isBenignNoise(errorMsg)) {
      event.preventDefault();
      if (typeof event.stopPropagation === 'function') {
        event.stopPropagation();
      }
    }
  });
}

// Global Pointerdown Ripple & Touch Feedback Engine for Interactive Buttons
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  document.addEventListener('pointerdown', (e) => {
    const target = (e.target as HTMLElement)?.closest('button, [role="button"], .btn-interactive, .btn-primary, .btn-secondary, .btn-accent, .btn-cta, a.btn');
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.className = 'btn-ripple-wave';
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    const computedStyle = window.getComputedStyle(target);
    if (computedStyle.position === 'static') {
      (target as HTMLElement).style.position = 'relative';
    }
    if (computedStyle.overflow !== 'hidden') {
      (target as HTMLElement).style.overflow = 'hidden';
    }

    target.appendChild(ripple);

    target.classList.add('btn-pulse-active');
    setTimeout(() => {
      target.classList.remove('btn-pulse-active');
    }, 250);

    setTimeout(() => {
      ripple.remove();
    }, 450);
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
