import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Download, Share2, PlusSquare, X, Smartphone, ArrowRight, Check, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Platform = 'android-chrome' | 'ios-safari' | 'desktop-chrome' | 'firefox' | 'other';

function detectPlatform(): Platform {
  const ua = window.navigator.userAgent;
  const isIpad = ua.indexOf('iPad') > -1 || ((navigator.maxTouchPoints || 0) > 2 && ua.indexOf('Macintosh') > -1);
  const isIphone = ua.indexOf('iPhone') > -1 || ua.indexOf('iPod') > -1;
  if (isIpad || isIphone) return 'ios-safari';
  if (/Firefox/i.test(ua)) return 'firefox';
  if (/Android/i.test(ua)) return 'android-chrome';
  if (/Chrome|Edg|OPR/i.test(ua)) return 'desktop-chrome';
  return 'other';
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [platform, setPlatform] = useState<Platform>('other');
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showGuidance, setShowGuidance] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone
      || document.referrer.includes('android-app://');

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    setPlatform(detectPlatform());

    const isDismissed = localStorage.getItem('@sit:pwa-prompt-dismissed');

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isDismissed) {
        setTimeout(() => setIsOpen(true), 3000);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsOpen(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // iOS Safari has no beforeinstallprompt — show auto if not dismissed
    if (!isDismissed && (detectPlatform() === 'ios-safari')) {
      const t = setTimeout(() => setIsOpen(true), 3000);
      return () => {
        clearTimeout(t);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    const handleReopen = () => {
      const installed = window.matchMedia('(display-mode: standalone)').matches
        || (window.navigator as any).standalone
        || document.referrer.includes('android-app://');
      if (installed) return;
      localStorage.removeItem('@sit:pwa-prompt-dismissed');
      setShowGuidance(false);
      setIsOpen(true);
    };
    window.addEventListener('reopen-pwa-prompt', handleReopen);
    return () => window.removeEventListener('reopen-pwa-prompt', handleReopen);
  }, []);

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
        return;
      } catch {
        // fall through to guidance
      }
    }
    // No native prompt available — show platform-specific instructions
    setShowGuidance(true);
  };

  const handleDismiss = () => {
    setIsOpen(false);
    setShowGuidance(false);
    localStorage.setItem('@sit:pwa-prompt-dismissed', 'true');
  };

  if (isInstalled || !isOpen) return null;

  const renderGuidance = () => {
    if (platform === 'ios-safari') {
      return (
        <ol className="space-y-3.5 text-xs text-white pl-1">
          <li className="flex items-start gap-2.5">
            <span className="flex-shrink-0 bg-brand-border/40 text-brand-accent w-5 h-5 text-center leading-5 text-[10px] font-extrabold rounded-full">1</span>
            <span>Toque no botão de <strong>Compartilhar</strong> <Share2 className="inline w-3.5 h-3.5 mx-0.5 text-brand-accent" /> na barra do Safari.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="flex-shrink-0 bg-brand-border/40 text-brand-accent w-5 h-5 text-center leading-5 text-[10px] font-extrabold rounded-full">2</span>
            <span>Selecione <strong>Adicionar à Tela de Início</strong> <PlusSquare className="inline w-3.5 h-3.5 mx-0.5 text-brand-accent" />.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="flex-shrink-0 bg-brand-border/40 text-brand-accent w-5 h-5 text-center leading-5 text-[10px] font-extrabold rounded-full">3</span>
            <span>Toque em <strong>Adicionar</strong> para finalizar.</span>
          </li>
        </ol>
      );
    }
    if (platform === 'firefox') {
      return (
        <p className="text-xs text-white leading-relaxed">
          O Firefox para desktop não oferece instalação nativa de PWAs. Use o <strong>Chrome</strong>, <strong>Edge</strong> ou <strong>Brave</strong> para instalar o SIT, ou no Firefox Android toque no menu <strong>⋮</strong> → <strong>Instalar</strong>.
        </p>
      );
    }
    // android-chrome / desktop-chrome / other
    return (
      <ol className="space-y-3.5 text-xs text-white pl-1">
        <li className="flex items-start gap-2.5">
          <span className="flex-shrink-0 bg-brand-border/40 text-brand-accent w-5 h-5 text-center leading-5 text-[10px] font-extrabold rounded-full">1</span>
          <span>Abra o menu do navegador (<strong>⋮</strong> no canto superior direito).</span>
        </li>
        <li className="flex items-start gap-2.5">
          <span className="flex-shrink-0 bg-brand-border/40 text-brand-accent w-5 h-5 text-center leading-5 text-[10px] font-extrabold rounded-full">2</span>
          <span>Selecione <strong>Transmitir, salvar e compartilhar</strong> e <strong>Instalar SIT...</strong>.</span>
        </li>
        <li className="flex items-start gap-2.5">
          <span className="flex-shrink-0 bg-brand-border/40 text-brand-accent w-5 h-5 text-center leading-5 text-[10px] font-extrabold rounded-full">3</span>
          <span>Confirme em <strong>Instalar</strong> para concluir.</span>
        </li>
      </ol>
    );
  };

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
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-accent to-transparent"></div>

          <button
            id="close-pwa-button"
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-brand-muted hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
            aria-label="Ignorar instalação"
          >
            <X className="w-5 h-5" />
          </button>

          {!showGuidance ? (
            <div className="flex gap-4">
              <div className="bg-white/15 p-3 rounded-2xl flex-shrink-0 h-12 w-12 flex items-center justify-center text-brand-accent shadow-inner border border-white/10">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="flex-1 pr-6">
                <span className="typ-subtitle text-xs block text-brand-accent font-bold">APLICATIVO INSTALÁVEL</span>
                <h4 className="typ-card-title text-base font-extrabold text-white mt-0.5 leading-tight">SIT no seu Computador ou Celular</h4>
                <p className="text-xs text-brand-muted mt-2 leading-relaxed">
                  Adicione o <strong>SIT - Sistemas Integrados Terceirizados</strong> à sua tela inicial para acesso instantâneo.
                </p>

                <div className="flex gap-3 mt-4 flex-wrap">
                  {platform === 'ios-safari' ? (
                    <button
                      onClick={() => setShowGuidance(true)}
                      className="px-4 py-2 text-xs font-bold rounded-lg sit-button-primary flex items-center gap-2 cursor-pointer"
                    >
                      Como Instalar <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleInstallClick}
                      className="px-4 py-2 text-xs font-bold rounded-lg sit-button-primary flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> Instalar Agora
                    </button>
                  )}
                  {platform !== 'ios-safari' && (
                    <button
                      onClick={() => setShowGuidance(true)}
                      className="px-3 py-2 text-xs font-semibold text-brand-muted hover:text-white transition-colors inline-flex items-center gap-1"
                    >
                      <Info className="w-3.5 h-3.5" /> Instruções
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
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <Share2 className="w-5 h-5 text-brand-accent" />
                <h4 className="typ-card-title text-sm font-bold text-white">Como instalar o SIT</h4>
              </div>
              {renderGuidance()}
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleDismiss}
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-green-500 hover:bg-green-600 text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-green-950/20"
                >
                  <Check className="w-3.5 h-3.5" /> Entendi
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(node, document.body) : null;
}
