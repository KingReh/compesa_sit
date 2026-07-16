import { supabase } from '../lib/supabase';
import { Empresa } from '../types';

export const empresasService = {
  async getEmpresas(): Promise<Empresa[]> {
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .order('razao_social', { ascending: true });

    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      cnpj: row.cnpj,
      razaoSocial: row.razao_social,
      endereco: row.endereco,
      latitude: row.latitude,
      longitude: row.longitude,
      telefones: row.telefones || [],
      emails: row.emails || [],
      sites: row.sites || []
    }));
  },

  async createEmpresa(empresa: Omit<Empresa, 'id'> & { id?: string }): Promise<Empresa> {
    const payload: any = {
      cnpj: empresa.cnpj,
      razao_social: empresa.razaoSocial,
      endereco: empresa.endereco,
      latitude: empresa.latitude,
      longitude: empresa.longitude,
      telefones: empresa.telefones || [],
      emails: empresa.emails || [],
      sites: empresa.sites || []
    };
    if (empresa.id) {
      payload.id = empresa.id;
    }

    const { data, error } = await supabase
      .from('empresas')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      cnpj: data.cnpj,
      razaoSocial: data.razao_social,
      endereco: data.endereco,
      latitude: data.latitude,
      longitude: data.longitude,
      telefones: data.telefones || [],
      emails: data.emails || [],
      sites: data.sites || []
    };
  },

  async updateEmpresa(empresa: Empresa): Promise<Empresa> {
    const { data, error } = await supabase
      .from('empresas')
      .update({
        cnpj: empresa.cnpj,
        razao_social: empresa.razaoSocial,
        endereco: empresa.endereco,
        latitude: empresa.latitude,
        longitude: empresa.longitude,
        telefones: empresa.telefones || [],
        emails: empresa.emails || [],
        sites: empresa.sites || []
      })
      .eq('id', empresa.id)
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      cnpj: data.cnpj,
      razaoSocial: data.razao_social,
      endereco: data.endereco,
      latitude: data.latitude,
      longitude: data.longitude,
      telefones: data.telefones || [],
      emails: data.emails || [],
      sites: data.sites || []
    };
  },

  async deleteEmpresa(id: string): Promise<void> {
    const { error } = await supabase
      .from('empresas')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
