# Banco de Horas — estrutura no banco e adaptação do projeto

Você executará o SQL no seu Supabase. Abaixo está a estrutura sugerida (no mesmo padrão das tabelas existentes: `snake_case`, UUID, FKs para `employees` e `profiles`) e as mudanças no projeto para passar a ler/gravar no banco em vez do armazenamento local do navegador.

## 1. Tabela sugerida

Uma única tabela de movimentações (fonte da verdade). Os saldos são derivados da soma das movimentações — assim o histórico nunca fica inconsistente com o saldo.

```sql
CREATE TABLE public.hour_bank_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  tipo text NOT NULL,              -- 'EX50' | 'EX100'
  operacao text NOT NULL,          -- 'adicionar' | 'retirar'
  minutos integer NOT NULL,        -- sempre positivo
  saldo_apos integer NOT NULL,     -- saldo do tipo logo após a movimentação
  motivo text NOT NULL,
  data date NOT NULL,
  responsavel_id uuid,
  responsavel_nome text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT hour_bank_entries_pkey PRIMARY KEY (id),
  CONSTRAINT hour_bank_entries_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE,
  CONSTRAINT hour_bank_entries_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES public.profiles(id),
  CONSTRAINT hour_bank_entries_tipo_check CHECK (tipo IN ('EX50','EX100')),
  CONSTRAINT hour_bank_entries_operacao_check CHECK (operacao IN ('adicionar','retirar')),
  CONSTRAINT hour_bank_entries_minutos_check CHECK (minutos > 0)
);

CREATE INDEX hour_bank_entries_employee_idx ON public.hour_bank_entries (employee_id, data DESC, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hour_bank_entries TO authenticated;
GRANT ALL ON public.hour_bank_entries TO service_role;

ALTER TABLE public.hour_bank_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leem movimentações"
  ON public.hour_bank_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados criam movimentações"
  ON public.hour_bank_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Autenticados editam movimentações"
  ON public.hour_bank_entries FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Autenticados excluem movimentações"
  ON public.hour_bank_entries FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
```

### Opcional — visão de saldos por funcionário

Útil para telas que só precisam do saldo, sem carregar todo o histórico:

```sql
CREATE VIEW public.hour_bank_balances AS
SELECT
  employee_id,
  COALESCE(SUM(CASE WHEN tipo = 'EX50'  THEN CASE WHEN operacao='adicionar' THEN minutos ELSE -minutos END END), 0) AS ex50,
  COALESCE(SUM(CASE WHEN tipo = 'EX100' THEN CASE WHEN operacao='adicionar' THEN minutos ELSE -minutos END END), 0) AS ex100
FROM public.hour_bank_entries
GROUP BY employee_id;

GRANT SELECT ON public.hour_bank_balances TO authenticated;
```

## 2. Mudanças no projeto

- Novo `src/services/hourBankService.ts`, no mesmo padrão dos serviços atuais (`employeesService`, `vacationPlansService`): `listEntries()`, `createEntry()` e, opcionalmente, `deleteEntry()`, convertendo `snake_case` do banco para os campos já usados na tela (`employeeId`, `saldoApos`, `criadoEm`, etc.).
- `src/hooks/useBancoHoras.ts` deixa de usar o armazenamento local: passa a carregar as movimentações do banco ao abrir a página, expõe `loading` e `error`, e ao registrar uma movimentação grava no banco e atualiza a lista com o registro retornado. As funções de saldo, histórico e totais continuam iguais (cálculo em minutos a partir das movimentações).
- `src/components/BancoHoras.tsx`: estados de carregando e de erro na listagem; o botão de confirmar movimentação fica desabilitado enquanto salva e mostra mensagem em caso de falha. Layout, filtros, ordenação e modais permanecem como estão.
- `src/components/BancoHorasMovimentacaoModal.tsx`: a confirmação passa a ser assíncrona (aguarda a gravação antes de fechar).
- O responsável passa a ser gravado com o identificador e o nome do usuário logado.
- Migração leve: na primeira carga, se houver movimentações antigas salvas no navegador, elas são enviadas ao banco uma única vez e a chave local é limpa. (Digo se prefere descartar em vez de migrar.)

## 3. Fora do escopo

Nenhuma alteração em outras telas, tabelas ou serviços existentes.
