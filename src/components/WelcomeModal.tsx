import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Building2, Users, Calendar, FileText, MapPin, Mail, Rocket, X } from 'lucide-react';

const STORAGE_KEY = '@sit:welcome:seen';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const features = [
  {
    icon: Users,
    title: 'Gestão de Pessoal',
    description: 'Cadastro, consulta e acompanhamento de todos os terceirizados em um único lugar.',
  },
  {
    icon: Calendar,
    title: 'Férias e Escalas',
    description: 'Planejamento anual de férias para evitar furos na operação e garantir cobertura.',
  },
  {
    icon: MapPin,
    title: 'Mapa de Lotações',
    description: 'Visualização geográfica das unidades e equipes alocadas.',
  },
  {
    icon: FileText,
    title: 'Relatórios',
    description: 'Exportação rápida de relatórios para análise em XLSX, PDF ou ODS.',
  },
  {
    icon: Mail,
    title: 'Geração de E-mails',
    description: 'Geração de e-mails padrão para ajustes de pontos elétricos de funcionários.',
  },
];

export const markWelcomeSeen = () => {
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    /* noop */
  }
};

export const isWelcomeSeen = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const handleClose = useCallback(() => {
    markWelcomeSeen();
    onClose();
  }, [onClose]);

  // ESC close + focus trap
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement;
    startButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
        return;
      }

      if (e.key !== 'Tab' || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || !panelRef.current.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !panelRef.current.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedRef.current?.focus?.();
    };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      aria-describedby="welcome-desc"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <div
        ref={panelRef}
        className="sit-panel relative w-full max-w-lg mx-auto overflow-hidden shadow-2xl"
        style={{
          animation: 'welcomeScaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        {/* Decorative top gradient */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-accent via-brand-panel-light to-brand-accent" />

        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-accent to-brand-panel-light text-white shadow-lg shrink-0">
                <Building2 className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <span className="typ-subtitle tracking-widest">SEJA BEM-VINDO</span>
                <h2 id="welcome-title" className="typ-section-title mt-0.5">
                  Bem-vindo ao SIT
                </h2>
              </div>
            </div>
            <button
              onClick={handleClose}
              aria-label="Fechar boas-vindas"
              className="shrink-0 rounded-full p-2 text-brand-muted hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-brand-accent transition-colors min-h-11 min-w-11 flex items-center justify-center"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <p id="welcome-desc" className="typ-card-desc mt-4 leading-relaxed">
            O <strong className="text-white font-semibold">SIT – Sistema Integrado de Terceirizados</strong> é a central de gestão da força de trabalho terceirizada da GPM. Aqui você acompanha equipes, férias, lotações, contratos e métricas administrativas.
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="sit-panel-inner p-3 flex items-start gap-3 transition-colors hover:bg-white/5"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-accent/15 text-brand-accent">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">{feature.title}</h3>
                    <p className="text-[11px] sm:text-xs text-brand-muted mt-0.5 leading-snug">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 sm:mt-8 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-brand-muted text-center sm:text-left">
              Explore os recursos do Painel Executivo e comece a gerenciar sua equipe.
            </p>
            <button
              ref={startButtonRef}
              onClick={handleClose}
              className="sit-button-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent active:scale-[0.98] transition-transform"
            >
              <Rocket className="h-4 w-4" aria-hidden="true" />
              Começar
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes welcomeScaleIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>,
    document.body
  );
}

export default WelcomeModal;
