import React, { useState, useEffect } from 'react';
import { Download, Share2, PlusSquare, X, Smartphone, ArrowRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isReadyToInstall, setIsReadyToInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showiOSGuidance, setShowiOSGuidance] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / running in standalone mode (PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Check user's dismiss preference
    const isDismissed = localStorage.getItem('@sit:pwa-prompt-dismissed');
    if (isDismissed) {
      return;
    }

    // 3. Detect iOS Safari
    const ua = window.navigator.userAgent;
    const isIpad = ua.indexOf('iPad') > -1 || (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && ua.indexOf('Macintosh') > -1);
    const isIphone = ua.indexOf('iPhone') > -1 || ua.indexOf('iPod') > -1;
    const isIOSDevice = isIpad || isIphone;
    const isSafari = ua.includes('Safari') && !ua.includes('Chrome') && !ua.includes('CriOS');

    if (isIOSDevice) {
      setIsIOS(true);
      // Automatically pop up prompt after some delay
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // 4. Register listener for Chrome / Android / Desktop "beforeinstallprompt"
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install PWA
      setIsReadyToInstall(true);
      
      // Automatically open installer bar after a delayed period
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 3000);
      return () => clearTimeout(timer);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Detect if app is successfully installed via appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsOpen(false);
      setDeferredPrompt(null);
      console.log('App successfully installed!');
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Listen for external reopen request (e.g., from sidebar menu)
  useEffect(() => {
    const handleReopen = () => {
      const installed = window.matchMedia('(display-mode: standalone)').matches
        || (window.navigator as any).standalone
        || document.referrer.includes('android-app://');
      if (installed) return;
      localStorage.removeItem('@sit:pwa-prompt-dismissed');
      setIsOpen(true);
    };
    window.addEventListener('reopen-pwa-prompt', handleReopen);
    return () => window.removeEventListener('reopen-pwa-prompt', handleReopen);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);

    if (outcome === 'accepted') {
      setIsInstalled(true);
      setIsOpen(false);
    }
    
    // We've used the prompt, and can't use it again
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsOpen(false);
    // Persist dismiss for 7 days so we don't annoy the user
    localStorage.setItem('@sit:pwa-prompt-dismissed', 'true');
  };

  const handleTriggeriOSGuidance = () => {
    setShowiOSGuidance(true);
  };

  if (isInstalled) return null;

  // Render the prompt only if it's open and install is ready (or it is iOS)
  if (!isOpen) {
    // If we dismissed but want to let user install from sidebar/header, we can return a tiny floating install button instead or nothing.
    // For now, let's keep the user experience non-intrusive.
    return null;
  }

  return (
    <AnimatePresence>
      <div id="pwa-install-container" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="sit-panel p-5 text-white shadow-2xl border border-brand-border/40 relative overflow-hidden backdrop-blur-xl"
          style={{ background: 'linear-gradient(135deg, #1861B5 0%, #034289 100%)' }}
        >
          {/* Top subtle gloss line */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-accent to-transparent"></div>

          {/* Close button */}
          <button 
            id="close-pwa-button"
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-brand-muted hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
            aria-label="Ignorar instalação"
          >
            <X className="w-5 h-5" />
          </button>

          {!showiOSGuidance ? (
            <div className="flex gap-4">
              <div className="bg-white/15 p-3 rounded-2xl flex-shrink-0 h-12 w-12 flex items-center justify-center text-brand-accent shadow-inner border border-white/10">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="flex-1 pr-6">
                <span className="typ-subtitle text-xs block text-brand-accent font-bold">APLICATIVO INSTALÁVEL</span>
                <h4 className="typ-card-title text-base font-extrabold text-white mt-0.5 leading-tight">SIT no seu Computador ou Celular</h4>
                <p className="text-xs text-brand-muted mt-2 leading-relaxed">
                  Adicione o <strong>SIT - Sistemas Integrados Terceirizados</strong> à sua tela inicial para acesso instantâneo, em seu dispositivo de trabalho.
                </p>

                <div className="flex gap-3 mt-4">
                  {isIOS ? (
                    <button
                      id="ios-pwa-button"
                      onClick={handleTriggeriOSGuidance}
                      className="px-4 py-2 text-xs font-bold rounded-lg sit-button-primary flex items-center gap-2 cursor-pointer"
                    >
                      Como Instalar <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      id="android-pwa-button"
                      onClick={handleInstallClick}
                      className="px-4 py-2 text-xs font-bold rounded-lg sit-button-primary flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> Instalar Agora
                    </button>
                  )}
                  <button
                    id="dismiss-pwa-button"
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
                <Share2 className="w-5 h-5 text-brand-accent animate-pulse" />
                <h4 className="typ-card-title text-sm font-bold text-white">Instalar no iOS (Safari)</h4>
              </div>

              <p className="text-xs text-brand-muted leading-relaxed">
                Siga estes passos simples para adicionar o <strong>SIT</strong> na tela inicial do seu iPhone ou iPad:
              </p>

              <ol className="space-y-3.5 text-xs text-white pl-1">
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 bg-brand-border/40 text-brand-accent w-5 h-5 text-center leading-5 text-[10px] font-extrabold rounded-full">1</span>
                  <span>Toque no botão de <strong>Compartilhar</strong> <Share2 className="inline w-3.5 h-3.5 mx-0.5 text-brand-accent" /> na barra inferior do Safari.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 bg-brand-border/40 text-brand-accent w-5 h-5 text-center leading-5 text-[10px] font-extrabold rounded-full">2</span>
                  <span>Role a lista de opções para baixo e clique em <strong>Adicionar à Tela de Início</strong> <PlusSquare className="inline w-3.5 h-3.5 mx-0.5 text-brand-accent" />.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 bg-brand-border/40 text-brand-accent w-5 h-5 text-center leading-5 text-[10px] font-extrabold rounded-full">3</span>
                  <span>Toque em <strong>Adicionar</strong> no canto superior direito do menu para finalizar.</span>
                </li>
              </ol>

              <div className="flex justify-end pt-2">
                <button
                  id="done-ios-button"
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
}
