-- Agendamento diário das notificações push (aniversários + férias do mês).
--
-- O pg_cron chama a Edge Function send-push às 07:00 de Recife (10:00 UTC).
-- A chamada é autenticada por um segredo aleatório guardado no Vault: ele é
-- gerado aqui dentro do banco e nunca sai dele. A Edge Function valida o
-- cabeçalho x-cron-secret via verify_push_cron_secret(), que só o
-- service_role pode executar.

select vault.create_secret(
  encode(extensions.gen_random_bytes(32), 'hex'),
  'push_cron_secret',
  'Autoriza o pg_cron a chamar a Edge Function send-push'
)
where not exists (select 1 from vault.secrets where name = 'push_cron_secret');

create or replace function public.verify_push_cron_secret(p_secret text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from vault.decrypted_secrets
    where name = 'push_cron_secret' and decrypted_secret = p_secret
  );
$$;

revoke execute on function public.verify_push_cron_secret(text) from public, anon, authenticated;
grant execute on function public.verify_push_cron_secret(text) to service_role;

select cron.schedule(
  'sit-push-diario',
  '0 10 * * *',
  $job$
  select net.http_post(
    url := 'https://vwqoengkyuepwjgenqoh.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'push_cron_secret')
    ),
    body := '{"action":"daily"}'::jsonb,
    timeout_milliseconds := 15000
  );
  $job$
);
