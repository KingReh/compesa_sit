import React from 'react';
import { CalendarCheck } from 'lucide-react';
import { calcularFolgas } from '../utils/horas';

interface Props {
  /** Total de horas extras acumuladas, em minutos. */
  minutos: number;
  escalaTrabalho?: string | null;
  className?: string;
}

/**
 * Badge que informa quantos dias de folga o colaborador pode usufruir
 * com base no saldo de horas extras e na sua escala de trabalho.
 * Não é renderizado para escalas fora do horário comercial.
 */
export function FolgaBadge({ minutos, escalaTrabalho, className = '' }: Props) {
  const folgas = calcularFolgas(minutos, escalaTrabalho);
  if (!folgas.elegivel) return null;

  const temFolga = folgas.dias > 0 || folgas.sabado;

  return (
    <span
      title={folgas.label}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 typ-badge whitespace-nowrap ${
        temFolga
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          : 'bg-black/20 border-brand-border text-brand-muted'
      } ${className}`}
    >
      <CalendarCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {folgas.label}
    </span>
  );
}
