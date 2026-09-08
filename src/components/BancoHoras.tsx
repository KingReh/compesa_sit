import React, { useEffect, useMemo, useState } from 'react';
import { Search, X, Clock, Plus, Eye, User, ArrowUpDown, LayoutGrid, List, Users } from 'lucide-react';
import { Employee, TipoHoraExtra } from '../types';
import { useAuth } from '../context/AuthContext';
import { useFilters } from '../context/FiltersContext';
import { useBancoHoras } from '../hooks/useBancoHoras';
import { formatMinutosToHoras } from '../utils/horas';
import { BancoHorasMovimentacaoModal } from './BancoHorasMovimentacaoModal';
import { BancoHorasDetalhesModal } from './BancoHorasDetalhesModal';

interface Props {
  employees: Employee[];
}

type FiltroSaldo = 'todos' | 'ex50' | 'ex100' | 'sem';
type Ordenacao = 'nome' | 'ex50' | 'ex100' | 'total';
type ViewMode = 'tabela' | 'cards';

const VIEW_MODE_KEY = '@sit:bancoHoras:viewMode';

function normalize(v: string) {
  return v
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function loadStoredViewMode(): ViewMode {
  if (typeof window === 'undefined') return 'tabela';
  const stored = window.localStorage.getItem(VIEW_MODE_KEY);
  return stored === 'cards' ? 'cards' : 'tabela';
}

export function BancoHoras({ employees }: Props) {
  const { user } = useAuth();
  const { applyFilters } = useFilters();
  const { getSaldo, getHistorico, registrarMovimentacao, totais } = useBancoHoras();

  const [busca, setBusca] = useState('');
  const [filtroSaldo, setFiltroSaldo] = useState<FiltroSaldo>('todos');
  const [ordenacao, setOrdenacao] = useState<Ordenacao>('nome');
  const [viewMode, setViewMode] = useState<ViewMode>(() => loadStoredViewMode());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  const [movEmployee, setMovEmployee] = useState<Employee | null>(null);
  const [tipoInicial, setTipoInicial] = useState<TipoHoraExtra>('EX50');
  const [detalhesEmployee, setDetalhesEmployee] = useState<Employee | null>(null);

  const lista = useMemo(() => {
    let result = applyFilters(employees);

    if (busca.trim()) {
      const q = normalize(busca.trim());
      result = result.filter(
        (e) => normalize(e.nome).includes(q) || normalize(e.matricula || '').includes(q)
      );
    }

    result = result.filter((e) => {
      const s = getSaldo(e.id);
      if (filtroSaldo === 'ex50') return s.ex50 > 0;
      if (filtroSaldo === 'ex100') return s.ex100 > 0;
      if (filtroSaldo === 'sem') return s.total === 0;
      return true;
    });

    const sorted = [...result].sort((a, b) => {
      const sa = getSaldo(a.id);
      const sb = getSaldo(b.id);
      switch (ordenacao) {
        case 'ex50':
          return sb.ex50 - sa.ex50 || a.nome.localeCompare(b.nome);
        case 'ex100':
          return sb.ex100 - sa.ex100 || a.nome.localeCompare(b.nome);
        case 'total':
          return sb.total - sa.total || a.nome.localeCompare(b.nome);
        default:
          return a.nome.localeCompare(b.nome);
      }
    });

    return sorted;
  }, [applyFilters, employees, busca, filtroSaldo, ordenacao, getSaldo]);

  const handleConfirmMov = (payload: {
    tipo: TipoHoraExtra;
    operacao: 'adicionar' | 'retirar';
    minutos: number;
    motivo: string;
    data: string;
  }) => {
    if (!movEmployee) return;
    registrarMovimentacao({
      employeeId: movEmployee.id,
      responsavel: user?.nome || 'Usuário do sistema',
      ...payload,
    });
  };

  const abrirMovimentacao = (emp: Employee, tipo: TipoHoraExtra = 'EX50') => {
    setTipoInicial(tipo);
    setMovEmployee(emp);
  };

  const kpis = [
    { label: 'Total EX50% acumulado', value: formatMinutosToHoras(totais.ex50), color: 'text-emerald-300' },
    { label: 'Total EX100% acumulado', value: formatMinutosToHoras(totais.ex100), color: 'text-sky-300' },
    { label: 'Colaboradores com saldo', value: String(totais.comSaldo), color: 'text-white' },
  ];

  const chip = (value: FiltroSaldo, label: string) => (
    <button
      key={value}
      type="button"
      onClick={() => setFiltroSaldo(value)}
      className={`rounded-full px-3 py-1.5 typ-badge border transition-colors whitespace-nowrap ${
        filtroSaldo === value
          ? 'bg-brand-accent/15 border-brand-accent text-white'
          : 'bg-black/10 border-brand-border text-brand-muted hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="animate-fade-in">
      {/* Cabeçalho */}
      <div className="sit-panel p-4 sm:p-6 mb-4 sm:mb-6">
        <p className="typ-subtitle mb-1">Controle de Horas Extras</p>
        <h2 className="typ-hero mt-1">Banco de Horas</h2>
        <p className="typ-card-desc mt-1">
          Acompanhe os saldos EX50% e EX100% acumulados, registre movimentações e consulte o histórico de cada colaborador.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="sit-panel p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-brand-accent" />
              <span className="typ-subtitle text-brand-muted">{k.label}</span>
            </div>
            <p className={`typ-stat font-mono ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Barra de ferramentas */}
      <div className="sit-panel p-3 sm:p-4 mb-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="relative flex-1 min-w-0">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-brand-muted">
              <Search className="h-4 w-4" aria-hidden="true" />
            </div>
            <input
              type="text"
              placeholder="Pesquisar por nome ou matrícula..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="sit-input block w-full rounded-lg py-2.5 pl-10 pr-10 text-xs sm:text-sm"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca('')}
                aria-label="Limpar pesquisa"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-brand-muted hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
              <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted" />
              <select
                aria-label="Ordenar colaboradores"
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value as Ordenacao)}
                className="sit-input w-full rounded-lg py-2.5 pl-9 pr-3 text-xs sm:text-sm"
              >
                <option value="nome">Nome (A-Z)</option>
                <option value="ex50">Maior EX50%</option>
                <option value="ex100">Maior EX100%</option>
                <option value="total">Maior total</option>
              </select>
            </div>

            <div className="hidden md:flex rounded-lg border border-brand-border overflow-hidden shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('tabela')}
                aria-label="Visualizar em tabela"
                className={`p-2.5 transition-colors ${viewMode === 'tabela' ? 'bg-brand-accent/15 text-white' : 'text-brand-muted hover:text-white'}`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                aria-label="Visualizar em cards"
                className={`p-2.5 transition-colors ${viewMode === 'cards' ? 'bg-brand-accent/15 text-white' : 'text-brand-muted hover:text-white'}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {chip('todos', 'Todos')}
          {chip('ex50', 'Com EX50%')}
          {chip('ex100', 'Com EX100%')}
          {chip('sem', 'Sem saldo')}
        </div>
      </div>

      {/* Listagem */}
      {lista.length === 0 ? (
        <div className="sit-panel p-10 text-center">
          <Users className="h-8 w-8 mx-auto text-brand-muted/60 mb-3" />
          <p className="typ-card-title">Nenhum colaborador encontrado</p>
          <p className="typ-card-desc text-brand-muted mt-1">Ajuste a pesquisa ou os filtros de saldo.</p>
        </div>
      ) : (
        <>
          {/* Tabela — desktop */}
          <div className={`${viewMode === 'tabela' ? 'hidden md:block' : 'hidden'} sit-panel overflow-x-auto`}>
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  {[
                    { label: 'Colaborador' },
                    { label: 'Matrícula' },
                    { label: 'Coordenação', className: 'w-[140px] truncate' },
                    { label: 'EX50%' },
                    { label: 'EX100%' },
                    { label: 'Total' },
                    { label: 'Ações' }
                  ].map((h) => (
                    <th key={h.label} className={`typ-subtitle text-brand-muted px-4 py-3 whitespace-nowrap ${h.className || ''}`}>
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lista.map((emp) => {
                  const s = getSaldo(emp.id);
                  return (
                    <tr key={emp.id} className="border-b border-white/5 last:border-0 hover:bg-black/10 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {emp.foto ? (
                            <img
                              src={emp.foto}
                              alt={emp.nome}
                              className="h-9 w-9 rounded-full object-cover ring-1 ring-brand-border/60 shrink-0"
                            />
                          ) : (
                            <div className="h-9 w-9 rounded-full bg-black/20 ring-1 ring-brand-border/60 flex items-center justify-center shrink-0">
                              <User className="h-4 w-4 text-brand-muted" />
                            </div>
                          )}
                          <span className="typ-card-title text-white truncate max-w-[220px]">{emp.nome}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 typ-mono-meta text-brand-muted whitespace-nowrap">{emp.matricula}</td>
                      <td className="px-4 py-3 typ-card-desc text-brand-muted w-[140px] max-w-[140px] truncate">
                        {emp.coordenacao || '—'}
                      </td>
                      <td className={`px-4 py-3 typ-mono-meta ${s.ex50 > 0 ? 'text-emerald-300' : 'text-brand-muted'}`}>
                        {formatMinutosToHoras(s.ex50)}
                      </td>
                      <td className={`px-4 py-3 typ-mono-meta ${s.ex100 > 0 ? 'text-sky-300' : 'text-brand-muted'}`}>
                        {formatMinutosToHoras(s.ex100)}
                      </td>
                      <td className={`px-4 py-3 typ-mono-meta font-bold ${s.total > 0 ? 'text-white' : 'text-brand-muted'}`}>
                        {formatMinutosToHoras(s.total)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => abrirMovimentacao(emp)}
                            title="Movimentar horas"
                            aria-label={`Movimentar horas de ${emp.nome}`}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 typ-badge bg-brand-accent/15 border border-brand-accent/40 text-white hover:bg-brand-accent/25 transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" /> Movimentar
                          </button>
                          <button
                            onClick={() => setDetalhesEmployee(emp)}
                            title="Ver detalhes e histórico"
                            aria-label={`Ver detalhes de ${emp.nome}`}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 typ-badge bg-black/20 border border-brand-border text-brand-muted hover:text-white transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" /> Detalhes
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cards — mobile sempre, desktop quando selecionado */}
          <div className={`${viewMode === 'tabela' ? 'md:hidden' : ''} grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3`}>
            {lista.map((emp) => {
              const s = getSaldo(emp.id);
              return (
                <div key={emp.id} className="sit-panel p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {emp.foto ? (
                      <img
                        src={emp.foto}
                        alt={emp.nome}
                        className="h-[50px] w-[50px] rounded-full object-cover ring-1 ring-brand-border/60 shrink-0"
                      />
                    ) : (
                      <div className="h-[50px] w-[50px] rounded-full bg-black/20 ring-1 ring-brand-border/60 flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-brand-muted" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="typ-card-title text-white truncate">{emp.nome}</p>
                      <p className="typ-card-desc text-brand-muted truncate">
                        {emp.matricula} · {emp.coordenacao || 'Sem coordenação'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="sit-panel-inner p-2.5 text-center">
                      <p className="typ-subtitle text-brand-muted">EX50%</p>
                      <p className={`typ-mono-meta font-bold ${s.ex50 > 0 ? 'text-emerald-300' : 'text-brand-muted'}`}>
                        {formatMinutosToHoras(s.ex50)}
                      </p>
                    </div>
                    <div className="sit-panel-inner p-2.5 text-center">
                      <p className="typ-subtitle text-brand-muted">EX100%</p>
                      <p className={`typ-mono-meta font-bold ${s.ex100 > 0 ? 'text-sky-300' : 'text-brand-muted'}`}>
                        {formatMinutosToHoras(s.ex100)}
                      </p>
                    </div>
                    <div className="sit-panel-inner p-2.5 text-center">
                      <p className="typ-subtitle text-brand-muted">Total</p>
                      <p className={`typ-mono-meta font-bold ${s.total > 0 ? 'text-white' : 'text-brand-muted'}`}>
                        {formatMinutosToHoras(s.total)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => abrirMovimentacao(emp)}
                      className="sit-button-primary flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold"
                    >
                      <Plus className="h-4 w-4" /> Movimentar
                    </button>
                    <button
                      onClick={() => setDetalhesEmployee(emp)}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 typ-card-title bg-brand-panel-light/30 border border-brand-border hover:bg-brand-panel-light transition-colors text-white"
                    >
                      <Eye className="h-4 w-4" /> Detalhes
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modais */}
      <BancoHorasMovimentacaoModal
        isOpen={!!movEmployee}
        onClose={() => setMovEmployee(null)}
        employee={movEmployee}
        saldo={movEmployee ? getSaldo(movEmployee.id) : { ex50: 0, ex100: 0, total: 0 }}
        tipoInicial={tipoInicial}
        onConfirm={handleConfirmMov}
      />

      <BancoHorasDetalhesModal
        isOpen={!!detalhesEmployee}
        onClose={() => setDetalhesEmployee(null)}
        employee={detalhesEmployee}
        saldo={detalhesEmployee ? getSaldo(detalhesEmployee.id) : { ex50: 0, ex100: 0, total: 0 }}
        historico={detalhesEmployee ? getHistorico(detalhesEmployee.id) : []}
        onMovimentar={() => {
          if (detalhesEmployee) {
            const emp = detalhesEmployee;
            setDetalhesEmployee(null);
            abrirMovimentacao(emp);
          }
        }}
      />
    </div>
  );
}
