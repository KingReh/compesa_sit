// Re-export the auto-generated Supabase client to keep a single instance
// across the app and avoid duplicate GoTrue warnings / missing-env crashes
// when this module was imported before Vite inlined the env vars.
export { supabase } from '@/integrations/supabase/client';
