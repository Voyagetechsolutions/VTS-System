import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../supabase/client';

export default function RequireAuth({ children }) {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const hasSession = !!session?.user?.id;
        let hasLocal = false;
        try { hasLocal = !!localStorage.getItem('userId'); } catch {}
        setAuthed(hasSession || hasLocal);
      } catch {
        setAuthed(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return null;
  if (!authed) return <Navigate to="/" replace />;
  return children;
}
