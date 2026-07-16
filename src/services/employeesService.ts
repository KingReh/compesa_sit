import { supabase } from '../lib/supabase';
import { Employee } from '../types';
import { maskCPF } from '../utils';

export const employeesService = {
  async getEmployees(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        lotacao:unidades (nome),
        coordenacao:coordenacoes (nome),
        empresa:empresas (razao_social),
        contrato:contratos (numero)
      `)
      .order('nome', { ascending: true });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      foto: row.foto_url || '',
      nome: row.nome,
      matricula: row.matricula,
      cpf: maskCPF(row.cpf || ''),
      especialidade: row.especialidade,
      lotacao: row.lotacao?.nome || '',
      coordenacao: row.coordenacao?.nome || '',
      empresa: row.empresa?.razao_social || '',
      sexo: row.sexo || '',
      telefone: row.telefone || '',
      endereco: row.endereco || '',
      dataNascimento: row.data_nascimento || '',
      dataAdmissao: row.data_admissao || '',
      escalaTrabalho: row.escala_trabalho || '',
      contrato: row.contrato?.numero || '',
      camisa: row.camisa || '',
      calca: row.calca || '',
      spt: row.spt || '',
      autorizadoDirigir: !!row.autorizado_dirigir
    }));
  },

  async resolveIds(employee: Omit<Employee, 'id'>) {
    const [lotacaoRes, coordRes, empresaRes, contratoRes] = await Promise.all([
      employee.lotacao ? supabase.from('unidades').select('id').eq('nome', employee.lotacao.trim()).maybeSingle() : Promise.resolve({ data: null }),
      employee.coordenacao ? supabase.from('coordenacoes').select('id').eq('nome', employee.coordenacao.trim()).maybeSingle() : Promise.resolve({ data: null }),
      employee.empresa ? supabase.from('empresas').select('id').eq('razao_social', employee.empresa.trim()).maybeSingle() : Promise.resolve({ data: null }),
      employee.contrato ? supabase.from('contratos').select('id').eq('numero', employee.contrato.trim()).maybeSingle() : Promise.resolve({ data: null })
    ]);

    return {
      lotacao_id: lotacaoRes.data?.id || null,
      coordenacao_id: coordRes.data?.id || null,
      empresa_id: empresaRes.data?.id || null,
      contrato_id: contratoRes.data?.id || null
    };
  },

  async createEmployee(employee: Omit<Employee, 'id'> & { id?: string }): Promise<Employee> {
    const ids = await employeesService.resolveIds(employee);
    
    const payload: any = {
      nome: employee.nome,
      matricula: employee.matricula,
      cpf: employee.cpf.replace(/[^\d]/g, ''),
      especialidade: employee.especialidade,
      lotacao_id: ids.lotacao_id,
      coordenacao_id: ids.coordenacao_id,
      empresa_id: ids.empresa_id,
      contrato_id: ids.contrato_id,
      sexo: employee.sexo,
      telefone: employee.telefone,
      endereco: employee.endereco,
      data_nascimento: employee.dataNascimento || null,
      data_admissao: employee.dataAdmissao || null,
      escala_trabalho: employee.escalaTrabalho,
      camisa: employee.camisa || null,
      calca: employee.calca || null,
      spt: employee.spt ? String(employee.spt) : null,
      autorizado_dirigir: !!employee.autorizadoDirigir,
      foto_url: employee.foto || null
    };
    if (employee.id) {
      payload.id = employee.id;
    }

    const { data, error } = await supabase
      .from('employees')
      .insert([payload])
      .select(`
        *,
        lotacao:unidades (nome),
        coordenacao:coordenacoes (nome),
        empresa:empresas (razao_social),
        contrato:contratos (numero)
      `)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      foto: data.foto_url || '',
      nome: data.nome,
      matricula: data.matricula,
      cpf: maskCPF(data.cpf || ''),
      especialidade: data.especialidade,
      lotacao: data.lotacao?.nome || '',
      coordenacao: data.coordenacao?.nome || '',
      empresa: data.empresa?.razao_social || '',
      sexo: data.sexo || '',
      telefone: data.telefone || '',
      endereco: data.endereco || '',
      dataNascimento: data.data_nascimento || '',
      dataAdmissao: data.data_admissao || '',
      escalaTrabalho: data.escala_trabalho || '',
      contrato: data.contrato?.numero || '',
      camisa: data.camisa || '',
      calca: data.calca || '',
      spt: data.spt || '',
      autorizadoDirigir: !!data.autorizado_dirigir
    };
  },

  async updateEmployee(employee: Employee): Promise<Employee> {
    const ids = await employeesService.resolveIds(employee);

    const { data, error } = await supabase
      .from('employees')
      .update({
        nome: employee.nome,
        matricula: employee.matricula,
        cpf: employee.cpf.replace(/[^\d]/g, ''),
        especialidade: employee.especialidade,
        lotacao_id: ids.lotacao_id,
        coordenacao_id: ids.coordenacao_id,
        empresa_id: ids.empresa_id,
        contrato_id: ids.contrato_id,
        sexo: employee.sexo,
        telefone: employee.telefone,
        endereco: employee.endereco,
        data_nascimento: employee.dataNascimento || null,
        data_admissao: employee.dataAdmissao || null,
        escala_trabalho: employee.escalaTrabalho,
        camisa: employee.camisa || null,
        calca: employee.calca || null,
        spt: employee.spt ? String(employee.spt) : null,
        autorizado_dirigir: !!employee.autorizadoDirigir,
        foto_url: employee.foto || null
      })
      .eq('id', employee.id)
      .select(`
        *,
        lotacao:unidades (nome),
        coordenacao:coordenacoes (nome),
        empresa:empresas (razao_social),
        contrato:contratos (numero)
      `)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      foto: data.foto_url || '',
      nome: data.nome,
      matricula: data.matricula,
      cpf: maskCPF(data.cpf || ''),
      especialidade: data.especialidade,
      lotacao: data.lotacao?.nome || '',
      coordenacao: data.coordenacao?.nome || '',
      empresa: data.empresa?.razao_social || '',
      sexo: data.sexo || '',
      telefone: data.telefone || '',
      endereco: data.endereco || '',
      dataNascimento: data.data_nascimento || '',
      dataAdmissao: data.data_admissao || '',
      escalaTrabalho: data.escala_trabalho || '',
      contrato: data.contrato?.numero || '',
      camisa: data.camisa || '',
      calca: data.calca || '',
      spt: data.spt || '',
      autorizadoDirigir: !!data.autorizado_dirigir
    };
  },

  async deleteEmployee(id: string): Promise<void> {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
