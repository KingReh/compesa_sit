import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Minus, User, History } from 'lucide-react';
import { Employee, MovimentacaoBancoHoras, SaldoBancoHoras, TipoHoraExtra } from '../types';
import { formatMinutosToHoras, labelTipoHora } from '../utils/horas';
import { formatLocalDateBR } from '../utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  saldo: SaldoBancoHoras;
  historico: MovimentacaoBancoHoras[];
  onMovimentar: () => void;
}

export function BancoHorasDetalhesModal({
  isOpen,
  onClose,
  employee,
  saldo,
  historico,
  onMovimentar,
}: Props) {
  const [filtroTipo, setFiltroTipo] = useState<'todos' | TipoHoraExtra>('todos');

  useEffect(() => {
    if (isOpen) setFiltroTipo('todos');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const lista = useMemo(
    () => (filtroTipo === 'todos' ? historico : historico.filter((m) => m.tipo === filtroTipo)),
    [historico, filtroTipo]
  );

  if (!isOpen || !employee) return null;

  const chip = (value: 'todos' | TipoHoraExtra, label: string) => (
    <button
      key={value}
      type="button"
      onClick={() => setFiltroTipo(value)}
      className={`rounded-full px-3 py-1.5 typ-badge border transition-colors ${
        filtroTipo === value
          ? 'bg-brand-accent/15 border-brand-accent text-white'
          : 'bg-black/10 border-brand-border text-brand-muted hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center overflow-y-auto bg-black/60 backdrop-blur-sm sm:p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Detalhes do banco de horas"
    >
      <div className="sit-panel relative w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto rounded-b-none sm:rounded-2xl">
        {/* Cabeçalho */}
        <div className="sticky top-0 z-10 p-4 sm:p-5 border-b border-white/5 bg-brand-panel/95 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {employee.foto ? (
                <img
                  src={employee.foto}
                  alt={employee.nome}
                  className="h-12 w-12 rounded-full object-cover ring-1 ring-brand-border/60 shrink-0"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-black/20 ring-1 ring-brand-border/60 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-brand-muted" />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="typ-section-title truncate">{employee.nome}</h3>
                <p className="typ-card-desc text-brand-muted truncate">
                  {employee.matricula} · {employee.lotacao || 'Sem lotação'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="rounded-full p-1.5 text-brand-muted hover:bg-brand-panel-light hover:text-white transition-colors shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
            <div className="sit-panel-inner p-3">
              <p className="typ-subtitle text-brand-muted">EX50%</p>
              <p className="typ-stat !text-xl font-mono text-emerald-300">{formatMinutosToHoras(saldo.ex50)}</p>
            </div>
            <div className="sit-panel-inner p-3">
              <p className="typ-subtitle text-brand-muted">EX100%</p>
              <p className="typ-stat !text-xl font-mono text-sky-300">{formatMinutosToHoras(saldo.ex100)}</p>
            </div>
            <div className="sit-panel-inner p-3 col-span-2 sm:col-span-1">
              <p className="typ-subtitle text-brand-muted">Total</p>
              <p className="typ-stat !text-xl font-mono text-white">{formatMinutosToHoras(saldo.total)}</p>
            </div>
          </div>

          <button
            onClick={onMovimentar}
            className="sit-button-primary w-full sm:w-auto mt-3 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold"
          >
            <Plus className="h-4 w-4" /> Nova movimentação
          </button>
        </div>

        {/* Histórico */}
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-brand-accent" />
              <h4 className="typ-card-title">Histórico de movimentações</h4>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {chip('todos', 'Todas')}
              {chip('EX50', 'EX50%')}
              {chip('EX100', 'EX100%')}
            </div>
          </div>

          {lista.length === 0 ? (
            <div className="sit-panel-inner p-8 text-center">
              <History className="h-8 w-8 mx-auto text-brand-muted/60 mb-3" />
              <p className="typ-card-title">Nenhuma movimentação registrada</p>
              <p className="typ-card-desc text-brand-muted mt-1">
                As horas adicionadas ou retiradas aparecerão aqui em ordem cronológica.
              </p>
            </div>
          ) : (
            <>
              {/* Tabela (desktop) */}
              <div className="hidden md:block overflow-x-auto sit-panel-inner">
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5">
                      {['Data', 'Tipo', 'Movimentação', 'Qtd.', 'Saldo após', 'Motivo', 'Responsável'].map((h) => (
                        <th key={h} className="typ-subtitle text-brand-muted px-3 py-2.5 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lista.map((m) => (
                      <tr key={m.id} className="border-b border-white/5 last:border-0 hover:bg-black/10">
                        <td className="px-3 py-2.5 typ-mono-meta text-white whitespace-nowrap">
                          {formatLocalDateBR(m.data)}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="typ-badge rounded-full px-2 py-0.5 bg-black/20 border border-brand-border text-brand-muted">
                            {m.tipo === 'EX50' ? 'EX50%' : 'EX100%'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`typ-badge inline-flex items-center gap-1 rounded-full px-2 py-0.5 border ${
                              m.operacao === 'adicionar'
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                                : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                            }`}
                          >
                            {m.operacao === 'adicionar' ? <Plus className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                            {m.operacao === 'adicionar' ? 'Adição' : 'Retirada'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 typ-mono-meta text-white">{formatMinutosToHoras(m.minutos)}</td>
                        <td className="px-3 py-2.5 typ-mono-meta text-brand-accent">
                          {formatMinutosToHoras(m.saldoApos)}
                        </td>
                        <td className="px-3 py-2.5 typ-card-desc text-brand-muted max-w-[220px]">{m.motivo}</td>
                        <td className="px-3 py-2.5 typ-card-desc text-brand-muted whitespace-nowrap">
                          {m.responsavel || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Timeline (mobile) */}
              <div className="md:hidden flex flex-col gap-2">
                {lista.map((m) => (
                  <div key={m.id} className="sit-panel-inner p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`typ-badge inline-flex items-center gap-1 rounded-full px-2 py-0.5 border ${
                          m.operacao === 'adicionar'
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                            : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                        }`}
                      >
                        {m.operacao === 'adicionar' ? <Plus className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                        {formatMinutosToHoras(m.minutos)}
                      </span>
                      <span className="typ-mono-meta text-brand-muted">{formatLocalDateBR(m.data)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <span className="typ-card-desc text-brand-muted">{labelTipoHora(m.tipo)}</span>
                      <span className="typ-mono-meta text-brand-accent">
                        Saldo: {formatMinutosToHoras(m.saldoApos)}
                      </span>
                    </div>
                    <p className="typ-card-desc text-white mt-2">{m.motivo}</p>
                    <p className="typ-card-desc text-brand-muted mt-1">Por: {m.responsavel || '—'}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
