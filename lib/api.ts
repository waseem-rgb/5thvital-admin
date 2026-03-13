const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://64.227.129.25';

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('5v_admin_token') || '';
}

export function clearToken() {
  localStorage.removeItem('5v_admin_token');
}

export function saveToken(token: string) {
  localStorage.setItem('5v_admin_token', token);
}

async function request(method: string, path: string, body?: unknown) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    clearToken();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }

  return res.json();
}

export const api = {
  get: (path: string) => request('GET', path),
  post: (path: string, body: unknown) => request('POST', path, body),
  put: (path: string, body: unknown) => request('PUT', path, body),
  del: (path: string) => request('DELETE', path),
};
