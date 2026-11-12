import { useEffect, useRef, useState } from 'react';
import { Building2 } from 'lucide-react';

/**
 * Tela de abertura premium do SIT.
 *
 * Fica montada por cima da aplicação enquanto `visible` for verdadeiro e sai
 * com uma transição suave. Mantém um tempo mínimo de exibição para não
 * "piscar" em conexões rápidas, e a barra de progresso avança de forma
 * assintótica (nunca chega a 100% antes dos dados de fato chegarem).
 */

const STEPS = [
  'Conectando ao servidor',
  'Validando sua sessão',
  'Carregando colaboradores',
  'Sincronizando lotações e contratos',
  'Organizando planejamento de férias',
  'Preparando o painel executivo',
];

const MIN_VISIBLE_MS = 1100;
const EXIT_MS = 600;

interface LoadingScreenProps {
  visible: boolean;
}

export function LoadingScreen({ visible }: LoadingScreenProps) {
  const [mounted, setMounted] = useState(visible);
  const [leaving, setLeaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);
  const shownAt = useRef<number>(visible ? Date.now() : 0);

  // Controla entrada/saída respeitando o tempo mínimo de exibição.
  useEffect(() => {
    if (visible) {
      if (!mounted) {
        shownAt.current = Date.now();
        setProgress(0);
        setStep(0);
        setMounted(true);
      }
      setLeaving(false);
      return;
    }
    if (!mounted) return;

    const wait = Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt.current));
    const t1 = window.setTimeout(() => {
      setProgress(100);
      setLeaving(true);
    }, wait);
    const t2 = window.setTimeout(() => setMounted(false), wait + EXIT_MS);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [visible, mounted]);

  // Progresso assintótico: rápido no início, desacelera perto de 92%.
  useEffect(() => {
    if (!mounted || leaving) return;
    const id = window.setInterval(() => {
      setProgress((p) => (p >= 92 ? p : p + (92 - p) * 0.08));
    }, 120);
    return () => window.clearInterval(id);
  }, [mounted, leaving]);

  // Alterna as mensagens de etapa.
  useEffect(() => {
    if (!mounted || leaving) return;
    const id = window.setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 900);
    return () => window.clearInterval(id);
  }, [mounted, leaving]);

  // Evita rolagem do conteúdo por trás enquanto a tela está ativa.
  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  if (!mounted) return null;

  const pct = Math.round(progress);
  const label = leaving ? 'Tudo pronto' : STEPS[step];

  return (
    <div
      className={`sit-splash fixed inset-0 z-[10050] flex items-center justify-center overflow-hidden px-4 ${leaving ? 'sit-splash--leave' : ''}`}
      role="status"
      aria-live="polite"
      aria-busy={!leaving}
      aria-label={`Carregando SIT: ${label}`}
    >
      {/* Brilhos de fundo */}
      <div className="sit-splash__glow sit-splash__glow--a" aria-hidden="true" />
      <div className="sit-splash__glow sit-splash__glow--b" aria-hidden="true" />
      <div className="sit-splash__grid" aria-hidden="true" />

      <div className="sit-splash__content relative flex w-full max-w-[320px] flex-col items-center text-center">
        {/* Emblema com ondas de água */}
        <div className="relative flex h-40 w-40 items-center justify-center" aria-hidden="true">
          <span className="sit-splash__ripple" />
          <span className="sit-splash__ripple sit-splash__ripple--2" />
          <span className="sit-splash__ripple sit-splash__ripple--3" />

          <svg className="sit-splash__orbit absolute inset-0 h-full w-full" viewBox="0 0 160 160">
            <defs>
              <linearGradient id="sitOrbit" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
                <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
            </defs>
            <circle cx="80" cy="80" r="72" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
            <circle
              cx="80" cy="80" r="72" fill="none"
              stroke="url(#sitOrbit)" strokeWidth="2.5" strokeLinecap="round"
              strokeDasharray="120 332"
            />
          </svg>

          <div className="sit-splash__badge relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-[24px] bg-white shadow-2xl shadow-black/30">
            <div className="sit-splash__water absolute inset-x-0 bottom-0" style={{ height: `${Math.max(16, pct)}%` }}>
              <svg className="sit-splash__wave" viewBox="0 0 200 16" preserveAspectRatio="none">
                <path d="M0 8 Q 25 0 50 8 T 100 8 T 150 8 T 200 8 V16 H0 Z" fill="currentColor" />
              </svg>
              <svg className="sit-splash__wave sit-splash__wave--back" viewBox="0 0 200 16" preserveAspectRatio="none">
                <path d="M0 8 Q 25 16 50 8 T 100 8 T 150 8 T 200 8 V16 H0 Z" fill="currentColor" />
              </svg>
            </div>
            <Building2 className="relative h-10 w-10 text-brand-bg" strokeWidth={2.25} />
          </div>
        </div>

        {/* Marca */}
        <div className="mt-8 flex flex-col items-center gap-2">
          <h1 className="sit-splash__brand typ-brand leading-none text-[2rem] tracking-[0.24em] pl-[0.24em]">SIT</h1>
          <p className="typ-brand-sub leading-none text-brand-accent">Sistema Integrado de Terceirizados</p>
        </div>

        {/* Progresso */}
        <div className="mt-8 w-full">
          <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="sit-splash__bar absolute inset-y-0 left-0 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-4 flex items-center justify-between gap-4 text-xs">
            <span key={label} className="sit-splash__step min-w-0 truncate text-left text-brand-muted">
              {label}
              {!leaving && <span className="sit-splash__dots" aria-hidden="true" />}
            </span>
            <span className="shrink-0 font-mono tabular-nums text-white/80">{pct}%</span>
          </div>
        </div>
      </div>

      <p className="absolute inset-x-0 bottom-8 px-4 text-center text-[11px] font-semibold uppercase tracking-[0.24em] text-white/40">
        COMPESA · CMA SUL / GPM
      </p>
    </div>
  );
}
