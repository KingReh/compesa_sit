import { supabase } from '../lib/supabase';

export interface PointAdjustmentPayload {
  employeeId: string;
  dates: string[];
  paraEmails: string[];
  ccEmails: string[];
  subject: string;
  body: string;
  solicitadoPor: string;
}

export const pointAdjustmentsService = {
  async savePointAdjustment(adjustment: PointAdjustmentPayload): Promise<any> {
    const { data, error } = await supabase
      .from('point_adjustments')
      .insert([{
        employee_id: adjustment.employeeId,
        datas: adjustment.dates,
        para_emails: adjustment.paraEmails,
        cc_emails: adjustment.ccEmails,
        assunto: adjustment.subject,
        corpo: adjustment.body,
        solicitado_por: adjustment.solicitadoPor
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
