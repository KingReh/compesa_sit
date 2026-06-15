export const ESCALAS = [
  "5x2",
  "6x1",
  "12x36",
  "12x36 Noturno",
  "24x48",
  "24x72",
  "Administrativo (Seg-Sex)",
  "Sobreaviso",
] as const;

export const STATUS_COLABORADOR = [
  { value: "ativo", label: "Ativo" },
  { value: "ferias", label: "Em férias" },
  { value: "afastado", label: "Afastado" },
  { value: "desligado", label: "Desligado" },
] as const;

export const TIPO_AUSENCIA = [
  { value: "ferias", label: "Férias" },
  { value: "licenca", label: "Licença" },
  { value: "abono", label: "Abono" },
] as const;

export const STATUS_FERIAS = [
  { value: "agendada", label: "Agendada" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluida", label: "Concluída" },
  { value: "cancelada", label: "Cancelada" },
] as const;
