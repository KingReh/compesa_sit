import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  X,
  LayoutDashboard,
  Calendar,
  FileText,
  Settings,
  Building2,
  FileSignature,
  MapPin,
  Car,
  Plus,
  LogOut,
  Download,
  UserRound,
  Compass,
  ArrowUpDown,
  CornerDownLeft,
} from 'lucide-react';
import { Employee, Empresa, Contrato, Unidade, Coordenacao } from '../types';
import { formatEmployeeName } from '../utils';

export type AppView = 'painel' | 'ferias' | 'relatorios' | 'configuracao';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  empresas: Empresa[];
  contratos: Contrato[];
  unidades: Unidade[];
  coordenacoes: Coordenacao[];
  onNavigate: (view: AppView) => void;
  onViewEmployee: (emp: Employee) => void;
  onOpenDrivers: () => void;
  onOpenNewEmployee: () => void;
  onLogout: () => void;
}

interface CommandItem {
  id: string;
  section: string;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  keywords: string;
  action: () => void;
}

const HISTORY_KEY = '@sit:commandPalette:history';

const MAX_HISTORY = 5;

const getHistoryIds = (): string[] => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id: unknown) => typeof id === 'string') : [];
  } catch {
    return [];
  }
};

const pushHistoryId = (id: string) => {
  try {
    const current = getHistoryIds();
    const next = [id, ...current.filter((i) => i !== id)].slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
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

const normalize = (str: string) =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const scoreMatch = (query: string, item: CommandItem): number => {
  if (!query.trim()) return 1;
  const q = normalize(query);
  const haystack = normalize(`${item.title} ${item.subtitle || ''} ${item.keywords}`);
  if (haystack.includes(q)) {
    // Boost exact prefix matches in title
    if (normalize(item.title).startsWith(q)) return 3;
    if (normalize(item.title).includes(q)) return 2;
    return 1;
  }
  return 0;
};

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  employees,
  empresas,
  contratos,
  unidades,
  coordenacoes,
  onNavigate,
  onViewEmployee,
  onOpenDrivers,
  onOpenNewEmployee,
  onLogout,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [historyIds] = useState<string[]>(() => getHistoryIds());
  const reducedMotion = usePrefersReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const commands = useMemo<CommandItem[]>(() => {
    const list: CommandItem[] = [];

    // Navigation
    list.push(
      {
        id: 'nav:painel',
        section: 'Navegação',
        title: 'Ir para Painel Executivo',
        subtitle: 'Dashboard com KPIs e listagem de terceirizados',
        icon: LayoutDashboard,
        keywords: 'painel dashboard home inicio kpi indicadores',
        action: () => onNavigate('painel'),
      },
      {
        id: 'nav:ferias',
        section: 'Navegação',
        title: 'Ir para Planejamento de Férias',
        subtitle: 'Cronograma anual e gestão de férias',
        icon: Calendar,
        keywords: 'ferias planejamento cronograma periodo gozo',
        action: () => onNavigate('ferias'),
      },
      {
        id: 'nav:relatorios',
        section: 'Navegação',
        title: 'Ir para Relatórios',
        subtitle: 'Exportações em Excel e PDF',
        icon: FileText,
        keywords: 'relatorios exportar excel pdf xlsx',
        action: () => onNavigate('relatorios'),
      },
      {
        id: 'nav:configuracao',
        section: 'Navegação',
        title: 'Ir para Configurações',
        subtitle: 'Empresas, contratos, unidades e coordenações',
        icon: Settings,
        keywords: 'configuracoes cadastros empresas contratos unidades coordenacoes',
        action: () => onNavigate('configuracao'),
      }
    );

    // Employees
    for (const emp of employees) {
      list.push({
        id: `emp:${emp.id}`,
        section: 'Funcionários',
        title: formatEmployeeName(emp.nome),
        subtitle: `${emp.matricula} • ${emp.especialidade || 'Sem especialidade'} • ${emp.coordenacao || 'Sem coordenação'}`,
        icon: UserRound,
        keywords: `${emp.nome} ${emp.matricula} ${emp.cpf} ${emp.especialidade} ${emp.coordenacao} ${emp.lotacao} ${emp.empresa}`,
        action: () => onViewEmployee(emp),
      });
    }

    // Empresas
    for (const e of empresas) {
      list.push({
        id: `empresa:${e.id}`,
        section: 'Empresas',
        title: e.razaoSocial || e.cnpj,
        subtitle: `CNPJ ${e.cnpj || '—'}`,
        icon: Building2,
        keywords: `${e.razaoSocial} ${e.cnpj} empresa terceirizada`,
        action: () => onNavigate('configuracao'),
      });
    }

    // Contratos
    for (const c of contratos) {
      list.push({
        id: `contrato:${c.id}`,
        section: 'Contratos',
        title: c.numero || c.descricao,
        subtitle: `${c.descricao || 'Sem descrição'} • ${c.empresa || 'Sem empresa'}`,
        icon: FileSignature,
        keywords: `${c.numero} ${c.descricao} ${c.empresa} contrato`,
        action: () => onNavigate('configuracao'),
      });
    }

    // Unidades
    for (const u of unidades) {
      list.push({
        id: `unidade:${u.id}`,
        section: 'Unidades',
        title: u.nome,
        subtitle: 'Unidade / Lotação física',
        icon: MapPin,
        keywords: `${u.nome} unidade lotacao local`,
        action: () => onNavigate('configuracao'),
      });
    }

    // Coordenações
    for (const c of coordenacoes) {
      list.push({
        id: `coord:${c.id}`,
        section: 'Coordenações',
        title: c.nome,
        subtitle: c.coordenador ? `Coordenador: ${c.coordenador}` : 'Coordenação',
        icon: Compass,
        keywords: `${c.nome} ${c.coordenador || ''} coordenacao`,
        action: () => onNavigate('configuracao'),
      });
    }

    // Actions
    list.push(
      {
        id: 'action:new-employee',
        section: 'Ações rápidas',
        title: 'Cadastrar novo funcionário',
        subtitle: 'Abrir formulário de inclusão',
        icon: Plus,
        keywords: 'cadastrar novo funcionario colaborador terceirizado',
        action: onOpenNewEmployee,
      },
      {
        id: 'action:drivers',
        section: 'Ações rápidas',
        title: 'Ver condutores credenciados',
        subtitle: 'Listar funcionários autorizados a dirigir',
        icon: Car,
        keywords: 'condutores motoristas autorizados dirigir carteira cnh',
        action: onOpenDrivers,
      },
      {
        id: 'action:install',
        section: 'Ações rápidas',
        title: 'Instalar aplicativo',
        subtitle: 'Adicionar SIT à tela inicial',
        icon: Download,
        keywords: 'instalar app pwa download tela inicial',
        action: () => window.dispatchEvent(new CustomEvent('reopen-pwa-prompt')),
      },
      {
        id: 'action:logout',
        section: 'Ações rápidas',
        title: 'Sair do sistema',
        subtitle: 'Encerrar sessão atual',
        icon: LogOut,
        keywords: 'sair logout encerrar sessao',
        action: onLogout,
      }
    );

    return list;
  }, [employees, empresas, contratos, unidades, coordenacoes, onNavigate, onViewEmployee, onOpenDrivers, onOpenNewEmployee, onLogout]);

  const filtered = useMemo(() => {
    if (!query.trim()) {
      // Show recent history first, then a curated subset of top actions
      const history = historyIds
        .map((id) => commands.find((c) => c.id === id))
        .filter(Boolean) as CommandItem[];
      const seen = new Set(history.map((c) => c.id));
      const curated = commands.filter((c) => {
        if (seen.has(c.id)) return false;
        return ['nav:painel', 'nav:ferias', 'action:new-employee', 'action:drivers'].includes(c.id);
      });
      return [...history, ...curated];
    }

    const scored = commands
      .map((c) => ({ item: c, score: scoreMatch(query, c) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);
    return scored.map((x) => x.item);
  }, [commands, query, historyIds]);

  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const item of filtered) {
      const list = map.get(item.section) || [];
      list.push(item);
      map.set(item.section, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const flatItems = useMemo(() => filtered, [filtered]);

  // Reset selection when query/filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, flatItems.length]);

  useEffect(() => {
    if (!isOpen) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement;
    inputRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (flatItems.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % flatItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = flatItems[selectedIndex];
        if (item) execute(item);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedRef.current?.focus?.();
    };
  }, [isOpen, flatItems, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector('[data-selected="true"]') as HTMLElement | null;
    if (selected) {
      selected.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' });
    }
  }, [selectedIndex, reducedMotion]);

  const execute = (item: CommandItem) => {
    pushHistoryId(item.id);
    onClose();
    setQuery('');
    setTimeout(() => item.action(), 0);
  };

  if (!isOpen) return null;

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Paleta de comandos"
      className="fixed inset-0 z-[10002] flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 pt-16 sm:pt-24"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <div
        className="w-full max-w-2xl sit-panel flex flex-col overflow-hidden shadow-2xl shadow-black/50"
        style={{
          maxHeight: 'min(32rem, calc(100vh - 4rem))',
          animation: reducedMotion ? 'none' : 'fadeIn 0.18s ease-out',
        }}
      >
        {/* Search bar */}
        <div className="flex items-center gap-3 p-3 sm:p-4 border-b border-white/10">
          <Search className="h-5 w-5 text-brand-muted shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar pessoas, empresas, contratos, ações..."
            className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder:text-brand-muted/70 focus:outline-none"
            aria-label="Buscar comando"
          />
          <div className="hidden sm:flex items-center gap-1 text-[10px] text-brand-muted">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 font-mono">ESC</kbd>
            <span>fechar</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar paleta de comandos"
            className="sm:hidden inline-flex items-center justify-center rounded-md p-2 text-brand-muted hover:text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-brand-accent"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 sm:p-3">
          {flatItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="h-12 w-12 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent mb-3">
                <Search className="h-6 w-6" aria-hidden="true" />
              </div>
              <p className="text-sm font-semibold text-white">Nenhum resultado encontrado</p>
              <p className="text-xs text-brand-muted mt-1">
                Tente buscar por nome, matrícula, CPF, empresa ou ação.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {grouped.map(([section, items]) => (
                <div key={section}>
                  <h3 className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-muted">
                    {section}
                  </h3>
                  <div className="mt-1 space-y-1">
                    {items.map((item) => {
                      const flatIndex = flatItems.indexOf(item);
                      const selected = flatIndex === selectedIndex;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          data-selected={selected}
                          onClick={() => execute(item)}
                          onMouseEnter={() => setSelectedIndex(flatIndex)}
                          className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent ${
                            selected
                              ? 'bg-brand-accent/20 border border-brand-accent/30'
                              : 'hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          <div
                            className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center ${
                              selected ? 'bg-brand-accent/20 text-white' : 'bg-white/5 text-brand-muted'
                            }`}
                          >
                            <Icon className="h-4 w-4" aria-hidden="true" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                            {item.subtitle && (
                              <p className="text-xs text-brand-muted truncate">{item.subtitle}</p>
                            )}
                          </div>
                          {selected && (
                            <CornerDownLeft className="h-4 w-4 text-brand-accent shrink-0" aria-hidden="true" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center justify-between gap-3 px-3 py-2 border-t border-white/10 bg-black/10 text-[10px] text-brand-muted">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <ArrowUpDown className="h-3 w-3" aria-hidden="true" /> Navegar
            </span>
            <span className="inline-flex items-center gap-1">
              <CornerDownLeft className="h-3 w-3" aria-hidden="true" /> Selecionar
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span>{flatItems.length} resultado{flatItems.length === 1 ? '' : 's'}</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CommandPalette;
