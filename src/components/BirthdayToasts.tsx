import React, { useEffect, useMemo, useState } from 'react';
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
  if (s.startsWith('f')) return { subj: 'Ela', obj: 'la' }; // parabenizá-la
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

export const BirthdayToasts: React.FC<BirthdayToastsProps> = ({ employees }) => {
  const [dismissed, setDismissed] = useState<Set<string>>(() => getDismissedSet());
  const [now, setNow] = useState<number>(Date.now());

  // Recheck daily / on focus
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60 * 60 * 1000); // hourly
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

  const handleCall = (phone: string) => {
    const digits = onlyDigits(phone);
    if (!digits) return;
    window.location.href = `tel:+55${digits}`;
  };

  const handleWhatsApp = async (emp: Employee) => {
    const digits = onlyDigits(emp.telefone || '');
    const text = buildCongratsMessage(emp.nome);
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

  if (visible.length === 0) return null;

  return createPortal(
    <div
      className="fixed bottom-4 left-4 z-[10000] flex flex-col gap-3 max-w-[calc(100vw-2rem)] sm:max-w-sm pointer-events-none"
      aria-live="polite"
    >
      {visible.map((it) => {
        const key = `${it.employee.id}:${it.type}`;
        const p = pronoun(it.employee.sexo);
        const isToday = it.type === 'today';
        const Icon = isToday ? Cake : PartyPopper;
        const headline = isToday
          ? `Hoje é o aniversário de ${it.employee.nome}!`
          : `Amanhã é o aniversário de ${it.employee.nome}!`;
        const body = isToday
          ? `${p.subj} está completando ${it.age} anos. Aproveite para enviar seus parabéns!`
          : `${p.subj} completará ${it.age} anos. Não deixe de parabenizá-${p.obj}!`;

        return (
          <div
            key={key}
            className="pointer-events-auto animate-fade-in sit-panel border border-brand-accent/40 bg-gradient-to-br from-brand-panel via-brand-bg to-[#011B3D] shadow-2xl shadow-black/40 rounded-2xl overflow-hidden backdrop-blur-xl"
            role="status"
          >
            <div className="relative p-4">
              <button
                onClick={() => close(key)}
                aria-label="Fechar"
                className="absolute top-2 right-2 text-brand-muted hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start gap-3 pr-6">
                <div className="relative shrink-0">
                  <div className="h-12 w-12 rounded-full ring-2 ring-brand-accent/50 overflow-hidden bg-brand-border/40 flex items-center justify-center">
                    {it.employee.foto ? (
                      <img
                        src={it.employee.foto}
                        alt={it.employee.nome}
                        className="h-full w-full object-cover"
                        style={{ objectPosition: 'center 30%' }}
                        draggable={false}
                      />
                    ) : (
                      <UserIcon className="w-6 h-6 text-brand-muted" />
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-brand-accent flex items-center justify-center shadow-lg ring-2 ring-brand-bg">
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-brand-accent font-bold">
                    {isToday ? '🎂 Aniversário hoje' : '🎉 Aniversário amanhã'}
                  </p>
                  <p className="text-sm font-bold text-white mt-0.5 leading-snug">
                    {headline}
                  </p>
                  <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                    {body}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                <button
                  onClick={() => handleCall(it.employee.telefone || '')}
                  disabled={!onlyDigits(it.employee.telefone || '')}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold bg-brand-accent/15 hover:bg-brand-accent/25 border border-brand-accent/30 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Ligar
                </button>
                <button
                  onClick={() => handleWhatsApp(it.employee)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-200 hover:text-white transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  WhatsApp
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>,
    document.body
  );
};

export default BirthdayToasts;
