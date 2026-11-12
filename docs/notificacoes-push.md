# Notificações Push — OneSignal + Supabase

Guia de manutenção das notificações push do SIT.

## Visão geral

| Peça | Onde | Função |
|---|---|---|
| App **SIT** na OneSignal | dashboard.onesignal.com · App ID `72382c8b-67fc-4fbe-99e4-47536f941f12` | Guarda as inscrições (dispositivos) e entrega as notificações |
| `src/lib/onesignal.ts` | Frontend | **Único** ponto de acesso ao SDK Web v16 (init, login, logout, ativar/desativar) |
| `src/components/PushNotificationSettings.tsx` | Frontend (dentro do sininho) | Botão Ativar, status, categorias, envio de teste, orientações |
| `public/push/onesignal/OneSignalSDKWorker.js` | Frontend | Service Worker da OneSignal em escopo próprio (`/push/onesignal/`) |
| `public/icons/notification-badge-96.png` | Frontend | Ícone pequeno monocromático (barra de status do Android) |
| `notification_preferences` | Supabase (RLS: cada usuário só acessa a própria linha) | Categorias que cada usuário quer receber |
| Edge Function `send-push` | Supabase | Monta e envia as notificações; guarda a REST API Key |
| Job `sit-push-diario` (pg_cron) | Supabase | Chama `send-push` todo dia às 07:00 de Recife (10:00 UTC) |
| Segredo `push_cron_secret` | Supabase Vault | Autoriza o pg_cron a chamar a função (gerado no banco, nunca exposto) |

### Fluxo

1. O usuário abre o sininho → **Notificações no dispositivo** → **Ativar**.
2. O navegador pede permissão; o SDK inscreve o dispositivo e chama
   `OneSignal.login(<id do usuário no Supabase>)`. Assim, todos os aparelhos
   de um usuário ficam ligados ao mesmo `external_id`.
3. No logout do SIT, `OneSignal.logout()` desvincula o aparelho.
4. Às 07:00 o pg_cron chama `send-push` (`action: daily`), que:
   - envia **Aniversariantes do dia** se houver aniversário (29/02 é lembrado em 28/02 nos anos não bissextos);
   - no dia 1º, envia **Férias do mês** se houver planos de férias no mês;
   - respeita `notification_preferences` (sem linha = recebe tudo);
   - usa `idempotency_key` determinística (data + categoria) — a OneSignal
     descarta reenvios duplicados por 30 dias.

## Segredos e chaves

| Nome | Onde | Público? |
|---|---|---|
| App ID | `src/lib/onesignal.ts` (pode ser sobrescrito por `VITE_ONESIGNAL_APP_ID`) | Sim |
| `ONESIGNAL_APP_ID` | Supabase → Edge Functions → Secrets | Sim |
| `ONESIGNAL_REST_API_KEY` | Supabase → Edge Functions → Secrets | **NÃO — nunca no frontend nem no Git** |
| `SITE_URL` (opcional) | Supabase → Edge Functions → Secrets | Padrão `https://sitcompesa.vercel.app` |
| `push_cron_secret` | Supabase Vault | **NÃO** |

Para trocar a REST API Key: crie uma nova na OneSignal (Settings → Keys & IDs),
atualize o secret no Supabase e apague a antiga na OneSignal.

## Testes rápidos

- **Pelo app:** sininho → expandir (seta) → **Enviar notificação de teste**.
  Envia só para o próprio usuário logado (o destinatário vem do token, nunca do corpo).
- **Simular o envio diário sem enviar** (SQL Editor do Supabase):
  ```sql
  select net.http_post(
    url := 'https://vwqoengkyuepwjgenqoh.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object('Content-Type','application/json',
      'x-cron-secret',(select decrypted_secret from vault.decrypted_secrets where name='push_cron_secret')),
    body := '{"action":"daily","date":"2026-07-01","dryRun":true}'::jsonb);
  -- depois: select status_code, content from net._http_response order by id desc limit 1;
  ```
- **Logs:** Supabase → Edge Functions → `send-push` → Logs.
- **Acompanhar envios:** OneSignal → app SIT → **Delivery → Sent Messages**
  (enviados, entregues, cliques). Inscritos em **Audience → Subscriptions**.
- **Depurar no navegador:** no console, `localStorage.setItem('@sit:push:debug','1')` e recarregue.

## Como adicionar um novo tipo de notificação

1. Adicione uma coluna booleana em `notification_preferences` (migração em `supabase/migrations/`).
2. Em `send-push/index.ts`, crie `buildXxxPush()` e chame em `runDaily()` (ou crie
   uma nova `action` se for disparada por evento), usando `recipientsFor('<coluna>')`
   e uma `idempotencyKey` determinística.
3. Inclua o interruptor em `PushNotificationSettings.tsx`.
4. Republique a função (`supabase functions deploy send-push --no-verify-jwt`).

## Limitações conhecidas

- **iPhone/iPad:** push web só funciona com o SIT instalado na Tela de Início (iOS 16.4+).
- Funciona apenas em `https://sitcompesa.vercel.app` (origem cadastrada na OneSignal);
  em `localhost` e nos links de pré-visualização da Vercel aparece "indisponível".
- Os planos de férias são mensais (sem data exata), por isso o aviso sai no dia 1º.
