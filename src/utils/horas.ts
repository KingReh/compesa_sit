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
