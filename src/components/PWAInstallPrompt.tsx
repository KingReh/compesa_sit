import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Download, X, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsOpen(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsOpen(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    const handleReopen = () => {
      const installed =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      if (installed) return;
      setIsOpen(true);
    };
    window.addEventListener('reopen-pwa-prompt', handleReopen);
    return () => window.removeEventListener('reopen-pwa-prompt', handleReopen);
  }, []);

  const [unavailableHint, setUnavailableHint] = useState(false);

  const handleInstallClick = async () => {
    if (deferredPrompt && typeof deferredPrompt.prompt === 'function') {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setIsOpen(false);
        }
        setDeferredPrompt(null);
      } catch {
        setDeferredPrompt(null);
      }
    } else {
      setUnavailableHint(true);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
  };

  if (isInstalled || !isOpen) return null;

  const node = (
    <AnimatePresence>
      <div
        id="pwa-install-container"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-md pointer-events-none"
        style={{ position: 'fixed' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="sit-panel p-5 text-white shadow-2xl border border-brand-border/40 relative overflow-hidden backdrop-blur-xl pointer-events-auto"
          style={{ background: 'linear-gradient(135deg, #1861B5 0%, #034289 100%)' }}
        >
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-accent to-transparent" />

          <button
            id="close-pwa-button"
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-brand-muted hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
            aria-label="Ignorar instalação"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex gap-4">
            <div className="bg-white/15 p-3 rounded-2xl flex-shrink-0 h-12 w-12 flex items-center justify-center text-brand-accent shadow-inner border border-white/10">
              <Smartphone className="w-6 h-6" />
            </div>
            <div className="flex-1 pr-6">
              <span className="typ-subtitle text-xs block text-brand-accent font-bold">
                APLICATIVO INSTALÁVEL
              </span>
              <h4 className="typ-card-title text-base font-extrabold text-white mt-0.5 leading-tight">
                SIT no seu Computador ou Celular
              </h4>
              <p className="text-xs text-brand-muted mt-2 leading-relaxed">
                Adicione o <strong>SIT - Sistemas Integrados Terceirizados</strong> à sua tela
                inicial para acesso rápido e instantâneo.
              </p>

              <div className="flex gap-3 mt-4 flex-wrap">
                {canInstall && (
                  <button
                    onClick={handleInstallClick}
                    className="px-4 py-2 text-xs font-bold rounded-lg sit-button-primary flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Instalar Agora
                  </button>
                )}
                <button
                  onClick={handleDismiss}
                  className="px-3 py-2 text-xs font-semibold text-brand-muted hover:text-white transition-colors"
                >
                  Mais Tarde
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(node, document.body) : null;
}
