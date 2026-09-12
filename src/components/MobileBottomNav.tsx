import React from 'react';
import { Calendar, Clock, FileText, LayoutDashboard, Settings } from 'lucide-react';

export type ApplicationView = 'painel' | 'configuracao' | 'relatorios' | 'ferias' | 'banco-horas';

interface MobileBottomNavProps {
  currentView: ApplicationView;
  onNavigate: (view: ApplicationView) => void;
}

const destinations: Array<{
  view: ApplicationView;
  label: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
}> = [
  { view: 'painel', label: 'Painel', icon: LayoutDashboard },
  { view: 'ferias', label: 'Férias', icon: Calendar },
  { view: 'banco-horas', label: 'Horas', icon: Clock },
  { view: 'relatorios', label: 'Relatórios', icon: FileText },
  { view: 'configuracao', label: 'Config.', icon: Settings },
];

export function MobileBottomNav({ currentView, onNavigate }: MobileBottomNavProps) {
  return (
    <nav
      className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-[9000] lg:hidden"
      aria-label="Navegação principal"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5 px-1.5 pt-1.5">
        {destinations.map(({ view, label, icon: Icon }) => {
          const isActive = currentView === view;

          return (
            <button
              key={view}
              type="button"
              onClick={() => onNavigate(view)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`Ir para ${label}`}
              className={`relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent ${
                isActive
                  ? 'text-white'
                  : 'text-brand-muted hover:bg-white/5 hover:text-white'
              }`}
            >
              {isActive && (
                <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-brand-accent" aria-hidden="true" />
              )}
              <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-brand-accent' : ''}`} aria-hidden={true} />
              <span className="w-full truncate text-center text-[10px] font-semibold leading-none">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}