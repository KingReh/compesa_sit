import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { Smartphone, Cake, Calendar, Send, Loader2, ChevronDown, ShieldAlert, Share } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { pushStore, enablePush, disablePush, preloadPush, type PushStatus } from '../lib/onesignal';

interface Preferences {
  aniversarios: boolean;
  ferias: boolean;
}

const DEFAULT_PREFS: Preferences = { aniversarios: true, ferias: true };

const STATUS_TEXT: Record<PushStatus, string> = {
  idle: 'Verificando…',
  loading: 'Processando…',
  unsupported: 'Este navegador não oferece suporte a notificações.',
  'ios-install': 'No iPhone/iPad, instale o SIT na Tela de Início para ativar.',
  unavailable: 'Disponível apenas no endereço oficial do SIT.',
  default: 'Aniversariantes do dia e férias do mês, mesmo com o SIT fechado.',
  denied: 'Bloqueadas pelo navegador neste dispositivo.',
  unsubscribed: 'Desativadas neste dispositivo.',
  subscribed: 'Ativas neste dispositivo.',
};

/** Interruptor acessível no padrão visual do SIT. */
const Toggle: React.FC<{ checked: boolean; onChange: () => void; label: string; disabled?: boolean }> = ({
  checked,
  onChange,
  label,
  disabled,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={onChange}
    className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent disabled:opacity-40 disabled:cursor-not-allowed ${
      checked ? 'bg-brand-accent/80 border-brand-accent' : 'bg-white/10 border-white/10'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`}
    />
  </button>
);

/**
 * Bloco "Notificações no dispositivo" exibido no topo da central de notificações.
 * Explica o benefício, só pede permissão quando o usuário clica em "Ativar",
 * mostra o estado da inscrição e permite escolher as categorias.
 */
export const PushNotificationSettings: React.FC = () => {
  const { user } = useAuth();
  const { status, error } = useSyncExternalStore(pushStore.subscribe, pushStore.getSnapshot);
  const [expanded, setExpanded] = useState(false);
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [prefsError, setPrefsError] = useState<string | null>(null);
  const [testState, setTestState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  // Ao abrir o painel, pré-carrega o SDK para que o clique em "Ativar" seja imediato.
  useEffect(() => {
    preloadPush(user?.id ?? null);
  }, [user?.id]);

  // Preferências: lidas uma única vez, somente quando o usuário expande o bloco.
  useEffect(() => {
    if (!expanded || prefs || !user) return;
    supabase
      .from('notification_preferences')
      .select('aniversarios, ferias')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err) setPrefsError('Não foi possível carregar suas preferências.');
        setPrefs(data ?? DEFAULT_PREFS);
      });
  }, [expanded, prefs, user]);

  if (!user) return null;

  const togglePref = async (key: keyof Preferences) => {
    if (!prefs) return;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next); // otimista
    setPrefsError(null);
    const { error: err } = await supabase
      .from('notification_preferences')
      .upsert({ user_id: user.id, ...next, updated_at: new Date().toISOString() });
    if (err) {
      setPrefs(prefs);
      setPrefsError('Não foi possível salvar. Tente novamente.');
    }
  };

  const sendTest = async () => {
    setTestState('sending');
    const { data, error: err } = await supabase.functions.invoke('send-push', { body: { action: 'test' } });
    setTestState(err || data?.error ? 'error' : 'sent');
    setTimeout(() => setTestState('idle'), 5000);
  };

  const busy = status === 'loading' || status === 'idle';
  const isSubscribed = status === 'subscribed';
  const canEnable = status === 'default' || status === 'unsubscribed';

  return (
    <section
      aria-label="Notificações no dispositivo"
      className="shrink-0 mx-2 mt-2 sm:mx-4 sm:mt-4 rounded-xl border border-white/10 bg-white/5"
    >
      <div className="flex items-center gap-2 p-2 sm:gap-4 sm:p-4">
        <div
          className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center ${
            isSubscribed ? 'bg-emerald-500/15 text-emerald-400' : status === 'denied' ? 'bg-rose-500/15 text-rose-400' : 'bg-brand-accent/15 text-brand-accent'
          }`}
        >
          {status === 'denied' ? <ShieldAlert className="h-4 w-4" aria-hidden="true" /> : <Smartphone className="h-4 w-4" aria-hidden="true" />}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-semibold text-white truncate">Notificações no dispositivo</p>
          <p className="text-[11px] leading-4 text-brand-muted" aria-live="polite">
            {error ?? STATUS_TEXT[status]}
          </p>
        </div>

        {busy && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand-muted" aria-label="Carregando" />}

        {!busy && canEnable && (
          <button
            type="button"
            onClick={() => enablePush(user.id)}
            className="shrink-0 rounded-lg bg-brand-accent px-4 py-2 min-h-8 text-xs font-bold text-white hover:bg-brand-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 transition-colors"
          >
            Ativar
          </button>
        )}

        {!busy && isSubscribed && (
          <div className="flex shrink-0 items-center gap-2">
            <Toggle checked label="Desativar notificações neste dispositivo" onChange={() => disablePush()} />
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              aria-label={expanded ? 'Ocultar preferências' : 'Mostrar preferências'}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-brand-muted hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent transition-colors"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/* Orientações para estados que exigem ação do usuário fora do SIT */}
      {status === 'denied' && (
        <p className="border-t border-white/10 px-2 py-2 sm:px-4 text-[11px] leading-4 text-brand-muted">
          Para liberar: toque no <strong className="text-white">cadeado</strong> ao lado do endereço do site →{' '}
          <strong className="text-white">Notificações</strong> → <strong className="text-white">Permitir</strong> e recarregue a página.
        </p>
      )}
      {status === 'ios-install' && (
        <p className="flex items-start gap-2 border-t border-white/10 px-2 py-2 sm:px-4 text-[11px] leading-4 text-brand-muted">
          <Share className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
          <span>
            No Safari, toque em <strong className="text-white">Compartilhar</strong> →{' '}
            <strong className="text-white">Adicionar à Tela de Início</strong>, abra o SIT pelo ícone e ative aqui (iOS 16.4 ou superior).
          </span>
        </p>
      )}

      {isSubscribed && expanded && (
        <div className="border-t border-white/10 p-2 sm:p-4 space-y-2">
          {!prefs ? (
            <div className="flex justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin text-brand-muted" aria-label="Carregando preferências" />
            </div>
          ) : (
            <>
              <label className="flex items-center gap-2 min-h-8">
                <Cake className="h-4 w-4 shrink-0 text-brand-muted" aria-hidden="true" />
                <span className="flex-1 min-w-0 text-xs text-white">
                  Aniversariantes do dia <span className="text-brand-muted">· 7h</span>
                </span>
                <Toggle checked={prefs.aniversarios} label="Receber aniversariantes do dia" onChange={() => togglePref('aniversarios')} />
              </label>
              <label className="flex items-center gap-2 min-h-8">
                <Calendar className="h-4 w-4 shrink-0 text-brand-muted" aria-hidden="true" />
                <span className="flex-1 min-w-0 text-xs text-white">
                  Férias do mês <span className="text-brand-muted">· dia 1º</span>
                </span>
                <Toggle checked={prefs.ferias} label="Receber férias do mês" onChange={() => togglePref('ferias')} />
              </label>
              {prefsError && <p className="text-[11px] text-rose-400">{prefsError}</p>}
              <p className="text-[11px] leading-4 text-brand-muted">As categorias valem para todos os seus dispositivos.</p>
            </>
          )}

          <button
            type="button"
            onClick={sendTest}
            disabled={testState === 'sending'}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 min-h-8 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent transition-colors"
          >
            {testState === 'sending' ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> : <Send className="h-3 w-3" aria-hidden="true" />}
            {testState === 'sent' ? 'Enviada! Deve chegar em instantes.' : testState === 'error' ? 'Falha no envio. Tente novamente.' : 'Enviar notificação de teste'}
          </button>
        </div>
      )}
    </section>
  );
};

export default PushNotificationSettings;
