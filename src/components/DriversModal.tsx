import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Car, X, Phone, MapPin, UserRound, Search, Eye, Building } from 'lucide-react';
import { Employee } from '../types';

interface DriversModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onView?: (employee: Employee) => void;
}

export function DriversModal({ isOpen, onClose, employees, onView }: DriversModalProps) {
  const [search, setSearch] = useState('');

  const drivers = useMemo(() => {
    return employees.filter((e) => e.autorizadoDirigir);
  }, [employees]);

  const filtered = useMemo(() => {
    if (!search.trim()) return drivers;
    const q = search.toLowerCase();
    return drivers.filter(
      (e) =>
        e.nome.toLowerCase().includes(q) ||
        e.matricula.toLowerCase().includes(q) ||
        e.telefone.toLowerCase().includes(q)
    );
  }, [drivers, search]);

  if (!isOpen) return null;

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/70 backdrop-blur-md p-0 sm:p-4 animate-fade-in"
    >
      <div className="sit-panel relative w-full max-w-4xl overflow-hidden shadow-2xl border border-brand-accent/20 rounded-none sm:rounded-2xl flex flex-col max-h-screen sm:max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-border/40 px-4 sm:px-6 py-3.5 sm:py-4 bg-gradient-to-b from-black/20 to-transparent shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 shrink-0">
              <Car className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-black text-emerald-300 uppercase tracking-widest block font-mono">
                Credenciados SIT
              </span>
              <h3 className="text-sm sm:text-lg font-black text-white tracking-tight uppercase truncate">
                Condutores Credenciados
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2.5 bg-white/5 border border-white/5 text-brand-muted hover:bg-white/10 hover:text-white active:scale-95 transition-all shrink-0 ml-2"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-brand-border/30 bg-black/10">
          <div className="relative max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-brand-muted">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nome, matrícula ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sit-input block w-full rounded-lg py-2 sm:py-2.5 pl-10 pr-4 text-xs sm:text-sm"
            />
          </div>
          <p className="mt-2 text-[10px] sm:text-xs text-brand-muted">
            Total de condutores: <strong className="text-emerald-300">{drivers.length}</strong>
            {filtered.length !== drivers.length && (
              <span className="ml-2 text-white/70">exibindo {filtered.length}</span>
            )}
          </p>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto styled-scrollbars-light bg-black/5 p-2 sm:p-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 sm:py-14 text-center">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-brand-accent/10 flex items-center justify-center mb-4">
                <Car className="h-6 w-6 sm:h-7 sm:w-7 text-brand-muted" />
              </div>
              <p className="text-sm sm:text-base font-bold text-white mb-1">
                {drivers.length === 0 ? 'Nenhum condutor credenciado' : 'Nenhum resultado encontrado'}
              </p>
              <p className="text-xs text-brand-muted max-w-xs">
                {drivers.length === 0
                  ? 'Não há colaboradores marcados como autorizados a dirigir no momento.'
                  : 'Tente ajustar o termo de busca para localizar o colaborador.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:gap-3">
              {filtered.map((emp) => {
                const cleanPhone = emp.telefone?.replace(/\D/g, '');
                return (
                  <div
                    key={emp.id}
                    className="group flex items-center gap-3 sm:gap-4 rounded-xl border border-white/5 bg-black/15 hover:bg-black/25 hover:border-brand-accent/20 transition-all p-2.5 sm:p-3"
                  >
                    {/* Avatar with badge outside */}
                    <div className="relative shrink-0">
                      <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-full overflow-hidden ring-2 ring-brand-border/60 bg-black/40 flex items-center justify-center">
                        {emp.foto ? (
                          <img
                            src={emp.foto}
                            alt={emp.nome}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            decoding="async"
                            draggable={false}
                          />
                        ) : (
                          <UserRound className="h-5 w-5 sm:h-6 sm:w-6 text-brand-accent" />
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 h-5 w-5 sm:h-5 sm:w-5 bg-emerald-500 rounded-full flex items-center justify-center text-white border-2 border-brand-panel shadow">
                        <Car className="h-2.5 w-2.5 sm:h-2.5 sm:w-2.5" />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <p className="typ-card-title text-sm text-white truncate" title={emp.nome}>
                          {emp.nome}
                        </p>
                        <span className="text-[10px] font-mono text-brand-muted sm:text-xs">
                          MAT: <span className="text-white font-semibold">{emp.matricula || '-'}</span>
                        </span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-brand-muted">
                        {emp.coordenacao && (
                          <span className="inline-flex items-center gap-1">
                            <Building className="h-3 w-3 text-brand-accent" />
                            <span className="truncate max-w-[10rem] sm:max-w-[14rem]" title={emp.coordenacao}>
                              {emp.coordenacao}
                            </span>
                          </span>
                        )}
                        {emp.lotacao && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-brand-accent" />
                            <span className="truncate max-w-[10rem] sm:max-w-[14rem]" title={emp.lotacao}>
                              {emp.lotacao}
                            </span>
                          </span>
                        )}
                        {emp.telefone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3 text-emerald-300" />
                            {emp.telefone}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      {cleanPhone && (
                        <>
                          <a
                            href={`tel:${cleanPhone}`}
                            className="p-2 rounded-lg bg-sky-500/10 border border-sky-400/20 text-sky-300 hover:bg-sky-500/20 transition-colors"
                            aria-label="Ligar"
                            title="Ligar"
                          >
                            <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </a>
                          <a
                            href={`https://wa.me/55${cleanPhone}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-400/20 text-emerald-300 hover:bg-emerald-500/25 transition-colors"
                            aria-label="WhatsApp"
                            title="WhatsApp"
                          >
                            <svg
                              className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                          </a>
                        </>
                      )}
                      {onView && (
                        <button
                          onClick={() => onView(emp)}
                          className="p-2 rounded-lg bg-white/5 border border-white/10 text-brand-muted hover:text-white hover:bg-white/10 transition-colors"
                          aria-label="Ver perfil"
                          title="Ver perfil"
                        >
                          <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-brand-border/40 px-4 sm:px-6 py-3 sm:py-4 bg-black/10 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-brand-muted uppercase tracking-wider font-semibold">
            SIT — Gestão de Terceirizados
          </span>
          <button
            onClick={onClose}
            className="sit-button-primary px-4 py-2 rounded-lg text-xs font-bold"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
