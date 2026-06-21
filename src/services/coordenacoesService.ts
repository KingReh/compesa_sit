import { supabase } from '../lib/supabase';
import { Coordenacao } from '../types';

export const coordenacoesService = {
  async getCoordenacoes(): Promise<Coordenacao[]> {
    const { data, error } = await supabase
      .from('coordenacoes')
      .select('*')
      .order('nome', { ascending: true });

    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      nome: row.nome,
      coordenador: row.coordenador || ''
    }));
  },

  async createCoordenacao(coordenacao: Omit<Coordenacao, 'id'> & { id?: string }): Promise<Coordenacao> {
    const payload: any = {
      nome: coordenacao.nome,
      coordenador: coordenacao.coordenador || ''
    };
    if (coordenacao.id) {
      payload.id = coordenacao.id;
    }

    const { data, error } = await supabase
      .from('coordenacoes')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      nome: data.nome,
      coordenador: data.coordenador || ''
    };
  },

  async updateCoordenacao(coordenacao: Coordenacao): Promise<Coordenacao> {
    const { data, error } = await supabase
      .from('coordenacoes')
      .update({
        nome: coordenacao.nome,
        coordenador: coordenacao.coordenador || ''
      })
      .eq('id', coordenacao.id)
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      nome: data.nome,
      coordenador: data.coordenador || ''
    };
  },

  async deleteCoordenacao(id: string): Promise<void> {
    const { error } = await supabase
      .from('coordenacoes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
