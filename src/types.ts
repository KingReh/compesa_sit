export interface Employee {
  id: string;
  foto: string;
  nome: string;
  matricula: string;
  cpf: string;
  especialidade: string;
  lotacao: string;
  coordenacao: string;
  empresa: string;
  sexo: string;
  telefone: string;
  endereco: string;
  dataNascimento: string;
  dataAdmissao: string;
  escalaTrabalho: string;
  contrato: string;
  camisa?: string;
  calca?: string;
  spt?: number | string;
  autorizadoDirigir?: boolean;
}

export interface Empresa {
  id: string;
  cnpj: string;
  razaoSocial: string;
  endereco: string;
  latitude: string;
  longitude: string;
  telefones?: { nome: string; numero: string }[];
  emails?: { nome: string; email: string }[];
  sites?: { nome: string; url: string }[];
}

export interface Coordenacao {
  id: string;
  nome: string;
  coordenador?: string;
}

export interface Unidade {
  id: string;
  nome: string;
  latitude: string;
  longitude: string;
}

export interface Contrato {
  id: string;
  numero: string;
  empresa: string;
  descricao: string;
}

export interface VacationPlan {
  id?: string; // Optional id
  employeeId: string;
  year: number;
  month: string; // "Janeiro", "Fevereiro", ... or ""
  gozar30Dias: boolean;
  trabalharPrimeiros10Dias: boolean;
  trabalharUltimos10Dias: boolean;
  observacao: string;
}

export type UserProfile = 'Admin' | 'Gestor de Contrato' | 'Coordenador de Área' | 'Auditor de Conformidade';

export interface User {
  id: string;
  nome: string;
  matricula: string;
  email: string;
  perfil: UserProfile;
  passwordHash: string;
  needsPasswordReset?: boolean;
}

export interface AuthSession {
  userId: string;
  nome: string;
  matricula: string;
  email: string;
  perfil: UserProfile;
  expiresAt: number; // timestamp in ms
}


