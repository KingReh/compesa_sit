import { Users, FileText, Briefcase, Car, LucideIcon } from 'lucide-react';
import { Employee, Unidade, Contrato } from '../types';

interface DashboardProps {
  employees: Employee[];
  unidades: Unidade[];
  contratos: Contrato[];
  onDriversClick?: () => void;
}

export function Dashboard({ employees, unidades, contratos, onDriversClick }: DashboardProps) {
  const totalEmployees = employees.length;

  const totalContracts = contratos.length;

  const specialtiesSet = new Set(employees.map(e => e.especialidade).filter(Boolean));
  const totalSpecialties = specialtiesSet.size;

  const totalDrivers = employees.filter(e => e.autorizadoDirigir).length;

  const stats: { name: string; value: number; icon: LucideIcon; clickable?: boolean }[] = [
    { name: 'TOTAL TERCEIRIZADOS', value: totalEmployees, icon: Users },
    { name: 'CONTRATOS ATIVOS', value: totalContracts, icon: FileText },
    { name: 'ESPECIALIDADES', value: totalSpecialties, icon: Briefcase },
    { name: 'CONDUTORES', value: totalDrivers, icon: Car, clickable: true },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4 sm:mb-6">
      {stats.map((item) => {
        const Icon = item.icon;
        const isClickable = item.clickable && onDriversClick;
        return (
          <div
            key={item.name}
            onClick={isClickable ? onDriversClick : undefined}
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onKeyDown={
              isClickable
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onDriversClick?.();
                    }
                  }
                : undefined
            }
            aria-label={isClickable ? 'Ver condutores credenciados' : undefined}
            title={isClickable ? 'Clique para ver condutores credenciados' : undefined}
            className={`sit-panel p-3 sm:p-4 hover:brightness-110 transition-all flex items-center gap-2.5 sm:gap-4 group ${
              isClickable ? 'cursor-pointer hover:border-brand-accent/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-accent' : ''
            }`}
          >
            <div className="flex shrink-0 items-center justify-center h-10 w-10 sm:h-14 sm:w-14 rounded-full sit-panel-inner">
              <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-brand-muted group-hover:text-white transition-colors" aria-hidden="true" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="typ-subtitle text-brand-muted truncate">{item.name}</span>
              <span className="typ-stat mt-0.5 sm:mt-1">{item.value}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
