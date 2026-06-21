import { supabase } from '../lib/supabase';
import { Unidade } from '../types';

export const unidadesService = {
  async getUnidades(): Promise<Unidade[]> {
    const { data, error } = await supabase
      .from('unidades')
      .select('*')
      .order('nome', { ascending: true });

    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      nome: row.nome,
      latitude: row.latitude,
      longitude: row.longitude
    }));
  },

  async createUnidade(unidade: Omit<Unidade, 'id'> & { id?: string }): Promise<Unidade> {
    const payload: any = {
      nome: unidadesService.normalizeName(unidade.nome),
      latitude: unidade.latitude,
      longitude: unidade.longitude
    };
    if (unidade.id) {
      payload.id = unidade.id;
    }

    const { data, error } = await supabase
      .from('unidades')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      nome: data.nome,
      latitude: data.latitude,
      longitude: data.longitude
    };
  },

  async updateUnidade(unidade: Unidade): Promise<Unidade> {
    const { data, error } = await supabase
      .from('unidades')
      .update({
        nome: unidadesService.normalizeName(unidade.nome),
        latitude: unidade.latitude,
        longitude: unidade.longitude
      })
      .eq('id', unidade.id)
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      nome: data.nome,
      latitude: data.latitude,
      longitude: data.longitude
    };
  },

  async deleteUnidade(id: string): Promise<void> {
    const { error } = await supabase
      .from('unidades')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  normalizeName(name: string): string {
    return name.toUpperCase().trim();
  }
};
