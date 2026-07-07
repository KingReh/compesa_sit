import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Edit2, Trash2, ArrowUpDown, ChevronLeft, ChevronRight, UserRound, LayoutGrid, List, CheckCircle2, Filter, X, ChevronDown, MapPin, Building2, FileText, Car, Copy, Shirt, Briefcase, FileSignature } from 'lucide-react';
import { Employee, Unidade, Contrato } from '../types';
import { useFilters } from '../context/FiltersContext';

interface EmployeeTableProps {
  employees: Employee[];
  unidades: Unidade[];
  contratos: Contrato[];
  searchQuery: string;
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
  onView: (employee: Employee) => void;
  onWhatsAppClick: (employee: Employee) => void;
}

type SortField = 'nome' | 'matricula' | 'cpf' | 'especialidade' | 'coordenacao' | null;
type SortOrder = 'asc' | 'desc';

export function EmployeeTable({ employees, unidades, contratos, searchQuery, onEdit, onDelete, onView, onWhatsAppClick }: EmployeeTableProps) {
  // Filtros globais (Single Source of Truth) — persistidos automaticamente
  // pelo FiltersProvider e compartilhados com Central de Notificações e
  // Mapa de Lotações.
  const {
    selectedLotacao,
    selectedCoordenacao,
    selectedEmpresa,
    selectedContrato,
    setSelectedLotacao,
    setSelectedCoordenacao,
    setSelectedEmpresa,
    setSelectedContrato,
  } = useFilters();

  const [sortField, setSortField] = useState<SortField>(() => {
    try {
      const saved = localStorage.getItem('@sit:sortField');
      return saved ? (saved as SortField) : null;
    } catch {
      return null;
    }
  });

  const [sortOrder, setSortOrder] = useState<SortOrder>(() => {
    try {
      const saved = localStorage.getItem('@sit:sortOrder');
      return (saved === 'asc' || saved === 'desc') ? saved : 'asc';
    } catch {
      return 'asc';
    }
  });

  // currentPage is transient — always reset on (re)mount/session start.
  const [currentPage, setCurrentPage] = useState<number>(1);

  const itemsPerPage = 8;

  const [toast, setToast] = useState<string | null>(null);

  const [showFilters, setShowFilters] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('@sit:showFilters');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  // Persist preferences
  useEffect(() => {
    try {
      if (sortField) {
        localStorage.setItem('@sit:sortField', sortField);
      } else {
        localStorage.removeItem('@sit:sortField');
      }
    } catch (e) {
      console.error(e);
    }
  }, [sortField]);

  useEffect(() => {
    try {
      localStorage.setItem('@sit:sortOrder', sortOrder);
    } catch (e) {
      console.error(e);
    }
  }, [sortOrder]);

  // currentPage is transient — intentionally not persisted.

  useEffect(() => {
    try {
      localStorage.setItem('@sit:selectedLotacao', selectedLotacao);
    } catch (e) {
      console.error(e);
    }
  }, [selectedLotacao]);

  useEffect(() => {
    try {
      localStorage.setItem('@sit:selectedCoordenacao', selectedCoordenacao);
    } catch (e) {
      console.error(e);
    }
  }, [selectedCoordenacao]);

  useEffect(() => {
    try {
      localStorage.setItem('@sit:selectedEmpresa', selectedEmpresa);
    } catch (e) {
      console.error(e);
    }
  }, [selectedEmpresa]);

  useEffect(() => {
    try {
      localStorage.setItem('@sit:selectedContrato', selectedContrato);
    } catch (e) {
      console.error(e);
    }
  }, [selectedContrato]);

  useEffect(() => {
    try {
      localStorage.setItem('@sit:showFilters', String(showFilters));
    } catch (e) {
      console.error(e);
    }
  }, [showFilters]);

  // Dynamic values and item counts built directly from the unfiltered employees array
  const lotacaoOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    
    // Initialize standard unidades with 0
    unidades.forEach((u) => {
      counts[u.nome] = 0;
    });

    // Count employees
    employees.forEach((emp) => {
      const val = (emp.lotacao || '').trim();
      if (val) {
        counts[val] = (counts[val] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, unidades]);

  const coordenacaoOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    employees.forEach((emp) => {
      const val = (emp.coordenacao || '').trim();
      if (val) {
        counts[val] = (counts[val] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees]);

  const empresaOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    employees.forEach((emp) => {
      const val = (emp.empresa || '').trim();
      if (val) {
        counts[val] = (counts[val] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees]);

  const contratoOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    
    // Initialize standard contracts from database with 0
    contratos.forEach((c) => {
      counts[c.numero] = 0;
    });

    // Count employees
    employees.forEach((emp) => {
      const val = (emp.contrato || '').trim();
      if (val) {
        counts[val] = (counts[val] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([numero, count]) => {
        const contratoObj = contratos.find((c) => c.numero === numero);
        return {
          numero,
          descricao: contratoObj ? contratoObj.descricao : '',
          count
        };
      })
      .sort((a, b) => a.numero.localeCompare(b.numero));
  }, [employees, contratos]);

  const handleCopy = (text: string, field: 'nome' | 'matricula' | 'cpf') => {
    const textToCopy = field === 'cpf' ? text.replace(/\D/g, '') : text;
    navigator.clipboard.writeText(textToCopy).then(() => {
      const labels = {
        nome: 'Nome',
        matricula: 'Matrícula',
        cpf: 'CPF'
      };
      setToast(`${labels[field]} copiado com sucesso`);
    }).catch((err) => {
      console.error('Failed to copy: ', err);
    });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const [viewMode, setViewMode] = useState<'table' | 'card'>(() => {
    try {
      const saved = localStorage.getItem('@sit:viewMode');
      return (saved === 'card' || saved === 'table') ? saved : 'table';
    } catch {
      return 'table';
    }
  });

  const handleToggleViewMode = (mode: 'table' | 'card') => {
    setViewMode(mode);
    try {
      localStorage.setItem('@sit:viewMode', mode);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedEmployees = useMemo(() => {
    let result = employees;

    // Filter text search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.nome.toLowerCase().includes(q) ||
          e.matricula.toLowerCase().includes(q) ||
          e.cpf.includes(q) ||
          e.especialidade.toLowerCase().includes(q) ||
          e.coordenacao.toLowerCase().includes(q)
      );
    }

    // Filter dynamic lotacao
    if (selectedLotacao) {
      result = result.filter((e) => (e.lotacao || '').trim() === selectedLotacao);
    }

    // Filter dynamic coordenacao
    if (selectedCoordenacao) {
      result = result.filter((e) => (e.coordenacao || '').trim() === selectedCoordenacao);
    }

    // Filter dynamic empresa
    if (selectedEmpresa) {
      result = result.filter((e) => (e.empresa || '').trim() === selectedEmpresa);
    }

    // Filter dynamic contrato
    if (selectedContrato) {
      result = result.filter((e) => (e.contrato || '').trim() === selectedContrato);
    }

    // Sort
    if (sortField) {
      result = [...result].sort((a, b) => {
        const aVal = String(a[sortField]).toLowerCase();
        const bVal = String(b[sortField]).toLowerCase();
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [employees, searchQuery, selectedLotacao, selectedCoordenacao, selectedEmpresa, selectedContrato, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredAndSortedEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const isFirstMount = React.useRef(true);

  // Reset to page 1 on new search or filter selection
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setCurrentPage(1);
  }, [searchQuery, selectedLotacao, selectedCoordenacao, selectedEmpresa, selectedContrato]);

  const SortHeader = ({ field, label, align = 'left', className = '' }: { field: SortField; label: string; align?: 'left' | 'center' | 'right'; className?: string }) => (
    <th
      className={`px-2 py-2 cursor-pointer hover:bg-brand-panel-light/30 group transition-colors text-${align} ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className={`flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase text-brand-muted group-hover:text-white ${
        align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : ''
      }`}>
        <span className="truncate">{label}</span>
        <ArrowUpDown className={`h-2.5 w-2.5 flex-shrink-0 ${sortField === field ? 'text-brand-accent' : 'text-brand-muted group-hover:text-brand-accent/70'}`} />
      </div>
    </th>
  );

  return (
    <>
      <div className="sit-panel overflow-hidden flex flex-col">
      {/* Table/Card Header Controller */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-brand-border/40 bg-black/10">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-accent">
          Cofre de Registros ({filteredAndSortedEmployees.length})
        </span>
        <div className="flex items-center gap-2">
          {/* Dynamic Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm ${
              showFilters || selectedLotacao || selectedCoordenacao || selectedEmpresa || selectedContrato
                ? 'bg-brand-accent/20 border-brand-accent text-[#6ee7b7]'
                : 'bg-black/25 border-white/10 text-brand-muted hover:text-white hover:bg-black/40'
            }`}
            title="Filtros avançados (Lotação, Coordenação, Empresa, Contrato)"
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filtros</span>
            {(selectedLotacao || selectedCoordenacao || selectedEmpresa || selectedContrato) && (
              <span className="flex h-1.5 w-1.5 rounded-full bg-green-400"></span>
            )}
          </button>

          <div className="flex items-center gap-1.5 bg-black/30 p-1 rounded-lg border border-white/5 shadow-inner">
            <button
              onClick={() => handleToggleViewMode('table')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-brand-panel-light text-white shadow-sm'
                  : 'text-brand-muted hover:text-white'
              }`}
              title="Visualização em Tabela"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleToggleViewMode('card')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'card'
                  ? 'bg-brand-panel-light text-white shadow-sm'
                  : 'text-brand-muted hover:text-white'
              }`}
              title="Visualização em Cards"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible Dynamic Filter Selection Drawer */}
      {showFilters && (
        <div className="bg-black/20 border-b border-brand-border/30 p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-slide-up">
          {/* Lotação */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-brand-muted tracking-wide uppercase flex items-center gap-1.5 select-none">
              <MapPin className="h-3.5 w-3.5 text-brand-accent shrink-0" />
              <span>Filtrar por Lotação</span>
            </label>
            <div className="relative">
              <select
                value={selectedLotacao}
                onChange={(e) => setSelectedLotacao(e.target.value)}
                className="sit-input w-full rounded-lg py-2.5 pl-3 pr-8 text-xs appearance-none cursor-pointer font-semibold"
              >
                <option value="" className="bg-brand-panel">Todas as Lotações ({employees.length})</option>
                {lotacaoOptions.map((lot) => (
                  <option key={lot.name} value={lot.name} className="bg-brand-panel">
                    {lot.name} ({lot.count})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-brand-muted">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Coordenação */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-brand-muted tracking-wide uppercase flex items-center gap-1.5 select-none">
              <Building2 className="h-3.5 w-3.5 text-brand-accent shrink-0" />
              <span>Filtrar por Coordenação</span>
            </label>
            <div className="relative">
              <select
                value={selectedCoordenacao}
                onChange={(e) => setSelectedCoordenacao(e.target.value)}
                className="sit-input w-full rounded-lg py-2.5 pl-3 pr-8 text-xs appearance-none cursor-pointer font-semibold"
              >
                <option value="" className="bg-brand-panel">Todas as Coordenações ({employees.length})</option>
                {coordenacaoOptions.map((coord) => (
                  <option key={coord.name} value={coord.name} className="bg-brand-panel">
                    {coord.name} ({coord.count})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-brand-muted">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Empresa */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-brand-muted tracking-wide uppercase flex items-center gap-1.5 select-none font-sans">
              <Building2 className="h-3.5 w-3.5 text-brand-accent shrink-0" />
              <span>Filtrar por Empresa</span>
            </label>
            <div className="relative">
              <select
                value={selectedEmpresa}
                onChange={(e) => setSelectedEmpresa(e.target.value)}
                className="sit-input w-full rounded-lg py-2.5 pl-3 pr-8 text-xs appearance-none cursor-pointer font-semibold font-sans"
              >
                <option value="" className="bg-brand-panel">Todas as Empresas ({employees.length})</option>
                {empresaOptions.map((emp) => (
                  <option key={emp.name} value={emp.name} className="bg-brand-panel">
                    {emp.name} ({emp.count})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-brand-muted">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Contrato */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-brand-muted tracking-wide uppercase flex items-center gap-1.5 select-none font-sans">
              <FileSignature className="h-3.5 w-3.5 text-brand-accent shrink-0" />
              <span>Filtrar por Contratos</span>
            </label>
            <div className="relative">
              <select
                value={selectedContrato}
                onChange={(e) => setSelectedContrato(e.target.value)}
                className="sit-input w-full rounded-lg py-2.5 pl-3 pr-8 text-xs appearance-none cursor-pointer font-semibold font-sans"
              >
                <option value="" className="bg-brand-panel">Todos os Contratos ({employees.length})</option>
                {contratoOptions.map((ct) => (
                  <option key={ct.numero} value={ct.numero} className="bg-brand-panel">
                    {ct.numero} - {ct.descricao || 'Sem Descrição'} ({ct.count})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-brand-muted">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Badges */}
      {(selectedLotacao || selectedCoordenacao || selectedEmpresa || selectedContrato) && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-[#0d3466]/40 border-b border-brand-border/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mr-1.5 flex items-center gap-1 leading-none select-none">
            <span className="flex h-1.5 w-1.5 rounded-full bg-[#10b981]"></span>
            Filtros Ativos:
          </span>
          
          {selectedLotacao && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-accent/15 border border-brand-accent/30 px-2 py-0.5 text-xs text-brand-accent font-medium">
              <span>Lotação: {selectedLotacao}</span>
              <button 
                onClick={() => setSelectedLotacao('')}
                className="hover:bg-brand-accent/20 rounded-full p-0.5 transition-colors cursor-pointer"
                title="Remover Lotação"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {selectedCoordenacao && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-accent/15 border border-brand-accent/30 px-2 py-0.5 text-xs text-brand-accent font-medium">
              <span>Coordenação: {selectedCoordenacao}</span>
              <button 
                onClick={() => setSelectedCoordenacao('')}
                className="hover:bg-brand-accent/20 rounded-full p-0.5 transition-colors cursor-pointer"
                title="Remover Coordenação"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {selectedEmpresa && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-accent/15 border border-brand-accent/30 px-2 py-0.5 text-xs text-brand-accent font-medium">
              <span>Empresa: {selectedEmpresa}</span>
              <button 
                onClick={() => setSelectedEmpresa('')}
                className="hover:bg-brand-accent/20 rounded-full p-0.5 transition-colors cursor-pointer"
                title="Remover Empresa"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {selectedContrato && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-accent/15 border border-brand-accent/30 px-2 py-0.5 text-xs text-brand-accent font-medium">
              <span>Contrato: {selectedContrato}</span>
              <button 
                onClick={() => setSelectedContrato('')}
                className="hover:bg-brand-accent/20 rounded-full p-0.5 transition-colors cursor-pointer"
                title="Remover Contrato"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          <button
            onClick={() => {
              setSelectedLotacao('');
              setSelectedCoordenacao('');
              setSelectedEmpresa('');
              setSelectedContrato('');
            }}
            className="text-[10.5px] font-bold text-brand-muted hover:text-white underline decoration-dotted underline-offset-4 ml-auto transition-all cursor-pointer mr-1"
          >
            Limpar todos os filtros
          </button>
        </div>
      )}

      {viewMode === 'table' ? (
        <div className="overflow-x-auto rounded-md border border-brand-border/30 m-4 styled-scrollbars-light">
          <table className="w-[850px] lg:w-full table-fixed divide-y divide-brand-border">
            <thead className="bg-black/20 border-b border-brand-border/40">
              <tr>
                <th className="w-10 px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-brand-muted">Foto</th>
                <SortHeader field="nome" label="Nome" align="center" className="w-[230px]" />
                <SortHeader field="matricula" label="Matrícula" align="center" className="w-[85px] sm:w-[90px]" />
                <SortHeader field="cpf" label="CPF" align="center" className="w-[95px] sm:w-[105px]" />
                <th className="w-[95px] sm:w-[105px] px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-brand-muted">Contato</th>
                <SortHeader field="especialidade" label="Especialidade" align="center" className="w-[14%] sm:w-[15%]" />
                <SortHeader field="coordenacao" label="Coordenação" align="center" className="w-[12%] sm:w-[14%]" />
                <th className="w-[80px] sm:w-[85px] px-2 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-brand-muted">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border bg-transparent">
              {paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-brand-muted">
                      <UserRound className="h-10 w-10 mb-3 opacity-40 text-brand-accent" />
                      <p className="text-sm font-semibold text-white">Nenhum funcionário encontrado.</p>
                      <p className="text-xs text-brand-muted mt-1">Tente ajustar seus termos de pesquisa.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-brand-panel-light/15 transition-colors border-b border-brand-border/20 last:border-0 animate-fade-in">
                    <td className="px-2 py-1.5 align-middle w-14">
                      <div className="h-9 w-9 mx-auto flex-shrink-0 rounded-full overflow-hidden ring-2 ring-brand-border/60 shadow-sm bg-brand-panel-light flex items-center justify-center">
                        {employee.foto ? (
                          <img
                            src={employee.foto}
                            alt={employee.nome}
                            loading="lazy"
                            decoding="async"
                            draggable={false}
                            className="h-full w-full object-cover select-none"
                            style={{ objectPosition: 'center 30%' }}
                          />
                        ) : (
                          <UserRound className="h-4 w-4 text-brand-muted" />
                        )}
                      </div>
                    </td>
                    <td 
                      className="px-2 py-1.5 cursor-pointer group/copy transition-colors hover:bg-white/[0.02] align-middle overflow-hidden w-[250px]"
                      onClick={() => handleCopy(employee.nome, 'nome')}
                      title={`Clique para copiar: ${employee.nome}`}
                    >
                      <div className="text-[10.5px] sm:text-[11px] font-semibold text-white/95 truncate group-hover/copy:text-brand-accent transition-colors flex items-center gap-1.5 min-w-0">
                        <span className="truncate">{employee.nome}</span>
                        {employee.autorizadoDirigir && (
                          <Car className="h-3 w-3 text-emerald-400 shrink-0" aria-label="Motorista Autorizado" />
                        )}
                      </div>
                    </td>
                    <td 
                      className="px-2 py-1.5 cursor-pointer group/copy hover:bg-white/[0.02] transition-colors text-center align-middle overflow-hidden"
                      onClick={() => handleCopy(employee.matricula, 'matricula')}
                      title="Clique para copiar Matrícula"
                    >
                      <div className="inline-flex items-center justify-center w-full">
                        <span className="inline-flex center rounded bg-brand-panel-light/50 px-1.5 py-0.5 text-[8.5px] sm:text-[9.5px] font-bold text-brand-accent ring-1 ring-inset ring-brand-accent/20 font-mono truncate group-hover/copy:brightness-110 transition-all max-w-full">
                          {employee.matricula}
                        </span>
                      </div>
                    </td>
                    <td 
                      className="px-2 py-1.5 text-[9px] sm:text-[10px] font-mono text-brand-muted/90 cursor-pointer group/copy hover:bg-white/[0.02] transition-colors text-center align-middle overflow-hidden"
                      onClick={() => handleCopy(employee.cpf, 'cpf')}
                      title="Clique para copiar CPF"
                    >
                      <div className="truncate group-hover/copy:text-white transition-colors">{employee.cpf}</div>
                    </td>
                    <td 
                      className={`px-2 py-1.5 text-center text-[9px] sm:text-[10px] text-brand-muted/90 font-mono align-middle overflow-hidden ${
                        employee.telefone && employee.telefone.trim() !== '-' && employee.telefone.trim() !== ''
                          ? 'cursor-pointer hover:text-brand-accent hover:underline transition-colors'
                          : ''
                      }`}
                      onClick={() => {
                        if (employee.telefone && employee.telefone.trim() !== '-' && employee.telefone.trim() !== '') {
                          onWhatsAppClick(employee);
                        }
                      }}
                      title={employee.telefone && employee.telefone.trim() !== '-' && employee.telefone.trim() !== '' ? `Falar: ${employee.telefone}` : ""}
                    >
                      <div className="truncate">{employee.telefone || '-'}</div>
                    </td>
                    <td className="px-2 py-1.5 align-middle overflow-hidden" title={employee.especialidade}>
                      <div className="text-[9.5px] sm:text-[10px] font-medium text-white/90 truncate">{employee.especialidade}</div>
                    </td>
                    <td className="px-2 py-1.5 align-middle overflow-hidden" title={employee.coordenacao}>
                       <div className="text-[9.5px] sm:text-[10px] text-brand-muted/90 truncate">{employee.coordenacao}</div>
                    </td>
                    <td className="px-2 py-1.5 align-middle overflow-hidden">
                      <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                        <button
                           onClick={() => onView(employee)}
                           title="Visualizar"
                           className="text-brand-muted hover:text-white p-1 rounded hover:bg-brand-panel-light transition-colors"
                        >
                           <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </button>
                        <button
                          onClick={() => onEdit(employee)}
                          title="Editar"
                          className="text-brand-muted hover:text-white p-1 rounded hover:bg-brand-panel-light transition-colors"
                        >
                          <Edit2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(employee.id)}
                          title="Excluir"
                          className="text-brand-muted hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-5">
          {paginatedEmployees.length === 0 ? (
            <div className="py-12 text-center text-brand-muted">
              <UserRound className="h-10 w-10 mb-3 mx-auto opacity-40 text-brand-accent" />
              <p className="text-sm font-semibold text-white">Nenhum funcionário encontrado.</p>
              <p className="text-xs text-brand-muted mt-1">Tente ajustar seus termos de pesquisa.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {paginatedEmployees.map((employee) => (
                <div
                  key={employee.id}
                  className="rounded-2xl border border-white/5 bg-slate-900/40 hover:bg-slate-950/60 hover:-translate-y-1 hover:border-brand-accent/40 hover:shadow-[0_12px_24px_-8px_rgba(59,130,246,0.25)] transition-all duration-300 p-3.5 flex flex-col justify-between overflow-hidden relative group animate-fade-in before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-brand-accent/30 before:to-[#6ee7b7]/20 before:transition-all before:duration-300 hover:before:from-brand-accent hover:before:to-[#6ee7b7]"
                >
                  <div>
                    {/* Header: Photo and Info */}
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0 h-[50px] w-[50px]">
                        <div className="h-full w-full rounded-full overflow-hidden ring-2 ring-brand-border/60 group-hover:ring-brand-accent/60 transition-all duration-300 bg-brand-panel-light flex items-center justify-center shadow-inner">
                          {employee.foto ? (
                            <img
                              src={employee.foto}
                              alt={employee.nome}
                              loading="lazy"
                              decoding="async"
                              draggable={false}
                              className="h-full w-full object-cover select-none transition-transform duration-500 group-hover:scale-105"
                              style={{ objectPosition: 'center 30%' }}
                            />
                          ) : (
                            <UserRound className="h-6 w-6 text-brand-muted/70 group-hover:text-brand-accent transition-colors duration-300" />
                          )}
                        </div>
                        {employee.autorizadoDirigir && (
                          <div 
                            className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center ring-2 ring-brand-border/60 group-hover:ring-brand-accent/60 shadow z-10" 
                            title="Motorista Autorizado"
                          >
                            <Car className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div 
                          className="cursor-pointer group/copy flex items-center gap-1 min-w-0"
                          onClick={() => handleCopy(employee.nome, 'nome')}
                          title="Clique para copiar Nome"
                        >
                          <h4 className="text-[12px] font-bold text-white tracking-tight leading-snug truncate group-hover/copy:text-brand-accent transition-colors" title={employee.nome}>
                            {employee.nome}
                          </h4>
                          <Copy className="h-2.5 w-2.5 text-brand-muted opacity-0 group-hover/copy:opacity-100 transition-opacity shrink-0 ml-0.5" />
                        </div>
                        
                        <div className="mt-0.5">
                          <span className="inline-flex items-center rounded-md bg-brand-accent/10 border border-brand-accent/20 px-1.5 py-0.5 text-[8.5px] font-bold text-brand-accent tracking-wide uppercase leading-none">
                            {employee.especialidade}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Copyable Identifiers Row */}
                    <div className="grid grid-cols-2 gap-2 mt-3.5 pt-3 border-t border-white/5">
                      <div 
                        className="cursor-pointer group/copy relative bg-black/15 hover:bg-white/[0.04] p-1.5 rounded-lg border border-white/5 hover:border-brand-accent/20 transition-all duration-250 flex flex-col justify-between"
                        onClick={() => handleCopy(employee.matricula, 'matricula')}
                        title="Clique para copiar Matrícula"
                      >
                        <span className="text-brand-muted block text-[8.5px] font-bold uppercase tracking-wider select-none leading-none mb-1">
                          Matrícula
                        </span>
                        <div className="flex items-center justify-between min-w-0">
                          <span className="text-white text-[10px] font-bold font-mono truncate group-hover/copy:text-brand-accent transition-colors">{employee.matricula}</span>
                          <Copy className="h-2.5 w-2.5 text-brand-muted opacity-0 group-hover/copy:opacity-100 transition-opacity ml-1 flex-shrink-0" />
                        </div>
                      </div>

                      <div 
                        className="cursor-pointer group/copy relative bg-black/15 hover:bg-white/[0.04] p-1.5 rounded-lg border border-white/5 hover:border-brand-accent/20 transition-all duration-250 flex flex-col justify-between"
                        onClick={() => handleCopy(employee.cpf, 'cpf')}
                        title="Clique para copiar CPF"
                      >
                        <span className="text-brand-muted block text-[8.5px] font-bold uppercase tracking-wider select-none leading-none mb-1">
                          CPF
                        </span>
                        <div className="flex items-center justify-between min-w-0">
                          <span className="text-white/90 text-[10px] font-medium font-mono truncate group-hover/copy:text-brand-accent transition-colors">{employee.cpf}</span>
                          <Copy className="h-2.5 w-2.5 text-brand-muted opacity-0 group-hover/copy:opacity-100 transition-opacity ml-1 flex-shrink-0" />
                        </div>
                      </div>
                    </div>

                    {/* Structured Info Card Well */}
                    <div className="mt-2.5 p-2 rounded-lg bg-black/15 border border-white/5 flex flex-col gap-1.5">
                      {/* Lotação */}
                      <div className="flex items-center gap-2 min-w-0" title={`Lotação: ${employee.lotacao || '-'}`}>
                        <MapPin className="h-3 w-3 text-brand-accent/70 shrink-0" />
                        <span className="text-[9px] text-brand-muted font-bold uppercase tracking-wider shrink-0 w-[45px]">Lotação:</span>
                        <span className="text-[10px] text-white/90 font-medium truncate min-w-0 flex-1">{employee.lotacao || '-'}</span>
                      </div>
                      
                      {/* Coordenação */}
                      <div className="flex items-center gap-2 min-w-0" title={`Coordenação: ${employee.coordenacao || '-'}`}>
                        <Building2 className="h-3 w-3 text-[#10b981]/70 shrink-0" />
                        <span className="text-[9px] text-brand-muted font-bold uppercase tracking-wider shrink-0 w-[45px]">Coord:</span>
                        <span className="text-[10px] text-white/90 font-medium truncate min-w-0 flex-1">{employee.coordenacao || '-'}</span>
                      </div>

                      {/* Contrato */}
                      <div className="flex items-center gap-2 min-w-0" title={`Contrato: ${employee.contrato || '-'}`}>
                        <FileText className="h-3 w-3 text-sky-400/70 shrink-0" />
                        <span className="text-[9px] text-brand-muted font-bold uppercase tracking-wider shrink-0 w-[45px]">Contr:</span>
                        <span className="text-[10px] text-brand-accent font-bold font-mono truncate min-w-0 flex-1">{employee.contrato || '-'}</span>
                      </div>

                      {/* Empresa */}
                      <div className="flex items-center gap-2 min-w-0" title={`Empresa: ${employee.empresa || '-'}`}>
                        <Briefcase className="h-3 w-3 text-amber-500/70 shrink-0" />
                        <span className="text-[9px] text-brand-muted font-bold uppercase tracking-wider shrink-0 w-[45px]">Empresa:</span>
                        <span className="text-[10px] text-white/90 font-medium truncate min-w-0 flex-1">{employee.empresa || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & WhatsApp footer */}
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/5">
                    {employee.telefone && employee.telefone.trim() !== '-' && employee.telefone.trim() !== '' ? (
                      <button
                        onClick={() => onWhatsAppClick(employee)}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/35 transition-all text-[9.5px] font-mono font-bold tracking-tight cursor-pointer group/wa shrink-0 active:scale-95"
                        title={`Falar no WhatsApp: ${employee.telefone}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                        <span className="group-hover/wa:underline truncate max-w-[95px] sm:max-w-[105px]">{employee.telefone}</span>
                      </button>
                    ) : (
                      <span className="text-[9.5px] text-brand-muted/40 font-mono italic select-none">-</span>
                    )}

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onView(employee)}
                        title="Visualizar Registro"
                        className="text-brand-muted hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all active:scale-95 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onEdit(employee)}
                        title="Editar Registro"
                        className="text-brand-muted hover:text-brand-accent p-1.5 rounded-lg hover:bg-brand-accent/10 transition-all active:scale-95 cursor-pointer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(employee.id)}
                        title="Excluir Registro"
                        className="text-brand-muted hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all active:scale-95 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pagination Container */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-brand-border bg-black/10 px-6 py-4">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-brand-border sit-panel-inner px-4 py-2 typ-card-desc text-white hover:brightness-110 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-brand-border sit-panel-inner px-4 py-2 typ-card-desc text-white hover:brightness-110 disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="typ-card-desc">
                Mostrando <span className="font-bold text-white">{((currentPage - 1) * itemsPerPage) + 1}</span> até{' '}
                <span className="font-bold text-white">
                  {Math.min(currentPage * itemsPerPage, filteredAndSortedEmployees.length)}
                </span>{' '}
                de <span className="font-bold text-white">{filteredAndSortedEmployees.length}</span> resultados
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-brand-muted ring-1 ring-inset ring-brand-border bg-brand-panel hover:bg-brand-panel-light focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Anterior</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus:outline-offset-0 ${
                      currentPage === idx + 1
                        ? 'z-10 bg-brand-panel-light text-white ring-1 ring-inset ring-brand-border'
                        : 'text-brand-muted ring-1 ring-inset ring-brand-border bg-brand-panel hover:bg-brand-panel-light'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-brand-muted ring-1 ring-inset ring-brand-border bg-brand-panel hover:bg-brand-panel-light focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Próxima</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Overlay Notification (Toast) */}
      {toast && typeof document !== 'undefined' && createPortal(
        <div 
          id="copy-toast" 
          className="fixed bottom-6 left-6 z-[9999] flex items-center gap-2.5 rounded-lg border border-brand-accent/30 bg-[#121620]/95 backdrop-blur-sm px-4 py-3 text-xs font-semibold text-[#6ee7b7] shadow-2xl shadow-black/80 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
        >
          <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
          <span className="text-white">{toast}</span>
        </div>,
        document.body
      )}
    </>
  );
}
