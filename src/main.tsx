import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign development websocket errors
if (typeof window !== 'undefined') {
  const isWsError = (msg?: string) => {
    if (!msg) return false;
    const lower = msg.toLowerCase();
    return lower.includes('websocket') || 
           lower.includes('ws://') || 
           lower.includes('wss://') || 
           lower.includes('failed to connect') ||
           lower.includes('connection refused') ||
           lower.includes('closed without opened');
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    let msg = '';
    if (reason) {
      msg = reason.message || (typeof reason === 'string' ? reason : String(reason));
    }
    if (isWsError(msg)) {
      event.preventDefault();
      event.stopPropagation();
      console.warn('[Vite Browser Sync Tracker - Ignored Rejection]:', msg);
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event.message || event.error?.message;
    if (isWsError(msg)) {
      event.preventDefault();
      event.stopPropagation();
      console.warn('[Vite Browser Sync Tracker - Ignored Error]:', msg);
    }
  }, true);
}

import { AuthProvider } from './context/AuthContext.tsx';
import { FiltersProvider } from './context/FiltersContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <FiltersProvider>
        <App />
      </FiltersProvider>
    </AuthProvider>
  </StrictMode>,
);

// Register PWA Service Worker — never inside Lovable preview/iframe/dev,
// and unregister any stale SW + clear caches in those contexts.
if ('serviceWorker' in navigator) {
  const host = window.location.hostname;
  const inIframe = window.self !== window.top;
  const isLovablePreview =
    host.startsWith('id-preview--') ||
    host.startsWith('preview--') ||
    host.endsWith('.lovableproject.com') ||
    host.endsWith('.lovable.app') ||
    host.endsWith('.lovable.dev');
  const killSwitch = new URLSearchParams(window.location.search).get('sw') === 'off';
  const shouldRegister = import.meta.env.PROD && !inIframe && !isLovablePreview && !killSwitch;

  if (shouldRegister) {
    window.addEventListener('load', () => {
      // Record if the page was already controlled by a service worker on load
      const isAlreadyControlled = !!navigator.serviceWorker.controller;

      // Handle controller changes (new service worker taking over)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (isAlreadyControlled) {
          console.log('[SW] Novo service worker ativado. Atualizando a página silenciosamente...');
          window.location.reload();
        }
      });

      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('[SW] Registrado. Escopo:', reg.scope);

          // Poll for service worker updates every 30 minutes
          const updateInterval = setInterval(() => {
            reg.update().catch((err) => console.warn('[SW] Falha ao checar atualizações:', err));
          }, 30 * 60 * 1000);

          // Cleanup interval if page is unloaded (though it is main.tsx/SPA shell)
          window.addEventListener('unload', () => clearInterval(updateInterval));
        })
        .catch((err) => console.warn('[SW] Falha ao registrar:', err));
    });
  } else {
    // Cleanup: remove any previously installed SW + caches in preview/dev
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    }).catch(() => {});
    if (typeof caches !== 'undefined') {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
    }
  }
}

