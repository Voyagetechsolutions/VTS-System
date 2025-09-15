import { supabase } from './client';

export async function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email, password, role, companyId) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: (typeof window !== 'undefined' && window.location?.origin) ? window.location.origin : undefined,
      data: { role, companyId },
    },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getUser() {
  return supabase.auth.getUser();
}
