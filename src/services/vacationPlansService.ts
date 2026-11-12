import { supabase } from '../lib/supabase';
import { VacationPlan } from '../types';

function mapRow(row: any): VacationPlan {
  return {
    id: row.id,
    employeeId: row.employee_id,
    year: row.year,
    month: row.month,
    gozar30Dias: row.gozar_30_dias,
    trabalharPrimeiros10Dias: row.trabalhar_primeiros_10_dias,
    trabalharUltimos10Dias: row.trabalhar_ultimos_10_dias,
    observacao: row.observacao || ''
  };
}

export const vacationPlansService = {
  async getVacationPlans(): Promise<VacationPlan[]> {
    const { data, error } = await supabase
      .from('vacation_plans')
      .select('*')
      .order('year', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapRow);
  },

  /**
   * Substitui o planejamento do ano informado.
   * Ordem segura: (1) lê os IDs atuais, (2) insere os novos, (3) remove os antigos.
   * Se a inserção falhar, o planejamento anterior permanece intacto — antes a
   * exclusão vinha primeiro e uma falha na inserção apagava o ano inteiro.
   */
  async saveVacationPlans(plans: VacationPlan[], selectedYear: number): Promise<VacationPlan[]> {
    const { data: existing, error: selectError } = await supabase
      .from('vacation_plans')
      .select('id')
      .eq('year', selectedYear);

    if (selectError) throw selectError;
    const oldIds = (existing || []).map((r: any) => r.id as string);

    let inserted: any[] = [];
    if (plans.length > 0) {
      const rows = plans.map(p => ({
        employee_id: p.employeeId,
        year: p.year,
        month: p.month,
        gozar_30_dias: p.gozar30Dias,
        trabalhar_primeiros_10_dias: p.trabalharPrimeiros10Dias,
        trabalhar_ultimos_10_dias: p.trabalharUltimos10Dias,
        observacao: p.observacao
      }));

      const { data, error: insertError } = await supabase
        .from('vacation_plans')
        .insert(rows)
        .select();

      if (insertError) throw insertError;
      inserted = data || [];
    }

    if (oldIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('vacation_plans')
        .delete()
        .in('id', oldIds);

      if (deleteError) {
        // Desfaz a inserção para não deixar o ano duplicado.
        if (inserted.length > 0) {
          await supabase.from('vacation_plans').delete().in('id', inserted.map((r) => r.id));
        }
        throw deleteError;
      }
    }

    return inserted.map(mapRow);
  }
};
