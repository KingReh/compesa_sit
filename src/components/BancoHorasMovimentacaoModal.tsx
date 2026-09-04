import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Minus, Clock, AlertTriangle } from 'lucide-react';
import { Employee, SaldoBancoHoras, TipoHoraExtra } from '../types';
import { formatMinutosToHoras, labelTipoHora, maskHoras, parseHorasToMinutos } from '../utils/horas';
import { parseLocalDate } from '../utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  saldo: SaldoBancoHoras;
  tipoInicial?: TipoHoraExtra;
  onConfirm: (payload: {
    tipo: TipoHoraExtra;
    operacao: 'adicionar' | 'retirar';
    minutos: number;
    motivo: string;
    data: string;
  }) => void;
}

function hojeISO() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function BancoHorasMovimentacaoModal({
  isOpen,
  onClose,
  employee,
  saldo,
  tipoInicial = 'EX50',
  onConfirm,
}: Props) {
  const [tipo, setTipo] = useState<TipoHoraExtra>(tipoInicial);
  const [operacao, setOperacao] = useState<'adicionar' | 'retirar'>('adicionar');
  const [quantidade, setQuantidade] = useState('');
  const [data, setData] = useState(hojeISO());
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTipo(tipoInicial);
      setOperacao('adicionar');
      setQuantidade('');
      setData(hojeISO());
      setMotivo('');
      setErro(null);
    }
  }, [isOpen, tipoInicial]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const minutos = useMemo(() => parseHorasToMinutos(quantidade) ?? 0, [quantidade]);
  const saldoAtual = tipo === 'EX50' ? saldo.ex50 : saldo.ex100;
  const saldoPrevisto = operacao === 'adicionar' ? saldoAtual + minutos : saldoAtual - minutos;
  const excedeSaldo = operacao === 'retirar' && minutos > saldoAtual;

  if (!isOpen || !employee) return null;

  const handleDatePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    const parsed = parseLocalDate(text);
    if (parsed) {
      e.preventDefault();
      const pad = (n: number) => String(n).padStart(2, '0');
      setData(`${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (minutos <= 0) {
      setErro('Informe uma quantidade de horas válida (formato HH:MM).');
      return;
    }
    if (!motivo.trim()) {
      setErro('Descreva o motivo da movimentação.');
      return;
    }
    if (excedeSaldo) {
      setErro(
        `Saldo insuficiente: o colaborador possui ${formatMinutosToHoras(saldoAtual)} de ${labelTipoHora(tipo)}.`
      );
      return;
    }
    onConfirm({ tipo, operacao, minutos, motivo: motivo.trim(), data });
    onClose();
  };

  const toggleBase =
    'flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 typ-card-title transition-all border';

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center overflow-y-auto bg-black/60 backdrop-blur-sm sm:p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Movimentar banco de horas"
    >
      <div className="sit-panel relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-b-none sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-white/5 bg-brand-panel/95 backdrop-blur">
          <div className="min-w-0">
            <p className="typ-subtitle text-brand-muted">Banco de Horas</p>
            <h3 className="typ-section-title truncate">{employee.nome}</h3>
            <p className="typ-card-desc text-brand-muted truncate">
              Matrícula {employee.matricula}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-full p-1.5 text-brand-muted hover:bg-brand-panel-light hover:text-white transition-colors shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 flex flex-col gap-4">
          <div>
            <label className="typ-form-label mb-1.5 block">Tipo da hora</label>
            <div className="flex gap-2">
              {(['EX50', 'EX100'] as TipoHoraExtra[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  className={`${toggleBase} ${
                    tipo === t
                      ? 'bg-brand-accent/15 border-brand-accent text-white'
                      : 'bg-black/10 border-brand-border text-brand-muted hover:text-white'
                  }`}
                >
                  <Clock className="h-4 w-4" />
                  {t === 'EX50' ? 'EX50%' : 'EX100%'}
                </button>
              ))}
            </div>
            <p className="typ-card-desc text-brand-muted mt-1.5">
              Saldo atual: <span className="text-white font-semibold">{formatMinutosToHoras(saldoAtual)}</span>
            </p>
          </div>

          <div>
            <label className="typ-form-label mb-1.5 block">Movimentação</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOperacao('adicionar')}
                className={`${toggleBase} ${
                  operacao === 'adicionar'
                    ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300'
                    : 'bg-black/10 border-brand-border text-brand-muted hover:text-white'
                }`}
              >
                <Plus className="h-4 w-4" /> Adicionar
              </button>
              <button
                type="button"
                onClick={() => setOperacao('retirar')}
                className={`${toggleBase} ${
                  operacao === 'retirar'
                    ? 'bg-rose-500/15 border-rose-500/60 text-rose-300'
                    : 'bg-black/10 border-brand-border text-brand-muted hover:text-white'
                }`}
              >
                <Minus className="h-4 w-4" /> Retirar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="typ-form-label mb-1.5 block" htmlFor="bh-qtd">
                Quantidade (HH:MM)
              </label>
              <input
                id="bh-qtd"
                inputMode="numeric"
                placeholder="00:00"
                value={quantidade}
                onChange={(e) => {
                  setQuantidade(maskHoras(e.target.value));
                  setErro(null);
                }}
                className="sit-input block w-full rounded-lg px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="typ-form-label mb-1.5 block" htmlFor="bh-data">
                Data da movimentação
              </label>
              <input
                id="bh-data"
                type="date"
                value={data}
                onPaste={handleDatePaste}
                onChange={(e) => setData(e.target.value)}
                className="sit-input block w-full rounded-lg px-3 py-2.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="typ-form-label mb-1.5 block" htmlFor="bh-motivo">
              Motivo / descrição
            </label>
            <textarea
              id="bh-motivo"
              rows={3}
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value);
                setErro(null);
              }}
              placeholder="Ex.: Plantão extra no dia 12/09, cobertura de escala..."
              className="sit-input block w-full rounded-lg px-3 py-2.5 text-sm resize-y"
            />
          </div>

          {/* Prévia do saldo */}
          <div className="sit-panel-inner p-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="typ-subtitle text-brand-muted">Saldo após a movimentação</p>
              <p className="typ-card-desc text-brand-muted truncate">{labelTipoHora(tipo)}</p>
            </div>
            <span
              className={`typ-stat !text-2xl font-mono ${
                excedeSaldo ? 'text-rose-400' : saldoPrevisto > 0 ? 'text-emerald-300' : 'text-white'
              }`}
            >
              {formatMinutosToHoras(saldoPrevisto)}
            </span>
          </div>

          {(erro || excedeSaldo) && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="typ-card-desc text-rose-300">
                {erro ||
                  `Saldo insuficiente: o colaborador possui ${formatMinutosToHoras(saldoAtual)} de ${labelTipoHora(tipo)}.`}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg px-4 py-2.5 typ-card-title bg-brand-panel-light/30 border border-brand-border hover:bg-brand-panel-light transition-colors text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={excedeSaldo}
              className="sit-button-primary flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirmar movimentação
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
