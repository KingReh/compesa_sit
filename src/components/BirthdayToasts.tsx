import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Phone, MessageCircle, PartyPopper, Cake, User as UserIcon } from 'lucide-react';
import { Employee } from '../types';
import { parseLocalDate } from '../utils';

interface BirthdayToastsProps {
  employees: Employee[];
}

interface BirthdayItem {
  employee: Employee;
  type: 'today' | 'tomorrow';
  age: number;
}

const SESSION_KEY = '@sit:birthdayToasts:shown';
const SWIPE_THRESHOLD = 100; // px to dismiss

const getDismissedSet = (): Set<string> => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
};

const persistDismissed = (set: Set<string>) => {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(Array.from(set)));
  } catch { /* noop */ }
};

const pronoun = (sexo?: string) => {
  const s = (sexo || '').trim().toLowerCase();
  if (s.startsWith('f')) return { subj: 'Ela', obj: 'la' };
  return { subj: 'Ele', obj: 'lo' };
};

const computeBirthdays = (employees: Employee[]): BirthdayItem[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const items: BirthdayItem[] = [];
  for (const emp of employees) {
    const dt = parseLocalDate(emp.dataNascimento);
    if (!dt) continue;
    const m = dt.getMonth();
    const d = dt.getDate();
    const y = dt.getFullYear();

    if (m === today.getMonth() && d === today.getDate()) {
      items.push({ employee: emp, type: 'today', age: today.getFullYear() - y });
    } else if (m === tomorrow.getMonth() && d === tomorrow.getDate()) {
      items.push({ employee: emp, type: 'tomorrow', age: tomorrow.getFullYear() - y });
    }
  }
  return items;
};

const onlyDigits = (s: string) => (s || '').replace(/\D/g, '');

const buildCongratsMessage = (nome: string) => {
  const firstName = (nome || '').trim().split(' ')[0] || '';
  return `🎉 Parabéns, ${firstName}! Desejo muita saúde, felicidade, sucesso e muitos anos de vida. Que seu novo ciclo seja repleto de conquistas! Feliz aniversário! 🎂🎈`;
};

const usePrefersReducedMotion = (): boolean => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);
  return reduced;
};

interface ToastCardProps {
  item: BirthdayItem;
  onClose: () => void;
  reducedMotion: boolean;
}

const ToastCard: React.FC<ToastCardProps> = ({ item, onClose, reducedMotion }) => {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [leaving, setLeaving] = useState<null | 'left' | 'right'>(null);
  const startXRef = useRef<number | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const p = pronoun(item.employee.sexo);
  const isToday = item.type === 'today';
  const Icon = isToday ? Cake : PartyPopper;
  const headline = isToday
    ? `Hoje é o aniversário de ${item.employee.nome}!`
    : `Amanhã é o aniversário de ${item.employee.nome}!`;
  const body = isToday
    ? `${p.subj} está completando ${item.age} anos. Aproveite para enviar seus parabéns!`
    : `${p.subj} completará ${item.age} anos. Não deixe de parabenizá-${p.obj}!`;

  const handleCall = () => {
    const digits = onlyDigits(item.employee.telefone || '');
    if (!digits) return;
    window.location.href = `tel:+55${digits}`;
  };

  const handleWhatsApp = async () => {
    const digits = onlyDigits(item.employee.telefone || '');
    const text = buildCongratsMessage(item.employee.nome);
    const nav: any = navigator;
    if (nav?.share) {
      try {
        await nav.share({ title: 'Feliz Aniversário!', text });
        return;
      } catch { /* fallback */ }
    }
    if (digits) {
      const url = `https://wa.me/55${digits}?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const dismissWithAnim = useCallback((dir: 'left' | 'right') => {
    if (reducedMotion) { onClose(); return; }
    setLeaving(dir);
    window.setTimeout(onClose, 220);
  }, [onClose, reducedMotion]);

  const onPointerDown = (e: React.PointerEvent) => {
    // Ignore drags initiated on interactive controls
    const target = e.target as HTMLElement;
    if (target.closest('button, a')) return;
    pointerIdRef.current = e.pointerId;
    startXRef.current = e.clientX;
    setDragging(true);
    try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch { /* noop */ }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (startXRef.current == null) return;
    setDragX(e.clientX - startXRef.current);
  };

  const endDrag = () => {
    const x = dragX;
    setDragging(false);
    startXRef.current = null;
    pointerIdRef.current = null;
    if (Math.abs(x) > SWIPE_THRESHOLD) {
      dismissWithAnim(x < 0 ? 'left' : 'right');
    } else {
      setDragX(0);
    }
  };

  const width = cardRef.current?.offsetWidth || 320;
  const opacity = leaving ? 0 : Math.max(0.2, 1 - Math.abs(dragX) / (width * 1.2));
  const translateX = leaving === 'left' ? -width * 1.2 : leaving === 'right' ? width * 1.2 : dragX;
  const rotate = leaving ? 0 : dragX / 30;

  return (
    <div
      ref={cardRef}
      role="status"
      aria-live="polite"
      aria-label={headline}
      className="pointer-events-auto sit-panel border border-brand-accent/40 bg-gradient-to-br from-brand-panel via-brand-bg to-[#011B3D] shadow-2xl shadow-black/40 rounded-2xl overflow-hidden backdrop-blur-xl touch-pan-y select-none"
      style={{
        transform: `translateX(${translateX}px) rotate(${rotate}deg)`,
        opacity,
        transition: dragging ? 'none' : (reducedMotion ? 'none' : 'transform 220ms cubic-bezier(0.16,1,0.3,1), opacity 220ms ease-out'),
        animation: reducedMotion ? 'none' : 'fadeIn 0.35s cubic-bezier(0.16,1,0.3,1)',
        willChange: 'transform, opacity',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div className="relative p-3 sm:p-4">
        <button
          onClick={onClose}
          aria-label={`Fechar notificação de aniversário de ${item.employee.nome}`}
          className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 text-brand-muted hover:text-white focus:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent transition-colors p-1.5 rounded-md hover:bg-white/10 min-w-11 min-h-11 sm:min-w-0 sm:min-h-0 sm:p-1 flex items-center justify-center"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        <div className="flex items-start gap-2.5 sm:gap-3 pr-9 sm:pr-7">
          <div className="relative shrink-0">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full ring-2 ring-brand-accent/50 overflow-hidden bg-brand-border/40 flex items-center justify-center">
              {item.employee.foto ? (
                <img
                  src={item.employee.foto}
                  alt=""
                  className="h-full w-full object-cover"
                  style={{ objectPosition: 'center 30%' }}
                  draggable={false}
                />
              ) : (
                <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-brand-muted" aria-hidden="true" />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-brand-accent flex items-center justify-center shadow-lg ring-2 ring-brand-bg">
              <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" aria-hidden="true" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-brand-accent font-bold">
              {isToday ? '🎂 Aniversário hoje' : '🎉 Aniversário amanhã'}
            </p>
            <p className="text-[13px] sm:text-sm font-bold text-white mt-0.5 leading-snug">
              {headline}
            </p>
            <p className="text-[11px] sm:text-xs text-brand-muted mt-0.5 sm:mt-1 leading-relaxed line-clamp-2 sm:line-clamp-none">
              {body}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-white/5">
          <button
            onClick={handleCall}
            disabled={!onlyDigits(item.employee.telefone || '')}
            aria-label={`Ligar para ${item.employee.nome}`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 min-h-11 sm:min-h-0 sm:py-2 text-[11px] sm:text-xs font-semibold bg-brand-accent/15 hover:bg-brand-accent/25 border border-brand-accent/30 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
          >
            <Phone className="w-3.5 h-3.5" aria-hidden="true" />
            Ligar
          </button>
          <button
            onClick={handleWhatsApp}
            aria-label={`Enviar mensagem de aniversário para ${item.employee.nome} no WhatsApp`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 min-h-11 sm:min-h-0 sm:py-2 text-[11px] sm:text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-200 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
            WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

export const BirthdayToasts: React.FC<BirthdayToastsProps> = ({ employees }) => {
  const [dismissed, setDismissed] = useState<Set<string>>(() => getDismissedSet());
  const [now, setNow] = useState<number>(Date.now());
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60 * 60 * 1000);
    const onFocus = () => setNow(Date.now());
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const items = useMemo(() => computeBirthdays(employees), [employees, now]);
  const visible = items.filter((it) => !dismissed.has(`${it.employee.id}:${it.type}`));

  const close = (key: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(key);
      persistDismissed(next);
      return next;
    });
  };

  if (visible.length === 0) return null;

  return createPortal(
    <div
      className="fixed z-[10000] flex flex-col gap-2 sm:gap-3 pointer-events-none"
      style={{
        left: 'max(0.5rem, env(safe-area-inset-left))',
        right: 'max(0.5rem, env(safe-area-inset-right))',
        bottom: 'max(0.75rem, env(safe-area-inset-bottom))',
        maxWidth: 'min(22rem, calc(100vw - 1rem))',
      }}
      aria-label="Notificações de aniversários"
    >
      {visible.map((it) => {
        const key = `${it.employee.id}:${it.type}`;
        return (
          <ToastCard
            key={key}
            item={it}
            onClose={() => close(key)}
            reducedMotion={reducedMotion}
          />
        );
      })}
    </div>,
    document.body
  );
};

export default BirthdayToasts;
