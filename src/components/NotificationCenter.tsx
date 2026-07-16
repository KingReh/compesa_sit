import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell,
  X,
  Cake,
  Calendar,
  AlertTriangle,
  UserRound,
  Car,
  Info,
  CheckCheck,
  BellOff,
  Compass,
  Filter,
  ChevronRight,
} from 'lucide-react';
import { Employee, VacationPlan } from '../types';
import { parseLocalDate, formatEmployeeName } from '../utils';

const READ_STORAGE_KEY = '@sit:notifications:read';
const SILENCED_UNTIL_KEY = '@sit:notifications:silencedUntil';

export type AppView = 'painel' | 'ferias' | 'relatorios' | 'configuracao';

type NotificationType = 'birthday' | 'vacation' | 'coverage' | 'incomplete' | 'driver' | 'news';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  date: Date;
  actionLabel: string;
  action: () => void;
  icon: React.ElementType;
  priority: 'high' | 'normal' | 'low';
}

interface NotificationCenterProps {
  employees: Employee[];
  vacationPlans: VacationPlan[];
  onViewEmployee: (emp: Employee) => void;
  onNavigate: (view: AppView) => void;
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const getReadIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.filter((id: unknown) => typeof id === 'string')) : new Set();
  } catch {
    return new Set();
  }
};

const persistReadIds = (ids: Set<string>) => {
  try {
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    /* noop */
  }
};

const getSilencedUntil = (): number | null => {
  try {
    const raw = localStorage.getItem(SILENCED_UNTIL_KEY);
    if (!raw) return null;
    const val = Number(raw);
    return isNaN(val) ? null : val;
  } catch {
    return null;
  }
};

const persistSilencedUntil = (ts: number | null) => {
  try {
    if (ts) {
      localStorage.setItem(SILENCED_UNTIL_KEY, String(ts));
    } else {
      localStorage.removeItem(SILENCED_UNTIL_KEY);
    }
  } catch {
    /* noop */
  }
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

const relativeDateLabel = (date: Date): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Amanhã';
  if (diffDays > 1 && diffDays < 7) return `Em ${diffDays} dias`;
  if (diffDays === -1) return 'Ontem';
  if (diffDays < -1 && diffDays > -7) return `Há ${Math.abs(diffDays)} dias`;
  return target.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

const monthNameToIndex = (name: string): number => MONTH_NAMES.indexOf(name);

const buildNotifications = (
  employees: Employee[],
  vacationPlans: VacationPlan[],
  onViewEmployee: (emp: Employee) => void,
  onNavigate: (view: AppView) => void
): NotificationItem[] => {
  const items: NotificationItem[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // 1. Birthdays today and this week
  const upcomingBirthdays: { employee: Employee; type: 'today' | 'this-week'; age: number }[] = [];
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);

  for (const emp of employees) {
    const dt = parseLocalDate(emp.dataNascimento);
    if (!dt) continue;
    const m = dt.getMonth();
    const d = dt.getDate();
    const y = dt.getFullYear();
    const thisYearBirthday = new Date(currentYear, m, d);

    if (m === today.getMonth() && d === today.getDate()) {
      upcomingBirthdays.push({ employee: emp, type: 'today', age: currentYear - y });
    } else if (thisYearBirthday > today && thisYearBirthday <= weekEnd) {
      upcomingBirthdays.push({ employee: emp, type: 'this-week', age: currentYear - y });
    }
  }

  for (const b of upcomingBirthdays) {
    const isToday = b.type === 'today';
    const birthDt = parseLocalDate(b.employee.dataNascimento);
    const nextBirthday = birthDt
      ? new Date(currentYear, birthDt.getMonth(), birthDt.getDate())
      : today;
    items.push({
      id: `birthday:${b.employee.id}:${isToday ? 'today' : 'week'}`,
      type: 'birthday',
      title: isToday
        ? `🎂 Aniversário de ${formatEmployeeName(b.employee.nome)}`
        : `🎈 Aniversário em breve: ${formatEmployeeName(b.employee.nome)}`,
      description: isToday
        ? `${b.employee.nome} completa ${b.age} anos hoje. Aproveite para enviar seus parabéns!`
        : `${b.employee.nome} completará ${b.age} anos ${relativeDateLabel(nextBirthday)}.`,
      date: isToday ? today : nextBirthday,
      actionLabel: 'Ver ficha',
      action: () => onViewEmployee(b.employee),
      icon: Cake,
      priority: isToday ? 'high' : 'normal',
    });
  }

  // 2. Vacations in current/next month and coverage impact
  const plansByCoord = new Map<string, VacationPlan[]>();
  const employeesById = new Map(employees.map((e) => [e.id, e]));

  for (const plan of vacationPlans) {
    if (plan.year !== currentYear) continue;
    const monthIdx = monthNameToIndex(plan.month);
    if (monthIdx < 0 || monthIdx < currentMonth || monthIdx > currentMonth + 1) continue;

    const emp = employeesById.get(plan.employeeId);
    if (!emp) continue;
    const coord = emp.coordenacao || 'Sem coordenação';
    const list = plansByCoord.get(coord) || [];
    list.push(plan);
    plansByCoord.set(coord, list);

    const planDate = new Date(currentYear, monthIdx, 1);
    items.push({
      id: `vacation:${plan.employeeId}:${plan.year}:${plan.month}`,
      type: 'vacation',
      title: `🏖️ Férias programadas: ${formatEmployeeName(emp.nome)}`,
      description: `${emp.nome} tem férias previstas para ${plan.month}${plan.gozar30Dias ? ' (30 dias)' : ''}${plan.observacao ? `. ${plan.observacao}` : ''}.`,
      date: planDate,
      actionLabel: 'Abrir férias',
      action: () => onNavigate('ferias'),
      icon: Calendar,
      priority: monthIdx === currentMonth ? 'high' : 'normal',
    });
  }

  // 3. Coverage impact
  const COVERAGE_THRESHOLD = 0.25; // 25%
  for (const [coord, plans] of plansByCoord.entries()) {
    const coordEmployees = employees.filter((e) => e.coordenacao === coord && (e.empresa || e.lotacao));
    const total = coordEmployees.length || 1;
    const ratio = plans.length / total;
    if (ratio >= COVERAGE_THRESHOLD) {
      const month = plans[0]?.month || 'mês atual';
      items.push({
        id: `coverage:${coord}:${currentYear}:${month}`,
        type: 'coverage',
        title: `⚠️ Impacto de cobertura: ${coord}`,
        description: `${plans.length} de ${total} colaboradores (${Math.round(ratio * 100)}%) da coordenação têm férias previstas para ${month}. Reveja o planejamento.`,
        date: today,
        actionLabel: 'Revisar planejamento',
        action: () => onNavigate('ferias'),
        icon: AlertTriangle,
        priority: ratio >= 0.4 ? 'high' : 'normal',
      });
    }
  }

  // 4. Incomplete registrations
  const incompleteFields = [
    { key: 'telefone', label: 'telefone' },
    { key: 'foto', label: 'foto' },
    { key: 'dataNascimento', label: 'data de nascimento' },
  ] as const;

  for (const emp of employees) {
    for (const field of incompleteFields) {
      const value = (emp as any)[field.key];
      if (!value || (typeof value === 'string' && !value.trim())) {
        items.push({
          id: `incomplete:${emp.id}:${field.key}`,
          type: 'incomplete',
          title: `📄 Cadastro incompleto: ${formatEmployeeName(emp.nome)}`,
          description: `O campo ${field.label} não está preenchido na ficha de ${emp.nome}.`,
          date: today,
          actionLabel: 'Completar ficha',
          action: () => onViewEmployee(emp),
          icon: UserRound,
          priority: 'low',
        });
      }
    }
  }

  // 5. Driver missing info
  for (const emp of employees) {
    if (emp.autorizadoDirigir) {
      const missing: string[] = [];
      if (!emp.telefone?.trim()) missing.push('telefone');
      if (!emp.foto?.trim()) missing.push('foto');
      if (missing.length > 0) {
        items.push({
          id: `driver:${emp.id}`,
          type: 'driver',
          title: `🚗 Condutor sem dados obrigatórios: ${formatEmployeeName(emp.nome)}`,
          description: `${emp.nome} está autorizado a dirigir, mas falta(m): ${missing.join(' e ')}.`,
          date: today,
          actionLabel: 'Completar ficha',
          action: () => onViewEmployee(emp),
          icon: Car,
          priority: 'normal',
        });
      }
    }
  }

  // 6. System news (static, low priority)
  items.push({
    id: `news:welcome:2026-07`,
    type: 'news',
    title: '🆕 Novidade: Central de Notificações',
    description: 'Agora o SIT reúne aniversários, férias e alertas de cobertura em um único lugar. Clique no sino para acompanhar.',
    date: today,
    actionLabel: 'Explorar',
    action: () => onNavigate('painel'),
    icon: Info,
    priority: 'low',
  });

  // Sort by priority and date (high first, then normal, then low; same priority: more recent first)
  const priorityWeight = { high: 3, normal: 2, low: 1 };
  items.sort((a, b) => {
    const pw = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (pw !== 0) return pw;
    return b.date.getTime() - a.date.getTime();
  });

  return items;
};

interface SwipeableNotificationProps {
  n: NotificationItem;
  isUnread: boolean;
  reducedMotion: boolean;
  onAction: () => void;
  onDismiss: () => void;
}

const SWIPE_THRESHOLD = 96;

const SwipeableNotification: React.FC<SwipeableNotificationProps> = ({
  n,
  isUnread,
  reducedMotion,
  onAction,
  onDismiss,
}) => {
  const Icon = n.icon;
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(0); // 0 idle, 1 dragging, 2 removing
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const locked = useRef<'h' | 'v' | null>(null);
  const pointerId = useRef<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse') return; // swipe is a touch gesture
    if (reducedMotion) return;
    startX.current = e.clientX;
    startY.current = e.clientY;
    locked.current = null;
    pointerId.current = e.pointerId;
    setDragging(1);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (startX.current == null || startY.current == null) return;
    const deltaX = e.clientX - startX.current;
    const deltaY = e.clientY - startY.current;
    if (!locked.current) {
      if (Math.abs(deltaX) < 6 && Math.abs(deltaY) < 6) return;
      locked.current = Math.abs(deltaX) > Math.abs(deltaY) ? 'h' : 'v';
      if (locked.current === 'h') {
        try {
          ref.current?.setPointerCapture(e.pointerId);
        } catch { /* noop */ }
      }
    }
    if (locked.current === 'h') {
      e.preventDefault();
      setDx(deltaX);
    }
  };

  const finish = () => {
    if (locked.current === 'h' && Math.abs(dx) > SWIPE_THRESHOLD) {
      setDragging(2);
      const dir = dx > 0 ? 1 : -1;
      setDx(dir * (ref.current?.offsetWidth || 400));
      window.setTimeout(() => onDismiss(), 180);
    } else {
      setDx(0);
      setDragging(0);
    }
    startX.current = null;
    startY.current = null;
    locked.current = null;
    pointerId.current = null;
  };

  const opacity = 1 - Math.min(Math.abs(dx) / (SWIPE_THRESHOLD * 2), 0.7);
  const transitionStyle = dragging === 1 ? 'none' : reducedMotion ? 'none' : 'transform 180ms ease-out, opacity 180ms ease-out';

  return (
    <div
      ref={ref}
      role="article"
      aria-label={n.title}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finish}
      onPointerCancel={finish}
      className={`group relative rounded-xl p-2.5 sm:p-3 border touch-pan-y ${
        isUnread
          ? 'bg-brand-accent/10 border-brand-accent/20'
          : 'bg-white/5 border-white/5 hover:bg-white/10'
      }`}
      style={{
        transform: `translateX(${dx}px)`,
        opacity,
        transition: transitionStyle,
      }}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        <div
          className={`mt-0.5 h-7 w-7 sm:h-8 sm:w-8 shrink-0 rounded-lg flex items-center justify-center ${
            n.priority === 'high'
              ? 'bg-rose-500/15 text-rose-300'
              : n.priority === 'normal'
              ? 'bg-brand-accent/15 text-brand-accent'
              : 'bg-white/10 text-brand-muted'
          }`}
        >
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] sm:text-sm font-bold text-white leading-snug pr-8">
            {n.title}
          </p>
          <p className="text-[11px] sm:text-xs text-brand-muted mt-0.5 leading-relaxed line-clamp-3">
            {n.description}
          </p>
          <div className="flex items-center justify-between mt-1.5 sm:mt-2 gap-2">
            <span className="text-[10px] text-brand-accent/80 font-medium">
              {relativeDateLabel(n.date)}
            </span>
            <button
              onClick={onAction}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-accent hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent rounded px-1.5 py-1 min-h-8"
            >
              {n.actionLabel}
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {isUnread && (
        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-brand-accent" aria-hidden="true" />
      )}
    </div>
  );
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  employees,
  vacationPlans,
  onViewEmployee,
  onNavigate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(() => getReadIds());
  const [silencedUntil, setSilencedUntil] = useState<number | null>(() => getSilencedUntil());
  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const reducedMotion = usePrefersReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const allNotifications = useMemo(
    () => buildNotifications(employees, vacationPlans, onViewEmployee, onNavigate),
    [employees, vacationPlans, onViewEmployee, onNavigate]
  );

  const filteredNotifications = useMemo(() => {
    if (filterType === 'all') return allNotifications;
    return allNotifications.filter((n) => n.type === filterType);
  }, [allNotifications, filterType]);

  const unreadCount = useMemo(() => {
    if (silencedUntil && Date.now() < silencedUntil) return 0;
    return allNotifications.filter((n) => !readIds.has(n.id)).length;
  }, [allNotifications, readIds, silencedUntil]);

  const unreadFilteredCount = useMemo(
    () => filteredNotifications.filter((n) => !readIds.has(n.id)).length,
    [filteredNotifications, readIds]
  );

  // Announce count changes politely
  useEffect(() => {
    if (unreadCount > 0) {
      setLiveAnnouncement(`${unreadCount} notificação${unreadCount === 1 ? '' : 's'} não lida${unreadCount === 1 ? '' : 's'}`);
    }
  }, [unreadCount]);

  // Close on click outside and Esc
  useEffect(() => {
    if (!isOpen) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(target) && !bellRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClick);
      previouslyFocusedRef.current?.focus?.();
    };
  }, [isOpen]);

  const markAsRead = (id: string) => {
    setReadIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      persistReadIds(next);
      return next;
    });
  };

  const markAllAsRead = () => {
    const next = new Set(readIds);
    for (const n of filteredNotifications) {
      next.add(n.id);
    }
    setReadIds(next);
    persistReadIds(next);
  };

  const handleSilence = () => {
    const until = Date.now() + 24 * 60 * 60 * 1000;
    setSilencedUntil(until);
    persistSilencedUntil(until);
  };

  const handleAction = (n: NotificationItem) => {
    markAsRead(n.id);
    setIsOpen(false);
    n.action();
  };

  const typeLabels: Record<NotificationType | 'all', string> = {
    all: 'Todas',
    birthday: 'Aniversários',
    vacation: 'Férias',
    coverage: 'Cobertura',
    incomplete: 'Pendentes',
    driver: 'Condutores',
    news: 'Novidades',
  };

  const typeIcons: Record<NotificationType | 'all', React.ElementType> = {
    all: Filter,
    birthday: Cake,
    vacation: Calendar,
    coverage: AlertTriangle,
    incomplete: UserRound,
    driver: Car,
    news: Info,
  };

  return (
    <>
      <button
        ref={bellRef}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Notificações${unreadCount > 0 ? `, ${unreadCount} não lidas` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="relative inline-flex items-center justify-center rounded-lg px-2.5 py-2 text-brand-muted hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent transition-colors min-h-11 min-w-11"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold px-1.5 border border-brand-panel shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen &&
        createPortal(
          <>
            {/* Mobile backdrop */}
            <div
              className="fixed inset-0 z-[10000] bg-black/40 sm:hidden"
              style={{ animation: reducedMotion ? 'none' : 'fadeIn 0.15s ease-out' }}
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Central de notificações"
              className="fixed z-[10001] sit-panel flex flex-col shadow-2xl shadow-black/40 overflow-hidden rounded-t-2xl sm:rounded-xl sm:rounded-t-xl inset-x-0 bottom-0 sm:inset-x-auto sm:bottom-auto sm:top-[4.5rem] sm:right-3 sm:w-[min(28rem,calc(100vw-1.5rem))]"
              style={{
                paddingLeft: 'env(safe-area-inset-left, 0)',
                paddingRight: 'env(safe-area-inset-right, 0)',
                maxHeight: 'min(80dvh, calc(100dvh - 3rem))',
                animation: reducedMotion
                  ? 'none'
                  : typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches
                  ? 'fadeIn 0.2s ease-out'
                  : 'slideUp 0.22s ease-out',
              }}
            >
              {/* Grab handle (mobile only) */}
              <div className="sm:hidden flex justify-center pt-2 pb-1" aria-hidden="true">
                <span className="h-1 w-10 rounded-full bg-white/20" />
              </div>
              {/* Header */}
              <div className="flex items-center justify-between gap-2 px-3 py-2 sm:p-4 border-b border-white/10">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-brand-accent/15 flex items-center justify-center text-brand-accent shrink-0">
                    <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="typ-card-title text-white text-sm sm:text-base truncate">Notificações</h3>
                    <p className="text-[10px] text-brand-muted truncate">
                      {unreadCount > 0 ? `${unreadCount} não lida${unreadCount === 1 ? '' : 's'}` : 'Tudo em dia'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={markAllAsRead}
                    disabled={unreadFilteredCount === 0}
                    aria-label="Marcar todas como lidas"
                    title="Marcar todas como lidas"
                    className="inline-flex items-center justify-center rounded-md p-2 min-h-9 min-w-9 text-brand-muted hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-brand-accent transition-colors"
                  >
                    <CheckCheck className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    onClick={handleSilence}
                    aria-label="Silenciar notificações por 24 horas"
                    title="Silenciar por 24 horas"
                    className="inline-flex items-center justify-center rounded-md p-2 min-h-9 min-w-9 text-brand-muted hover:text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-brand-accent transition-colors"
                  >
                    <BellOff className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    aria-label="Fechar notificações"
                    className="inline-flex items-center justify-center rounded-md p-2 min-h-9 min-w-9 text-brand-muted hover:text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-brand-accent transition-colors"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Filter chips */}
              <div className="flex items-center gap-1.5 px-2 py-1.5 sm:p-3 border-b border-white/10 overflow-x-auto no-scrollbar">
                {(['all', 'birthday', 'vacation', 'coverage', 'incomplete', 'driver', 'news'] as (NotificationType | 'all')[]).map((type) => {
                  const Icon = typeIcons[type];
                  const active = filterType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 sm:px-2.5 sm:py-1.5 text-[10px] sm:text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent ${
                        active
                          ? 'bg-brand-accent/20 text-white border border-brand-accent/40'
                          : 'bg-white/5 text-brand-muted border border-white/5 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon className="h-3 w-3" aria-hidden="true" />
                      {typeLabels[type]}
                    </button>
                  );
                })}
              </div>

              {/* List */}
              <div
                className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1.5 sm:space-y-2"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0) + 0.5rem)' }}
              >
                {filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="h-12 w-12 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent mb-3">
                      <Bell className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <p className="text-sm font-semibold text-white">Nenhuma notificação</p>
                    <p className="text-xs text-brand-muted mt-1">Nenhum alerta do tipo selecionado no momento.</p>
                  </div>
                ) : (
                  filteredNotifications.map((n) => (
                    <SwipeableNotification
                      key={n.id}
                      n={n}
                      isUnread={!readIds.has(n.id)}
                      reducedMotion={reducedMotion}
                      onAction={() => handleAction(n)}
                      onDismiss={() => markAsRead(n.id)}
                    />
                  ))
                )}
              </div>
            </div>
          </>,
          document.body
        )}

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {liveAnnouncement}
      </div>
    </>
  );
};

export default NotificationCenter;
