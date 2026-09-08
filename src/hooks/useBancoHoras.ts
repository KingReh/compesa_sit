import { useCallback, useEffect, useMemo, useState } from 'react';
import { MovimentacaoBancoHoras, SaldoBancoHoras, TipoHoraExtra } from '../types';
import { hourBankService } from '../services/hourBankService';

const STORAGE_KEY = '@sit:bancoHoras:movimentacoes';

export const SALDO_ZERADO: SaldoBancoHoras = { ex50: 0, ex100: 0, total: 0 };

export interface NovaMovimentacao {
  employeeId: string;
  tipo: TipoHoraExtra;
  operacao: 'adicionar' | 'retirar';
  minutos: number;
  motivo: string;
  data: string;
  responsavel: string;
  responsavelId?: string | null;
}

export function useBancoHoras() {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoBancoHoras[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Migração leve de itens do localStorage (se existirem)
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          try {
            const localItems = JSON.parse(raw);
            if (Array.isArray(localItems) && localItems.length > 0) {
              console.info(`Migrando ${localItems.length} movimentações locais para o Supabase...`);
              await hourBankService.bulkInsertEntries(localItems);
            }
            window.localStorage.removeItem(STORAGE_KEY);
          } catch (migrationErr) {
            console.warn('Aviso: Falha ao migrar dados locais antigos do banco de horas:', migrationErr);
          }
        }
      }

      // 2. Consulta a lista consolidada no Supabase
      const dados = await hourBankService.listEntries();
      setMovimentacoes(dados);
    } catch (err: any) {
      console.error('Erro ao carregar movimentações do Supabase:', err);
      setError(err?.message || 'Falha ao carregar as movimentações do banco de horas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

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
    async (nova: NovaMovimentacao): Promise<MovimentacaoBancoHoras> => {
      // Recalcula o saldo do funcionário para gravar o "saldo após".
      const doFuncionario = movimentacoes.filter((m) => m.employeeId === nova.employeeId);
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

      const saldoApos = nova.tipo === 'EX50' ? ex50 : ex100;

      const criado = await hourBankService.createEntry({
        employeeId: nova.employeeId,
        tipo: nova.tipo,
        operacao: nova.operacao,
        minutos: nova.minutos,
        saldoApos,
        motivo: nova.motivo,
        data: nova.data,
        responsavel: nova.responsavel,
        responsavelId: nova.responsavelId,
      });

      setMovimentacoes((prev) => [criado, ...prev]);
      return criado;
    },
    [movimentacoes]
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

  return {
    movimentacoes,
    loading,
    error,
    getSaldo,
    getHistorico,
    registrarMovimentacao,
    totais,
    reload: carregarDados,
  };
}
