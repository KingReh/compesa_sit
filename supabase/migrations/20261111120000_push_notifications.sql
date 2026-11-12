-- Notificações push (OneSignal) — preferências por usuário + agendamento diário.
--
-- A OneSignal guarda as inscrições (dispositivos). Aqui fica apenas o que é
-- regra de negócio do SIT: quais categorias cada usuário quer receber.
-- Sem linha na tabela = recebe todas as categorias (padrão opt-in, pois o
-- usuário já precisou ativar o push manualmente no navegador).

create table if not exists public.notification_preferences (
  user_id      uuid primary key references public.profiles(id) on delete cascade,
  aniversarios boolean not null default true,
  ferias       boolean not null default true,
  updated_at   timestamptz not null default now()
);

comment on table public.notification_preferences is
  'Categorias de notificação push que cada usuário deseja receber. Lida pela Edge Function send-push com service_role.';

alter table public.notification_preferences enable row level security;

-- Cada usuário só enxerga e altera a própria linha.
create policy "Usuario le as proprias preferencias"
  on public.notification_preferences for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Usuario cria as proprias preferencias"
  on public.notification_preferences for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Usuario altera as proprias preferencias"
  on public.notification_preferences for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update on public.notification_preferences to authenticated;
revoke all on public.notification_preferences from anon;

-- Agendamento: pg_cron dispara 1x por dia; pg_net faz a chamada HTTP à Edge Function.
create extension if not exists pg_cron;
create extension if not exists pg_net;
