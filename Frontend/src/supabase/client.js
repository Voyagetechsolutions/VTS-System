import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
// Guard missing env and expose globally for convenience where window.supabase is referenced
export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
try { if (typeof window !== 'undefined') { window.supabase = supabase; } } catch {}
