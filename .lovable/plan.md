# Banco de Horas — Nova seção (somente frontend)

Nova página "Banco de Horas" para acompanhar horas extras acumuladas (EX50% e EX100%) por colaborador, com saldos, movimentações e histórico. Sem qualquer alteração no backend/banco nesta etapa.

## Navegação

- Novo item "Banco de Horas" no menu lateral (ícone de relógio), na mesma lista de Painel Executivo / Férias / Relatórios / Configurações.
- Nova view `banco-horas` no controle de views do App, seguindo o padrão atual.

## Página principal

Cabeçalho com título e 3 cards de KPI no padrão visual existente:
- Total EX50% acumulado
- Total EX100% acumulado
- Colaboradores com saldo positivo

Barra de ferramentas:
- Campo de pesquisa por nome/matrícula com botão "X" de limpeza rápida (mesmo padrão do Painel).
- Filtro por tipo de saldo: Todos / Com EX50% / Com EX100% / Sem saldo.
- Ordenação: Nome, Maior EX50%, Maior EX100%, Maior total.
- Alternância tabela / cards (desktop mostra tabela, mobile sempre cards).

Listagem:
- Desktop: tabela com foto+nome, matrícula, lotação, EX50%, EX100%, Total, ações.
- Mobile: cards empilhados com os mesmos dados e botões de ação em largura total.
- Saldos exibidos em formato `HH:MM` com destaque de cor (positivo/zerado).
- Ações por linha: "Movimentar" e "Detalhes".

## Movimentação (modal)

Modal no padrão dos modais existentes (portal + overlay desfocado), com:
- Tipo da hora: EX50% / EX100% (toggle)
- Operação: Adicionar / Retirar (toggle, cores verde/vermelho)
- Quantidade de horas: entrada em `HH:MM` com máscara e validação
- Data da movimentação (padrão: hoje, aceita colar data como nos outros campos)
- Motivo/descrição (obrigatório, textarea)
- Prévia do saldo resultante antes de confirmar
- Bloqueio de retirada maior que o saldo, com mensagem clara
- Ao confirmar, o saldo é atualizado imediatamente na lista e a movimentação entra no histórico.

## Detalhes e histórico (drawer/modal)

- Cabeçalho com foto, nome, matrícula, lotação e os dois saldos.
- Histórico em tabela (desktop) / timeline de cards (mobile) com: data, tipo da hora, operação (badge + / -), quantidade, saldo após a movimentação, motivo e responsável.
- Filtro do histórico por tipo de hora e ordenação por data (mais recente primeiro).
- Estado vazio ilustrado quando não houver movimentações.

## Detalhes técnicos

- Novos arquivos: `src/components/BancoHoras.tsx` (página), `src/components/BancoHorasMovimentacaoModal.tsx`, `src/components/BancoHorasDetalhesModal.tsx`, `src/utils/horas.ts` (parse/format `HH:MM`, soma/subtração em minutos).
- Tipos novos em `src/types.ts`: `TipoHoraExtra = 'EX50' | 'EX100'`, `MovimentacaoBancoHoras` (id, employeeId, tipo, operacao, minutos, saldoApos, motivo, data, responsavel) e `SaldoBancoHoras`.
- Estado gerido por um hook local `useBancoHoras` com dados em memória (seed vazio) + persistência leve em localStorage apenas para não perder o trabalho durante a validação; a camada de leitura/escrita fica isolada em um único módulo para que a troca por serviço Supabase seja um único ponto de alteração no futuro.
- Saldos calculados a partir das movimentações (fonte da verdade), sempre em minutos internamente.
- Campo "responsável" preenchido com o usuário logado do contexto de autenticação atual.
- Reuso dos filtros globais existentes (empresa/coordenação/lotação) para a listagem, além da pesquisa própria da página.
- Nenhum arquivo de backend, migração, serviço Supabase ou tipo gerado será tocado.
