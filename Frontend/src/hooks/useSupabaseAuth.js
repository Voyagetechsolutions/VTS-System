import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';

export function useSupabaseAuth() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user || null);
      } catch (e) {
        console.error('Auth init error', e);
      } finally {
        setLoading(false);
      }
    };
    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user || null);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signInWithPassword = async (email, password) => {
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signInWithProvider = async (provider, options = {}) => {
    setError(null);
    const { data, error } = await supabase.auth.signInWithOAuth({ provider, options });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    setError(null);
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const forgotPassword = async (email, redirectTo) => {
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
    return true;
  };

  const updatePassword = async (newPassword) => {
    setError(null);
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return data;
  };

  return {
    session,
    user,
    loading,
    error,
    signInWithPassword,
    signInWithProvider,
    signOut,
    forgotPassword,
    updatePassword,
  };
}
