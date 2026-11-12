// Edge Function: send-push
// ---------------------------------------------------------------------------
// Única porta de saída das notificações push do SIT (OneSignal).
//
// Ações aceitas (POST JSON):
//   { "action": "daily" }  → chamada pelo pg_cron 1x/dia (cabeçalho x-cron-secret).
//                            Envia "Aniversariantes do dia" (todo dia, se houver)
//                            e "Férias do mês" (somente no dia 1º, se houver).
//                            Aceita "date": "AAAA-MM-DD" e "dryRun": true para testes.
//   { "action": "test" }   → chamada pelo app com o JWT do usuário logado.
//                            Envia uma notificação de teste SÓ para o próprio usuário.
//
// Segredos (Supabase → Edge Functions → Secrets):
//   ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY  (a REST key nunca vai para o frontend)
//   SITE_URL (opcional, padrão https://sitcompesa.vercel.app)
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são injetados automaticamente.
// ---------------------------------------------------------------------------
import { createClient } from 'npm:@supabase/supabase-js@2.49.4';

const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID') ?? '';
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY') ?? '';
const SITE_URL = (Deno.env.get('SITE_URL') ?? 'https://sitcompesa.vercel.app').replace(/\/+$/, '');
const TIMEZONE = 'America/Recife';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

type Category = 'aniversarios' | 'ferias';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

// ---------- utilitários ----------------------------------------------------

/** Data de hoje no fuso de Recife, como { y, m (1-12), d }. */
function todayInRecife(): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get('year'), m: get('month'), d: get('day') };
}

function parseIsoDate(value: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? '');
  if (!match) return null;
  return { y: +match[1], m: +match[2], d: +match[3] };
}

const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/** "JOÃO DA SILVA SANTOS" → "João Santos" (primeiro + último nome). */
function shortName(full: string): string {
  const parts = (full ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const cap = (s: string) => s.charAt(0).toLocaleUpperCase('pt-BR') + s.slice(1).toLocaleLowerCase('pt-BR');
  return parts.length === 1 ? cap(parts[0]) : `${cap(parts[0])} ${cap(parts[parts.length - 1])}`;
}

/** "A", "A e B", "A, B e C", "A, B, C e mais 2". */
function joinNames(names: string[], max = 3): string {
  if (names.length <= max) {
    return names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
  }
  return `${names.slice(0, max).join(', ')} e mais ${names.length - max}`;
}

/** UUID determinístico a partir de um texto — usado como idempotency_key na OneSignal. */
async function deterministicUuid(seed: string): Promise<string> {
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(seed)));
  hash[6] = (hash[6] & 0x0f) | 0x50; // versão 5 (formato)
  hash[8] = (hash[8] & 0x3f) | 0x80; // variante RFC 4122
  const hex = Array.from(hash.slice(0, 16), (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

// ---------- destinatários ----------------------------------------------------

/** IDs (= external_id na OneSignal) dos usuários que aceitam a categoria. */
async function recipientsFor(category: Category): Promise<string[]> {
  const [{ data: profiles, error: e1 }, { data: prefs, error: e2 }] = await Promise.all([
    admin.from('profiles').select('id'),
    admin.from('notification_preferences').select('user_id, aniversarios, ferias'),
  ]);
  if (e1 || e2) throw new Error(`Falha ao ler destinatários: ${(e1 ?? e2)!.message}`);
  const optedOut = new Set((prefs ?? []).filter((p) => p[category] === false).map((p) => p.user_id));
  return (profiles ?? []).map((p) => p.id).filter((id) => !optedOut.has(id));
}

// ---------- envio OneSignal --------------------------------------------------

interface PushInput {
  externalIds: string[];
  title: string;
  message: string;
  path?: string;
  idempotencyKey: string;
  topic: string; // agrupa/substitui notificações do mesmo tipo no aparelho
}

async function sendPush(input: PushInput) {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    throw new Error('Segredos ONESIGNAL_APP_ID / ONESIGNAL_REST_API_KEY não configurados.');
  }
  if (input.externalIds.length === 0) return { skipped: 'sem destinatários' };

  const res = await fetch('https://api.onesignal.com/notifications?c=push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Key ${ONESIGNAL_REST_API_KEY}`,
    },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      target_channel: 'push',
      include_aliases: { external_id: input.externalIds },
      headings: { en: input.title, pt: input.title },
      contents: { en: input.message, pt: input.message },
      url: `${SITE_URL}${input.path ?? '/'}`,
      chrome_web_icon: `${SITE_URL}/icons/icon-192.png`,
      chrome_web_badge: `${SITE_URL}/icons/notification-badge-96.png`,
      firefox_icon: `${SITE_URL}/icons/icon-192.png`,
      web_push_topic: input.topic,
      idempotency_key: input.idempotencyKey,
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`OneSignal respondeu ${res.status}: ${JSON.stringify(body?.errors ?? body)}`);
  }
  // Sem nenhum dispositivo inscrito a OneSignal responde 200 com id vazio + aviso.
  return { id: body?.id || null, warnings: body?.errors ?? null };
}

// ---------- regras de negócio -----------------------------------------------

async function buildBirthdayPush(date: { y: number; m: number; d: number }) {
  const { data, error } = await admin.from('employees').select('nome, data_nascimento').not('data_nascimento', 'is', null);
  if (error) throw new Error(`Falha ao ler funcionários: ${error.message}`);

  const isFeb28NonLeap = date.m === 2 && date.d === 28 && !isLeapYear(date.y);
  const names = (data ?? [])
    .filter((e) => {
      const b = parseIsoDate(e.data_nascimento);
      if (!b) return false;
      if (b.m === date.m && b.d === date.d) return true;
      return isFeb28NonLeap && b.m === 2 && b.d === 29; // nascidos em 29/02
    })
    .map((e) => shortName(e.nome))
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));

  if (names.length === 0) return null;
  return names.length === 1
    ? { title: '🎂 Aniversário hoje', message: `${names[0]} faz aniversário hoje. Envie seus parabéns!` }
    : { title: `🎂 ${names.length} aniversariantes hoje`, message: `${joinNames(names)} fazem aniversário hoje. Envie seus parabéns!` };
}

async function buildVacationPush(date: { y: number; m: number; d: number }) {
  const monthName = MONTH_NAMES[date.m - 1];
  const { data: plans, error } = await admin
    .from('vacation_plans').select('employee_id').eq('year', date.y).eq('month', monthName);
  if (error) throw new Error(`Falha ao ler férias: ${error.message}`);
  const ids = [...new Set((plans ?? []).map((p) => p.employee_id))];
  if (ids.length === 0) return null;

  const { data: emps, error: e2 } = await admin.from('employees').select('nome').in('id', ids);
  if (e2) throw new Error(`Falha ao ler funcionários: ${e2.message}`);
  const names = (emps ?? []).map((e) => shortName(e.nome)).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  if (names.length === 0) return null;

  return names.length === 1
    ? { title: `🏖️ Férias em ${monthName}`, message: `${names[0]} tem férias previstas para este mês.` }
    : { title: `🏖️ Férias em ${monthName}`, message: `${names.length} colaboradores têm férias previstas este mês: ${joinNames(names)}.` };
}

async function runDaily(dateOverride?: string, dryRun = false) {
  const date = (dateOverride && parseIsoDate(dateOverride)) || todayInRecife();
  const iso = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
  const result: Record<string, unknown> = { date: iso };

  const birthday = await buildBirthdayPush(date);
  if (birthday) {
    const externalIds = await recipientsFor('aniversarios');
    result.aniversarios = dryRun
      ? { ...birthday, recipients: externalIds.length }
      : await sendPush({
          ...birthday, externalIds, path: '/',
          topic: 'sit-aniversarios',
          idempotencyKey: await deterministicUuid(`sit:aniversarios:${iso}`),
        });
  } else {
    result.aniversarios = 'nenhum aniversariante';
  }

  if (date.d === 1) {
    const vacation = await buildVacationPush(date);
    if (vacation) {
      const externalIds = await recipientsFor('ferias');
      result.ferias = dryRun
        ? { ...vacation, recipients: externalIds.length }
        : await sendPush({
            ...vacation, externalIds, path: '/',
            topic: 'sit-ferias',
            idempotencyKey: await deterministicUuid(`sit:ferias:${iso.slice(0, 7)}`),
          });
    } else {
      result.ferias = 'nenhuma férias no mês';
    }
  } else {
    result.ferias = 'somente no dia 1º';
  }
  return result;
}

// ---------- autenticação -----------------------------------------------------

async function isValidCronSecret(secret: string | null): Promise<boolean> {
  if (!secret) return false;
  const { data, error } = await admin.rpc('verify_push_cron_secret', { p_secret: secret });
  return !error && data === true;
}

async function authenticatedUserId(req: Request): Promise<string | null> {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  return error || !data.user ? null : data.user.id;
}

// ---------- handler ----------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);

  let body: { action?: string; date?: string; dryRun?: boolean } = {};
  try { body = await req.json(); } catch { /* corpo vazio */ }

  try {
    if (body.action === 'daily') {
      if (!(await isValidCronSecret(req.headers.get('x-cron-secret')))) {
        return json({ error: 'Não autorizado' }, 401);
      }
      const result = await runDaily(body.date, body.dryRun === true);
      console.log('[send-push] daily', JSON.stringify(result));
      return json(result);
    }

    if (body.action === 'test') {
      const userId = await authenticatedUserId(req);
      if (!userId) return json({ error: 'Não autorizado' }, 401);
      // O destinatário vem do token validado — nunca do corpo da requisição.
      const result = await sendPush({
        externalIds: [userId],
        title: '🔔 Notificações ativadas',
        message: 'Tudo certo! Você receberá os avisos do SIT neste dispositivo.',
        path: '/',
        topic: 'sit-teste',
        idempotencyKey: crypto.randomUUID(),
      });
      return json(result);
    }

    return json({ error: 'Ação inválida' }, 400);
  } catch (err) {
    console.error('[send-push] erro', err instanceof Error ? err.message : err);
    return json({ error: err instanceof Error ? err.message : 'Erro interno' }, 500);
  }
});
