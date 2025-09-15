export const setSessionFromProfile = (profile) => {
  try {
    window.userId = profile.user_id;
    window.companyId = profile.company_id;
    window.userRole = profile.role;
    window.user = { id: profile.user_id, role: profile.role, company_id: profile.company_id, name: profile.name || '' };
    localStorage.setItem('userRole', profile.role || '');
    localStorage.setItem('companyId', profile.company_id || '');
    localStorage.setItem('userId', profile.user_id || '');
  } catch {}
};

export const routeByRole = (navigate, role) => {
  switch (role) {
    case 'admin': navigate('/admin-dashboard'); break;
    case 'booking_officer': navigate('/booking-dashboard'); break;
    case 'boarding_operator': navigate('/boarding-operator-dashboard'); break;
    case 'driver': navigate('/driver-dashboard'); break;
    case 'ops_manager': navigate('/ops-dashboard'); break;
    case 'developer': navigate('/developer-dashboard'); break;
    case 'depot_manager': navigate('/depot-dashboard'); break;
    case 'maintenance_manager': navigate('/maintenance-dashboard'); break;
    case 'finance_manager': navigate('/finance-dashboard'); break;
    case 'hr_manager': navigate('/hr-dashboard'); break;
    default: navigate('/');
  }
};


