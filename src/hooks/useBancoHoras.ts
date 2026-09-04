import { useCallback, useEffect, useMemo, useState } from 'react';
import { MovimentacaoBancoHoras, SaldoBancoHoras, TipoHoraExtra } from '../types';

/**
 * Camada única de leitura/escrita das movimentações do Banco de Horas.
 *
 * ⚠️ ETAPA ATUAL: somente frontend. Os dados vivem em memória e são espelhados
 * em localStorage apenas para não perder o trabalho durante a validação da UI.
 * Quando o backend for autorizado, basta substituir as três funções abaixo
 * (loadAll / persistAll / createId) por chamadas ao serviço correspondente —
 * nenhum componente precisará ser alterado.
 */

const STORAGE_KEY = '@sit:bancoHoras:movimentacoes';

function loadAll(): MovimentacaoBancoHoras[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MovimentacaoBancoHoras[]) : [];
  } catch {
    return [];
  }
}

function persistAll(movimentacoes: MovimentacaoBancoHoras[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(movimentacoes));
  } catch {
    /* noop */
  }
}

function createId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `mov_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}

export const SALDO_ZERADO: SaldoBancoHoras = { ex50: 0, ex100: 0, total: 0 };

export interface NovaMovimentacao {
  employeeId: string;
  tipo: TipoHoraExtra;
  operacao: 'adicionar' | 'retirar';
  minutos: number;
  motivo: string;
  data: string;
  responsavel: string;
}

export function useBancoHoras() {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoBancoHoras[]>(() => loadAll());

  useEffect(() => {
    persistAll(movimentacoes);
  }, [movimentacoes]);

  /** Saldos por funcionário, derivados das movimentações (fonte da verdade). */
  const saldos = useMemo(() => {
    const map = new Map<string, SaldoBancoHoras>();
    const ordenadas = [...movimentacoes].sort(
      (a, b) => new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime()
    );
    for (const mov of ordenadas) {
      const atual = map.get(mov.employeeId) || { ex50: 0, ex100: 0, total: 0 };
      const delta = mov.operacao === 'adicionar' ? mov.minutos : -mov.minutos;
      const next: SaldoBancoHoras = {
        ex50: atual.ex50 + (mov.tipo === 'EX50' ? delta : 0),
        ex100: atual.ex100 + (mov.tipo === 'EX100' ? delta : 0),
        total: 0,
      };
      next.total = next.ex50 + next.ex100;
      map.set(mov.employeeId, next);
    }
    return map;
  }, [movimentacoes]);

  const getSaldo = useCallback(
    (employeeId: string): SaldoBancoHoras => saldos.get(employeeId) || SALDO_ZERADO,
    [saldos]
  );

  const getHistorico = useCallback(
    (employeeId: string): MovimentacaoBancoHoras[] =>
      movimentacoes
        .filter((m) => m.employeeId === employeeId)
        .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()),
    [movimentacoes]
  );

  const registrarMovimentacao = useCallback(
    (nova: NovaMovimentacao) => {
      setMovimentacoes((prev) => {
        // Recalcula o saldo do funcionário para gravar o "saldo após".
        const doFuncionario = prev.filter((m) => m.employeeId === nova.employeeId);
        let ex50 = 0;
        let ex100 = 0;
        for (const m of doFuncionario) {
          const d = m.operacao === 'adicionar' ? m.minutos : -m.minutos;
          if (m.tipo === 'EX50') ex50 += d;
          else ex100 += d;
        }
        const delta = nova.operacao === 'adicionar' ? nova.minutos : -nova.minutos;
        if (nova.tipo === 'EX50') ex50 += delta;
        else ex100 += delta;

        const registro: MovimentacaoBancoHoras = {
          id: createId(),
          employeeId: nova.employeeId,
          tipo: nova.tipo,
          operacao: nova.operacao,
          minutos: nova.minutos,
          saldoApos: nova.tipo === 'EX50' ? ex50 : ex100,
          motivo: nova.motivo,
          data: nova.data,
          responsavel: nova.responsavel,
          criadoEm: new Date().toISOString(),
        };
        return [...prev, registro];
      });
    },
    []
  );

  const totais = useMemo(() => {
    let ex50 = 0;
    let ex100 = 0;
    let comSaldo = 0;
    saldos.forEach((s) => {
      ex50 += s.ex50;
      ex100 += s.ex100;
      if (s.total > 0) comSaldo += 1;
    });
    return { ex50, ex100, comSaldo };
  }, [saldos]);

  return { movimentacoes, getSaldo, getHistorico, registrarMovimentacao, totais };
}
