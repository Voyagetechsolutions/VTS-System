import { supabase } from '../supabase/client';
import api from './apiClient';

export async function performLogout({ redirect = true } = {}) {
  try {
    await Promise.allSettled([
      supabase.auth.signOut(),
      api.logout()
    ]);
  } catch (error) {
    console.error('Error during logout sign-out operations:', error);
  }

  try {
    localStorage.removeItem('companyId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('jwt');
    localStorage.removeItem('rememberDevice');
    sessionStorage.removeItem('companyId');
  } catch (error) {
    console.error('Error clearing storage on logout:', error);
  }

  if (typeof window !== 'undefined') {
    window.companyId = null;
    window.userRole = null;
    window.user = null;
    window.userBranchId = null;
    if (redirect) {
      try {
        window.location.assign('/');
      } catch {
        window.location.href = '/';
      }
    }
  }
}
