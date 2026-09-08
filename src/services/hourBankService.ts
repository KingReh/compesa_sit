import { supabase } from '../lib/supabase';
import { MovimentacaoBancoHoras, OperacaoBancoHoras, TipoHoraExtra } from '../types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(val?: string | null): val is string {
  return typeof val === 'string' && UUID_REGEX.test(val);
}

function mapRowToEntry(row: any): MovimentacaoBancoHoras {
  return {
    id: row.id,
    employeeId: row.employee_id,
    tipo: row.tipo as TipoHoraExtra,
    operacao: row.operacao as OperacaoBancoHoras,
    minutos: Number(row.minutos),
    saldoApos: Number(row.saldo_apos),
    motivo: row.motivo,
    data: row.data,
    responsavel: row.responsavel_nome || 'Usuário do sistema',
    responsavelId: row.responsavel_id || null,
    criadoEm: row.created_at,
  };
}

export interface CreateHourBankEntryInput {
  employeeId: string;
  tipo: TipoHoraExtra;
  operacao: OperacaoBancoHoras;
  minutos: number;
  saldoApos: number;
  motivo: string;
  data: string;
  responsavel: string;
  responsavelId?: string | null;
}

export const hourBankService = {
  async listEntries(): Promise<MovimentacaoBancoHoras[]> {
    const { data, error } = await supabase
      .from('hour_bank_entries')
      .select('*')
      .order('data', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar movimentações do banco de horas:', error);
      throw error;
    }

    return (data || []).map(mapRowToEntry);
  },

  async createEntry(input: CreateHourBankEntryInput): Promise<MovimentacaoBancoHoras> {
    const payload: any = {
      employee_id: input.employeeId,
      tipo: input.tipo,
      operacao: input.operacao,
      minutos: input.minutos,
      saldo_apos: input.saldoApos,
      motivo: input.motivo,
      data: input.data,
      responsavel_id: isValidUUID(input.responsavelId) ? input.responsavelId : null,
      responsavel_nome: input.responsavel || null,
    };

    const { data, error } = await supabase
      .from('hour_bank_entries')
      .insert([payload])
      .select('*')
      .single();

    if (error) {
      console.error('Erro ao criar movimentação no banco de horas:', error);
      throw error;
    }

    return mapRowToEntry(data);
  },

  async bulkInsertEntries(entries: MovimentacaoBancoHoras[]): Promise<MovimentacaoBancoHoras[]> {
    if (!entries.length) return [];

    const rows = entries.map((entry) => {
      const row: any = {
        employee_id: entry.employeeId,
        tipo: entry.tipo,
        operacao: entry.operacao,
        minutos: entry.minutos,
        saldo_apos: entry.saldoApos,
        motivo: entry.motivo,
        data: entry.data,
        responsavel_id: isValidUUID(entry.responsavelId) ? entry.responsavelId : null,
        responsavel_nome: entry.responsavel || null,
      };
      if (isValidUUID(entry.id)) {
        row.id = entry.id;
      }
      if (entry.criadoEm) {
        row.created_at = entry.criadoEm;
      }
      return row;
    });

    const { data, error } = await supabase
      .from('hour_bank_entries')
      .insert(rows)
      .select('*');

    if (error) {
      console.error('Erro ao migrar movimentações em lote:', error);
      throw error;
    }

    return (data || []).map(mapRowToEntry);
  },

  async deleteEntry(id: string): Promise<void> {
    const { error } = await supabase
      .from('hour_bank_entries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir movimentação do banco de horas:', error);
      throw error;
    }
  },
};
