import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../supabase/client';

export default function RequireRoles({ roles = [], children }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        let uid = session?.user?.id || null;
        // Try profiles first
        let role = null;
        if (uid) {
          const { data: prof } = await supabase.from('profiles').select('role').eq('id', uid).maybeSingle();
          role = String(prof?.role || '').toLowerCase();
        }
        // Fallback: use localStorage userId and public.users
        if (!role) {
          try {
            const localUid = localStorage.getItem('userId');
            if (localUid) {
              const { data: u2 } = await supabase
                .from('users')
                .select('user_id, role')
                .eq('user_id', localUid)
                .maybeSingle();
              role = String(u2?.role || '').toLowerCase();
            }
          } catch {}
        }
        const allowedRoles = roles.map(r => String(r).toLowerCase());
        setAllowed(allowedRoles.length === 0 || allowedRoles.includes(role));
      } catch {
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [roles]);

  if (loading) return null;
  if (!allowed) return <Navigate to="/" replace />;
  return children;
}
