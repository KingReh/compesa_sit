// onesignal:managed v1
// ---------------------------------------------------------------------------
// Ponto ÚNICO de acesso ao SDK Web da OneSignal (v16). Nenhum outro arquivo
// deve chamar `window.OneSignal` diretamente.
//
// Decisões importantes:
// • O SDK (≈100 KB) só é baixado quando necessário: quando o usuário já tinha
//   ativado o push neste navegador, ou quando abre o painel de notificações.
// • Nunca pedimos permissão automaticamente — só pelo botão "Ativar".
// • O Service Worker da OneSignal fica num escopo próprio (/push/onesignal/)
//   para não disputar o escopo "/" com o sw.js do PWA (cache offline).
// • O usuário do Supabase vira o `external_id` na OneSignal (OneSignal.login),
//   ligando todos os dispositivos dele à mesma conta. No logout, o dispositivo
//   volta a ser anônimo e deixa de receber avisos da conta.
// • O App ID é público por natureza (vai para o navegador de qualquer forma).
//   A REST API Key NUNCA fica aqui: ela vive só nos secrets da Edge Function.
// ---------------------------------------------------------------------------

/** App ID público do app "SIT" na OneSignal. Pode ser sobrescrito por VITE_ONESIGNAL_APP_ID. */
const ONESIGNAL_APP_ID: string =
  (import.meta.env.VITE_ONESIGNAL_APP_ID as string | undefined) || '72382c8b-67fc-4fbe-99e4-47536f941f12';

/** Origem cadastrada na OneSignal. Em outras origens (preview, localhost) o push fica indisponível. */
const ALLOWED_ORIGIN: string =
  (import.meta.env.VITE_ONESIGNAL_SITE_ORIGIN as string | undefined) || 'https://sitcompesa.vercel.app';

const SDK_URL = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
const DEBUG_KEY = '@sit:push:debug';

export type PushStatus =
  | 'idle'            // SDK ainda não carregado (estado inicial)
  | 'loading'         // carregando SDK / processando ação
  | 'unsupported'     // navegador sem suporte a Web Push
  | 'ios-install'     // iPhone/iPad: precisa adicionar à Tela de Início primeiro
  | 'unavailable'     // ambiente não configurado (origem diferente, App ID ausente, falha do SDK)
  | 'default'         // nunca foi perguntado
  | 'denied'          // usuário bloqueou no navegador
  | 'unsubscribed'    // permissão concedida, mas desativado no SIT
  | 'subscribed';     // recebendo notificações

export interface PushState {
  status: PushStatus;
  error: string | null;
}

// ---------- tipos mínimos do SDK v16 (apenas o que usamos) ------------------
interface OneSignalPushSubscription {
  id: string | null | undefined;
  optedIn: boolean | undefined;
  optIn(): Promise<void>;
  optOut(): Promise<void>;
  addEventListener(event: 'change', cb: (e: unknown) => void): void;
}
interface OneSignalSDK {
  init(options: Record<string, unknown>): Promise<void>;
  login(externalId: string): Promise<void>;
  logout(): Promise<void>;
  Notifications: {
    isPushSupported(): boolean;
    permission: boolean;
    permissionNative?: NotificationPermission;
    requestPermission(): Promise<void>;
    addEventListener(event: 'permissionChange', cb: (granted: boolean) => void): void;
  };
  User: { PushSubscription: OneSignalPushSubscription };
}
declare global {
  interface Window {
    OneSignalDeferred?: Array<(os: OneSignalSDK) => void | Promise<void>>;
  }
}

// ---------- store simples (compatível com useSyncExternalStore) -------------
let state: PushState = { status: 'idle', error: null };
const listeners = new Set<() => void>();
const setState = (patch: Partial<PushState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};
export const pushStore = {
  getSnapshot: () => state,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

// ---------- detecção de ambiente -------------------------------------------
const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const browserSupportsPush = () =>
  typeof window !== 'undefined' &&
  'Notification' in window &&
  'serviceWorker' in navigator &&
  'PushManager' in window;

const isConfigured = () =>
  !ONESIGNAL_APP_ID.startsWith('__') &&
  window.location.origin === ALLOWED_ORIGIN &&
  window.self === window.top;

/** Estado inicial calculado sem baixar o SDK. */
function preliminaryStatus(): PushStatus | null {
  if (typeof window === 'undefined') return 'unsupported';
  if (isIOS() && !isStandalone()) return 'ios-install';
  if (!browserSupportsPush()) return 'unsupported';
  if (!isConfigured()) return 'unavailable';
  if (Notification.permission === 'denied') return 'denied';
  return null;
}

const debugLog = (...args: unknown[]) => {
  try {
    if (localStorage.getItem(DEBUG_KEY) === '1') console.info('[push]', ...args);
  } catch { /* noop */ }
};

// ---------- carregamento único do SDK --------------------------------------
let sdkPromise: Promise<OneSignalSDK> | null = null;
let currentExternalId: string | null = null;

function computeStatus(os: OneSignalSDK): PushStatus {
  const native = os.Notifications.permissionNative ?? Notification.permission;
  if (native === 'denied') return 'denied';
  if (native !== 'granted') return 'default';
  return os.User.PushSubscription.optedIn ? 'subscribed' : 'unsubscribed';
}

function loadSdk(): Promise<OneSignalSDK> {
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<OneSignalSDK>((resolve, reject) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          serviceWorkerPath: 'push/onesignal/OneSignalSDKWorker.js',
          serviceWorkerParam: { scope: '/push/onesignal/' },
          // Sem prompts automáticos nem botão flutuante: quem decide é o usuário, pelo painel.
          autoResubscribe: true,
          notifyButton: { enable: false },
          welcomeNotification: { disable: true },
        });
        const refresh = () => setState({ status: computeStatus(OneSignal) });
        OneSignal.Notifications.addEventListener('permissionChange', refresh);
        OneSignal.User.PushSubscription.addEventListener('change', () => {
          refresh();
          debugLog('subscription', OneSignal.User.PushSubscription.id, OneSignal.User.PushSubscription.optedIn);
        });
        refresh();
        debugLog('init ok', OneSignal.User.PushSubscription.id);
        resolve(OneSignal);
      } catch (err) {
        reject(err);
      }
    });

    if (!document.querySelector(`script[src="${SDK_URL}"]`)) {
      const script = document.createElement('script');
      script.src = SDK_URL;
      script.defer = true;
      script.onerror = () => reject(new Error('Não foi possível carregar o serviço de notificações.'));
      document.head.appendChild(script);
    }
  }).catch((err) => {
    sdkPromise = null; // permite nova tentativa
    console.warn('[push] Falha ao iniciar OneSignal:', err);
    setState({ status: 'unavailable', error: 'Serviço de notificações indisponível no momento.' });
    throw err;
  });

  return sdkPromise;
}

// ---------- API pública -----------------------------------------------------

/**
 * Chamado sempre que o usuário logado muda. Só baixa o SDK se este navegador
 * já tinha permissão concedida (usuário que ativou antes); caso contrário,
 * apenas calcula o estado sem custo de rede.
 */
export async function syncPushUser(userId: string | null): Promise<void> {
  const pre = preliminaryStatus();
  if (pre) {
    setState({ status: pre });
    return;
  }
  if (!userId) return;

  if (Notification.permission !== 'granted' && !sdkPromise) {
    setState({ status: 'default' });
    currentExternalId = null;
    return;
  }
  try {
    const os = await loadSdk();
    if (currentExternalId !== userId) {
      await os.login(userId);
      currentExternalId = userId;
      debugLog('login', userId);
    }
    setState({ status: computeStatus(os), error: null });
  } catch { /* estado já atualizado em loadSdk */ }
}

/** Pré-carrega o SDK (ex.: ao abrir o painel) para o clique em "Ativar" ser instantâneo — exigência do Safari. */
export function preloadPush(userId: string | null): void {
  if (preliminaryStatus() || !userId) return;
  loadSdk()
    .then(async (os) => {
      if (currentExternalId !== userId) {
        await os.login(userId);
        currentExternalId = userId;
      }
      setState({ status: computeStatus(os), error: null });
    })
    .catch(() => { /* já tratado */ });
}

/** Ativa: pede permissão (somente após clique do usuário) e inscreve o dispositivo. */
export async function enablePush(userId: string): Promise<void> {
  const pre = preliminaryStatus();
  if (pre) {
    setState({ status: pre });
    return;
  }
  setState({ status: 'loading', error: null });
  try {
    const os = await loadSdk();
    if (currentExternalId !== userId) {
      await os.login(userId);
      currentExternalId = userId;
    }
    if (Notification.permission === 'default') {
      await os.Notifications.requestPermission();
    }
    if (Notification.permission === 'granted' && !os.User.PushSubscription.optedIn) {
      await os.User.PushSubscription.optIn();
    }
    setState({ status: computeStatus(os) });
  } catch (err) {
    console.warn('[push] Falha ao ativar:', err);
    setState({ status: state.status === 'loading' ? 'default' : state.status, error: 'Não foi possível ativar as notificações. Tente novamente.' });
  }
}

/** Desativa só neste dispositivo (a permissão do navegador continua como está). */
export async function disablePush(): Promise<void> {
  if (!sdkPromise) return;
  setState({ status: 'loading', error: null });
  try {
    const os = await sdkPromise;
    await os.User.PushSubscription.optOut();
    setState({ status: computeStatus(os) });
  } catch (err) {
    console.warn('[push] Falha ao desativar:', err);
    setState({ status: 'subscribed', error: 'Não foi possível desativar. Tente novamente.' });
  }
}

/** No logout do SIT: desassocia o dispositivo do usuário (vira anônimo). */
export async function logoutPush(): Promise<void> {
  currentExternalId = null;
  if (!sdkPromise) return;
  try {
    const os = await sdkPromise;
    await os.logout();
    debugLog('logout');
  } catch { /* noop */ }
}
