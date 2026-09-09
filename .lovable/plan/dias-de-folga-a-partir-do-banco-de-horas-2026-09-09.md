# Dias de folga a partir do banco de horas

Mostrar, ao lado de cada colaborador, quantos dias de folga ele pode tirar com base no total de horas extras acumuladas (EX50% + EX100%).

## Regra de conversão

- Escala "HORÁRIO COMERCIAL (Seg à Sex)": cada 8 horas = 1 dia de folga. Sobra menor que 8 horas não gera dia.
- Escala "HORÁRIO COMERCIAL (Seg à Sab)": cada 8 horas = 1 dia; se sobrarem 4 horas ou mais, viram 1 sábado de folga de 4 horas.
- Demais escalas (12x36, 24x72, etc.): o badge não é exibido.
- Saldo total zero ou negativo: badge "Nenhum dia de folga disponível".

Exemplos:
- 8h → "1 dia de folga disponível"
- 16h → "2 dias de folga disponíveis"
- 20h (Seg à Sáb) → "2 dias + 1 sábado (4h)"
- 4h (Seg à Sáb) → "1 sábado de folga (4h)"

## Onde aparece

- Banco de Horas: na linha da tabela e no card de cada colaborador.
- Banco de Horas: no modal de detalhes/histórico, junto aos saldos.
- Perfil de Colaborador: junto às informações de escala.

O badge recalcula sozinho sempre que o saldo muda, pois deriva do saldo atual.

## Detalhes técnicos

- Nova função em `src/utils/horas.ts`: `calcularFolgas(minutosTotais, escalaTrabalho)` retornando `{ elegivel, dias, sabado, label }`, com as constantes das duas escalas comerciais.
- Novo componente `src/components/FolgaBadge.tsx` (visual alinhado aos badges existentes: `typ-badge`, borda `brand-border`, destaque em âmbar/emerald quando há dias).
- `src/components/BancoHoras.tsx`: renderizar o badge na coluna do colaborador (tabela) e no bloco de identificação (cards), usando `getSaldo(emp.id).total` e `emp.escalaTrabalho`.
- `src/components/BancoHorasDetalhesModal.tsx`: exibir o badge junto ao resumo de saldos (precisa receber `escalaTrabalho` do employee já disponível na prop).
- `src/components/ViewModal.tsx`: exibir o badge próximo ao campo "Escala de Trabalho". Como esse modal não tem acesso ao saldo hoje, o saldo será passado por prop opcional a partir de quem abre o modal; se ausente, o badge não é renderizado.

Nenhuma mudança no banco de dados ou nas regras de movimentação.
