import { supabase } from '../supabase/client';
import { setSessionFromProfile, routeByRole } from '../utils/authUtils';
import api from '../utils/apiClient';

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

    // Backend JWT Auth
    const { token } = await api.post('/api/auth/token', { email: normalizedEmail, password: password || '' });
    api.setToken(token);
    if (remember) { try { localStorage.setItem('rememberMe', 'true'); } catch {} }

    // Hydrate identity/roles from backend
    const who = await api.get('/api/auth/whoami');
    const claimsRoles = Array.isArray(who.roles) ? who.roles : [];
    const primaryRole = claimsRoles[0] || role || 'employee';

    // Persist minimal session context
    try {
      window.userId = who.sub || null;
      window.userRole = primaryRole;
      localStorage.setItem('userRole', primaryRole);
      // CompanyId not part of whoami; keep existing tenant if provided
      if (providedCompanyId !== null) { window.companyId = providedCompanyId; localStorage.setItem('companyId', String(providedCompanyId)); }
    } catch {}

    routeByRole(navigate, primaryRole);
  };

  return { login };
};


