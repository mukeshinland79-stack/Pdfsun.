import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from './lib/i18n';
import { ErrorBoundary } from './components/ErrorBoundary';
import { registerServiceWorker } from './pwaRegister';

// Register Service Worker for PWA Offline Capability
registerServiceWorker();

// Silence benign Vite HMR WebSocket connection warnings in sandboxed preview
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const msg = args.map((a) => (typeof a === 'object' ? String(a?.message || JSON.stringify(a)) : String(a))).join(' ');
    if (
      msg.includes('WebSocket closed without opened') ||
      msg.includes('failed to connect to websocket') ||
      msg.includes('[vite] failed to connect')
    ) {
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
    if (
      reasonStr.includes('WebSocket') ||
      reasonStr.includes('vite') ||
      reasonStr.includes('closed without opened') ||
      reasonStr.includes('failed to connect') ||
      reasonStr.includes('ws://') ||
      reasonStr.includes('wss://')
    ) {
      event.preventDefault();
      if (typeof event.stopPropagation === 'function') {
        event.stopPropagation();
      }
    }
  });

  window.addEventListener('error', (event) => {
    const errorMsg = String(event.message || event.error?.message || '');
    if (
      errorMsg.includes('WebSocket') ||
      errorMsg.includes('vite') ||
      errorMsg.includes('closed without opened') ||
      errorMsg.includes('failed to connect') ||
      errorMsg.includes('ws://') ||
      errorMsg.includes('wss://')
    ) {
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
