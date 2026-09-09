/**
 * Utilitários de manipulação de horas (Banco de Horas).
 * Internamente todos os saldos são representados em MINUTOS (inteiro).
 */

/** Converte "HH:MM" (ou "H", "H:MM", "1,5") em minutos. Retorna null se inválido. */
export function parseHorasToMinutos(value: string): number | null {
  if (!value) return null;
  const raw = String(value).trim().replace(',', '.');
  if (!raw) return null;

  const hhmm = raw.match(/^(\d{1,4}):([0-5]\d)$/);
  if (hhmm) {
    return parseInt(hhmm[1], 10) * 60 + parseInt(hhmm[2], 10);
  }

  const decimal = raw.match(/^(\d{1,4})(?:\.(\d{1,2}))?$/);
  if (decimal) {
    const val = parseFloat(raw);
    if (isNaN(val)) return null;
    return Math.round(val * 60);
  }

  return null;
}

/** Formata minutos como "HH:MM" (aceita valores negativos). */
export function formatMinutosToHoras(minutos: number): string {
  const negativo = minutos < 0;
  const abs = Math.abs(Math.round(minutos));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${negativo ? '-' : ''}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Máscara progressiva para input de horas: dígitos → "HH:MM". */
export function maskHoras(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 6);
  if (digits.length <= 2) return digits;
  const m = digits.slice(-2);
  const h = digits.slice(0, -2);
  return `${h}:${m}`;
}

/** Rótulo amigável para o tipo de hora extra. */
export function labelTipoHora(tipo: 'EX50' | 'EX100'): string {
  return tipo === 'EX50' ? 'EX50% Excedente' : 'EX100% Excedente';
}

/* ============================================================
 * Conversão de horas extras em dias de folga
 * ============================================================ */

export const ESCALA_COMERCIAL_SEG_SEX = 'HORÁRIO COMERCIAL (Seg à Sex)';
export const ESCALA_COMERCIAL_SEG_SAB = 'HORÁRIO COMERCIAL (Seg à Sab)';

/** Jornada padrão de um dia útil (minutos). */
export const MINUTOS_DIA_UTIL = 8 * 60;
/** Jornada de sábado na escala Seg à Sáb (minutos). */
export const MINUTOS_SABADO = 4 * 60;

export interface FolgasDisponiveis {
  /** A escala do colaborador permite o cálculo de folgas. */
  elegivel: boolean;
  /** Dias inteiros de folga (8h). */
  dias: number;
  /** Sábado de folga (4h) disponível — somente escala Seg à Sáb. */
  sabado: boolean;
  /** Minutos que sobram após a conversão. */
  restanteMinutos: number;
  /** Texto pronto para exibição. */
  label: string;
}

function normalizarEscala(escala?: string | null): string {
  return (escala || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

const ESCALA_SEG_SEX_NORM = normalizarEscala(ESCALA_COMERCIAL_SEG_SEX);
const ESCALA_SEG_SAB_NORM = normalizarEscala(ESCALA_COMERCIAL_SEG_SAB);

/**
 * Calcula quantos dias de folga o colaborador pode usufruir com base no total
 * de horas extras acumuladas (em minutos) e na escala de trabalho.
 *
 * - Seg à Sex: cada 8h = 1 dia de folga.
 * - Seg à Sáb: cada 8h = 1 dia; sobra de 4h ou mais = 1 sábado de folga (4h).
 * - Demais escalas: não elegível (badge não é exibido).
 */
export function calcularFolgas(minutosTotais: number, escalaTrabalho?: string | null): FolgasDisponiveis {
  const escala = normalizarEscala(escalaTrabalho);
  const isSegSex = escala === ESCALA_SEG_SEX_NORM;
  const isSegSab = escala === ESCALA_SEG_SAB_NORM;

  if (!isSegSex && !isSegSab) {
    return { elegivel: false, dias: 0, sabado: false, restanteMinutos: 0, label: '' };
  }

  const saldo = Math.max(0, Math.round(minutosTotais));
  const dias = Math.floor(saldo / MINUTOS_DIA_UTIL);
  let restante = saldo % MINUTOS_DIA_UTIL;
  const sabado = isSegSab && restante >= MINUTOS_SABADO;
  if (sabado) restante -= MINUTOS_SABADO;

  let label: string;
  if (dias === 0 && !sabado) {
    label = 'Nenhum dia de folga disponível';
  } else if (dias > 0 && sabado) {
    label = `${dias} ${dias === 1 ? 'dia' : 'dias'} + 1 sábado (4h) de folga`;
  } else if (dias > 0) {
    label = `${dias} ${dias === 1 ? 'dia de folga disponível' : 'dias de folga disponíveis'}`;
  } else {
    label = '1 sábado de folga (4h)';
  }

  return { elegivel: true, dias, sabado, restanteMinutos: restante, label };
}
