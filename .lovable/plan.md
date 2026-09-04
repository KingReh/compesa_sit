# Ajuste na página Banco de Horas

Trocar a coluna "Lotação" por "Coordenação" na página de Banco de Horas e reduzir sua largura para evitar scroll horizontal na tabela.

## Alterações

1. **Cabeçalho da tabela**: alterar rótulo de "Lotação" para "Coordenação".
2. **Células da tabela**: exibir `emp.coordenacao` em vez de `emp.lotacao`.
3. **Cards mobile**: atualizar subtítulo de matrícula/lotação para mostrar coordenação.
4. **Largura da coluna**: aplicar largura fixa/máxima menor (`max-w-[140px]` ou similar) e truncar texto para evitar que a tabela ultrapasse a largura do painel hero.
5. **Validação visual**: confirmar que a tabela não apresenta scroll horizontal em desktop.

## Escopo

- Somente frontend (`src/components/BancoHoras.tsx`).
- Nenhuma alteração em backend, tipos, hooks, modais ou serviços.
