import { supabase } from '../supabase/client';
import { setSessionFromProfile, routeByRole } from '../utils/authUtils';

export const useAuth = (navigate) => {
  const USE_TEST_LOGIN = String(process.env.REACT_APP_USE_TEST_LOGIN || '').toLowerCase() === 'true';

  const login = async (email, password, role, tenant, remember = true) => {
    const normalizedEmail = (email || '').trim().toLowerCase();
    const providedCompanyId = tenant && Number.isFinite(Number(tenant)) ? Number(tenant) : null;

    if (USE_TEST_LOGIN) {
      const users = JSON.parse(localStorage.getItem('testUsers') || '[]');
      const u = users.find(x => x.email === normalizedEmail && (x.password || '') === (password || '') && x.is_active !== false);
      if (!u) throw new Error('Invalid credentials');
      if (role && role !== u.role) throw new Error('Role mismatch for this user');
      if ((u.role || '') !== 'developer' && providedCompanyId !== null && Number(u.company_id || 0) !== providedCompanyId) throw new Error('Company mismatch for this user');
      if (providedCompanyId !== null) { try { localStorage.setItem('companyId', String(providedCompanyId)); window.companyId = providedCompanyId; } catch {} }
      setSessionFromProfile({ user_id: u.user_id, company_id: u.company_id || null, role: u.role || 'employee', name: u.name || '' });
      if (remember) { try { localStorage.setItem('rememberMe', 'true'); } catch {} }
      routeByRole(navigate, u.role || 'employee');
      return;
    }

    // Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password: password || '' });
    if (!authError && authData?.user?.id) {
      const { data: profile } = await supabase
        .from('users')
        .select('user_id, name, role, company_id, is_active')
        .eq('user_id', authData.user.id)
        .maybeSingle();
      if (!profile) throw new Error('No profile linked to this account');
      if (profile.is_active === false) throw new Error('User is inactive');
      if (role && role !== profile.role) throw new Error('Role mismatch for this user');
      if (profile.role !== 'developer' && providedCompanyId !== null && Number(profile.company_id || 0) !== providedCompanyId) throw new Error('Company mismatch for this user');
      // Admin MFA (TOTP) prompt if factor exists
      if (profile.role === 'admin') {
        try {
          const { data: factors } = await supabase.auth.mfa.listFactors();
          const totp = (factors?.totp || []).find(f => f.status === 'verified') || (factors?.totp || [])[0];
          if (totp) {
            try { await supabase.auth.mfa.challenge({ factorId: totp.id }); } catch {}
            const code = typeof window !== 'undefined' ? window.prompt('Enter your 6‑digit OTP') : null;
            if (!code) throw new Error('MFA required');
            await supabase.auth.mfa.verify({ factorId: totp.id, code });
          }
        } catch {
          throw new Error('MFA verification failed');
        }
      }
      setSessionFromProfile(profile);
      if (remember) { try { localStorage.setItem('rememberMe', 'true'); } catch {} }
      routeByRole(navigate, profile.role);
      return;
    }

    // Auth failed: JIT provision if profile by email exists
    const { data: dbUser, error: dbErr } = await supabase
      .from('users')
      .select('user_id, name, role, company_id, is_active, email')
      .eq('email', normalizedEmail)
      .maybeSingle();
    if (dbErr || !dbUser) throw new Error((authError && authError.message) || 'Invalid credentials');
    if (dbUser.is_active === false) throw new Error('User is inactive');
    if (role && role !== dbUser.role) throw new Error('Role mismatch for this user');
    if (dbUser.role !== 'developer' && providedCompanyId !== null && Number(dbUser.company_id || 0) !== providedCompanyId) throw new Error('Company mismatch for this user');

    try {
      await supabase.functions.invoke('admin_create_user', { body: {
        email: normalizedEmail,
        password: password || '',
        name: dbUser.name,
        role: dbUser.role,
        company_id: dbUser.company_id,
        auto_confirm: true,
        invite: false,
      }});
    } catch {}

    try { await supabase.auth.signInWithPassword({ email: normalizedEmail, password: password || '' }); } catch {}

    const { data: profile2 } = await supabase
      .from('users')
      .select('user_id, name, role, company_id, is_active')
      .eq('email', normalizedEmail)
      .maybeSingle();
    if (!profile2) throw new Error('Login failed');
    if (profile2.is_active === false) throw new Error('User is inactive');
    if (role && role !== profile2.role) throw new Error('Role mismatch for this user');
    if (profile2.role !== 'developer' && providedCompanyId !== null && Number(profile2.company_id || 0) !== providedCompanyId) throw new Error('Company mismatch for this user');
    setSessionFromProfile(profile2);
    if (remember) { try { localStorage.setItem('rememberMe', 'true'); } catch {} }
    routeByRole(navigate, profile2.role);
  };

  return { login };
};


