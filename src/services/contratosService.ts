import { supabase } from '../lib/supabase';
import { Contrato } from '../types';

const getEmpresaName = (empresas: any): string => {
  if (Array.isArray(empresas)) {
    return empresas[0]?.razao_social || '';
  }
  return empresas?.razao_social || '';
};

export const contratosService = {
  async getContratos(): Promise<Contrato[]> {
    const { data, error } = await supabase
      .from('contratos')
      .select('id, numero, descricao, empresa_id, empresas (razao_social)')
      .order('numero', { ascending: true });

    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      numero: row.numero,
      empresa: getEmpresaName(row.empresas),
      descricao: row.descricao
    }));
  },

  async resolveEmpresaId(razaoSocial: string): Promise<string | null> {
    if (!razaoSocial) return null;
    const { data } = await supabase
      .from('empresas')
      .select('id')
      .ilike('razao_social', razaoSocial.trim())
      .maybeSingle();
    return data?.id || null;
  },

  async createContrato(contrato: Omit<Contrato, 'id'> & { id?: string }): Promise<Contrato> {
    const empresaId = await contratosService.resolveEmpresaId(contrato.empresa);
    
    const payload: any = {
      numero: contrato.numero,
      descricao: contrato.descricao,
      empresa_id: empresaId
    };
    if (contrato.id) {
      payload.id = contrato.id;
    }

    const { data, error } = await supabase
      .from('contratos')
      .insert([payload])
      .select('id, numero, descricao, empresa_id, empresas (razao_social)')
      .single();

    if (error) throw error;
    return {
      id: data.id,
      numero: data.numero,
      empresa: getEmpresaName(data.empresas),
      descricao: data.descricao
    };
  },

  async updateContrato(contrato: Contrato): Promise<Contrato> {
    const empresaId = await contratosService.resolveEmpresaId(contrato.empresa);

    const { data, error } = await supabase
      .from('contratos')
      .update({
        numero: contrato.numero,
        descricao: contrato.descricao,
        empresa_id: empresaId
      })
      .eq('id', contrato.id)
      .select('id, numero, descricao, empresa_id, empresas (razao_social)')
      .single();

    if (error) throw error;
    return {
      id: data.id,
      numero: data.numero,
      empresa: getEmpresaName(data.empresas),
      descricao: data.descricao
    };
  },

  async deleteContrato(id: string): Promise<void> {
    const { error } = await supabase
      .from('contratos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};