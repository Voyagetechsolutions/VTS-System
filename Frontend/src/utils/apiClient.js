// Simple API client wrapper around fetch with JWT injection and auto-refresh
// Usage:
//   import api from '../utils/apiClient';
//   const res = await api.get('/api/route');
//
const API_BASE = process.env.REACT_APP_API_URL || '';

let accessToken = null;

function getToken() {
  if (accessToken) return accessToken;
  try { accessToken = localStorage.getItem('jwt') || null; } catch {}
  return accessToken;
}

function setToken(token) {
  accessToken = token || null;
  try {
    if (token) localStorage.setItem('jwt', token);
    else localStorage.removeItem('jwt');
  } catch {}
}

async function refreshToken() {
  // refresh via cookie; requires backend CORS AllowCredentials and same-site settings
  const res = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  if (data && data.token) {
    setToken(data.token);
    return data.token;
  }
  return null;
}

async function request(path, options = {}, retrying = false) {
  const url = `${API_BASE}${path}`;
  const headers = new Headers(options.headers || {});
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  // Inject X-Company-Id if present
  try {
    if (typeof window !== 'undefined' && window.companyId != null && window.companyId !== '') {
      headers.set('X-Company-Id', String(window.companyId));
    }
  } catch {}
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(url, {
    ...options,
    headers,
    credentials: options.credentials || 'include',
  });
  if (res.status === 401 && !retrying) {
    const newToken = await refreshToken();
    if (newToken) {
      return request(path, options, true);
    }
  }
  return res;
}

async function json(path, options = {}) {
  const res = await request(path, options);
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch {}
  if (!res.ok) {
    const err = new Error((data && (data.error || data.message)) || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

const api = {
  setToken,
  get: (p) => json(p, { method: 'GET' }),
  post: (p, body) => json(p, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
  put: (p, body) => json(p, { method: 'PUT', body: JSON.stringify(body) }),
  del: (p) => json(p, { method: 'DELETE' }),
  logout: async () => {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch {}
    setToken(null);
  }
};

export default api;
