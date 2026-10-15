const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

let inMemoryToken: string | null = sessionStorage.getItem('skrulla_token');
let inMemoryCsrf: string | null = sessionStorage.getItem('skrulla_csrf');

export function setAuthSession(token: string | null, csrf: string | null) {
  inMemoryToken = token;
  inMemoryCsrf = csrf;
  if (token && csrf) {
    sessionStorage.setItem('skrulla_token', token);
    sessionStorage.setItem('skrulla_csrf', csrf);
  } else {
    sessionStorage.removeItem('skrulla_token');
    sessionStorage.removeItem('skrulla_csrf');
  }
}

export function getAvatarUrl(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (inMemoryToken) {
    headers.set('Authorization', `Bearer ${inMemoryToken}`);
  }
  if (inMemoryCsrf) {
    headers.set('X-CSRF-Token', inMemoryCsrf);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(errBody.detail || 'Unexpected server error');
  }

  return response.json() as Promise<T>;
}
