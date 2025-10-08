import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  const msg = 'Supabase environment variables are not configured. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.';
  // Fail fast in development and production to avoid silent runtime errors
  // eslint-disable-next-line no-console
  console.error(msg, { supabaseUrlPresent: Boolean(supabaseUrl), supabaseKeyPresent: Boolean(supabaseKey) });
  throw new Error(msg);
}

// Create client and expose globally for convenience where window.supabase is referenced
export const supabase = createClient(supabaseUrl, supabaseKey);
try { if (typeof window !== 'undefined') { window.supabase = supabase; } } catch {}
