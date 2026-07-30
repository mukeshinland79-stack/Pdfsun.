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
}

createRoot(document.getElementById('root')!).render(
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
