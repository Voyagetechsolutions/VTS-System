const MOCK_USERS = [
  {
    user_id: 'dev-0001',
    email: 'dev@example.com',
    name: 'Primary Developer',
    role: 'developer',
    is_active: true,
    company_id: null,
    password: 'Dev123!'
  },
  {
    user_id: 'adm-1001',
    email: 'admin1@acme.com',
    name: 'Acme Admin',
    role: 'admin',
    is_active: true,
    company_id: 1,
    password: 'Admin123!'
  },
  {
    user_id: 'bo-1001',
    email: 'bo1@acme.com',
    name: 'Acme Booking Officer',
    role: 'booking_officer',
    is_active: true,
    company_id: 1,
    password: 'Book123!'
  },
  {
    user_id: 'boop-1001',
    email: 'board1@acme.com',
    name: 'Acme Boarding Operator',
    role: 'boarding_operator',
    is_active: true,
    company_id: 1,
    password: 'Board123!'
  },
  {
    user_id: 'drv-1001',
    email: 'driver1@acme.com',
    name: 'Acme Driver',
    role: 'driver',
    is_active: true,
    company_id: 1,
    password: 'Drive123!'
  },
  {
    user_id: 'ops-1001',
    email: 'ops1@acme.com',
    name: 'Acme Ops Manager',
    role: 'ops_manager',
    is_active: true,
    company_id: 1,
    password: 'Ops123!'
  },
  {
    user_id: 'dep-1001',
    email: 'depot1@acme.com',
    name: 'Acme Depot Manager',
    role: 'depot_manager',
    is_active: true,
    company_id: 1,
    password: 'Depot123!'
  },
  {
    user_id: 'mnt-1001',
    email: 'maint1@acme.com',
    name: 'Acme Maintenance Manager',
    role: 'maintenance_manager',
    is_active: true,
    company_id: 1,
    password: 'Maint123!'
  },
  {
    user_id: 'fin-1001',
    email: 'finance1@acme.com',
    name: 'Acme Finance Manager',
    role: 'finance_manager',
    is_active: true,
    company_id: 1,
    password: 'Finance123!'
  },
  {
    user_id: 'hr-1001',
    email: 'hr1@acme.com',
    name: 'Acme HR Manager',
    role: 'hr_manager',
    is_active: true,
    company_id: 1,
    password: 'HR123!'
  }
  
];

export function seedMockUsers() {
  try {
    const existing = JSON.parse(localStorage.getItem('testUsers') || '[]');
    const byEmail = new Map((existing || []).map(u => [String(u.email).toLowerCase(), u]));
    for (const u of MOCK_USERS) {
      const key = String(u.email).toLowerCase();
      if (!byEmail.has(key)) byEmail.set(key, u);
    }
    const merged = Array.from(byEmail.values());
    localStorage.setItem('testUsers', JSON.stringify(merged));
  } catch {}
}

export function getMockUsers() {
  return MOCK_USERS.slice();
}


