import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // Do not throw at module load — that blanks out the entire app when the
  // build was produced without the env vars inlined. Log a clear warning so
  // the issue is diagnosable, while allowing the UI shell to still render.
  // eslint-disable-next-line no-console
  console.error(
    '[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY at build time. ' +
    'Backend requests will fail until the environment is reconfigured and the app is rebuilt.'
  );
}

export const supabase = createClient(
  supabaseUrl ?? 'http://localhost:54321',
  supabaseAnonKey ?? 'public-anon-key-missing'
);
