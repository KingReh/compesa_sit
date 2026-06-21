import { supabase } from '../lib/supabase';
import { VacationPlan } from '../types';

export const vacationPlansService = {
  async getVacationPlans(): Promise<VacationPlan[]> {
    const { data, error } = await supabase
      .from('vacation_plans')
      .select('*')
      .order('year', { ascending: true });

    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      employeeId: row.employee_id,
      year: row.year,
      month: row.month,
      gozar30Dias: row.gozar_30_dias,
      trabalharPrimeiros10Dias: row.trabalhar_primeiros_10_dias,
      trabalharUltimos10Dias: row.trabalhar_ultimos_10_dias,
      observacao: row.observacao || ''
    }));
  },

  async saveVacationPlans(plans: VacationPlan[], selectedYear: number): Promise<VacationPlan[]> {
    // 1. Delete all existing plans in Supabase for this year
    const { error: deleteError } = await supabase
      .from('vacation_plans')
      .delete()
      .eq('year', selectedYear);

    if (deleteError) throw deleteError;

    // 2. Insert new ones if any exist
    if (plans.length === 0) return [];

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

    return (data || []).map((row: any) => ({
      id: row.id,
      employeeId: row.employee_id,
      year: row.year,
      month: row.month,
      gozar30Dias: row.gozar_30_dias,
      trabalharPrimeiros10Dias: row.trabalhar_primeiros_10_dias,
      trabalharUltimos10Dias: row.trabalhar_ultimos_10_dias,
      observacao: row.observacao || ''
    }));
  }
};
