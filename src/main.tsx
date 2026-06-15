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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register Progressive Web App Service Worker
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('[Service Worker] Registro realizado com sucesso. Escopo:', reg.scope);
      })
      .catch((err) => {
        console.error('[Service Worker] Erro ao registrar:', err);
      });
  });
} else if ('serviceWorker' in navigator) {
  // Em desenvolvimento, também registramos para testes, mas garantindo que recarregue se mudado
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('[Service Worker] Registro de desenvolvimento bem-sucedido:', reg.scope);
      })
      .catch((err) => {
        console.warn('[Service Worker] Registro de desenvolvimento ignorado/falhou:', err);
      });
  });
}

