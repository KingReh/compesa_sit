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

/* ------------------------------------------------------------------ */
/* Banco de Horas                                                      */
/* ------------------------------------------------------------------ */

export type TipoHoraExtra = 'EX50' | 'EX100';

export type OperacaoBancoHoras = 'adicionar' | 'retirar';

export interface MovimentacaoBancoHoras {
  id: string;
  employeeId: string;
  tipo: TipoHoraExtra;
  operacao: OperacaoBancoHoras;
  /** Quantidade movimentada, em minutos. */
  minutos: number;
  /** Saldo (em minutos) do tipo movimentado logo após a operação. */
  saldoApos: number;
  motivo: string;
  /** Data da movimentação no formato YYYY-MM-DD. */
  data: string;
  /** Nome do usuário responsável pela movimentação. */
  responsavel: string;
  /** ID do perfil do usuário responsável pela movimentação (FK profiles.id). */
  responsavelId?: string | null;
  /** Timestamp ISO de criação do registro. */
  criadoEm: string;
}

export interface SaldoBancoHoras {
  /** Saldo EX50% em minutos. */
  ex50: number;
  /** Saldo EX100% em minutos. */
  ex100: number;
  /** Soma dos saldos em minutos. */
  total: number;
}



