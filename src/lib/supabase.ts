import { createClient } from '@supabase/supabase-js';

export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';
  const schema = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA?.trim() || 'autoscript';

  const isConfigured =
    Boolean(url && key) &&
    !url.includes('your-project-id.supabase.co') &&
    !key.includes('your-anon-key-here');

  if (!isConfigured) {
    return { supabase: null, schema, isConfigured: false };
  }

  const supabase = createClient(url, key);
  return { supabase, schema, isConfigured: true };
}
