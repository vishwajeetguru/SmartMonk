import { API_BASE_URL } from './config';
import { tokenStorage } from './tokenStorage';

type FetchOptions = RequestInit & { _retry?: boolean };

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      await tokenStorage.clear();
      return null;
    }
    const data = await res.json();
    await tokenStorage.setTokens(data.accessToken, data.refreshToken, data.user);
    return data.accessToken;
  } catch {
    await tokenStorage.clear();
    return null;
  }
}

export async function apiFetch(path: string, options: FetchOptions = {}): Promise<Response> {
  const accessToken = await tokenStorage.getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  let res = await fetch(url, { ...options, headers });

  if (res.status === 401 && !options._retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
      res = await fetch(url, { ...options, headers: retryHeaders, _retry: true } as any);
    }
  }
  return res;
}

export async function apiJson<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const res = await apiFetch(path, options);
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message = data?.error || data?.message || `Request failed ${res.status}`;
    const field = data?.field;
    const err: any = new Error(message);
    err.status = res.status;
    err.field = field;
    err.data = data;
    throw err;
  }
  return data as T;
}

export async function apiUpload(path: string, formData: FormData): Promise<any> {
  const accessToken = await tokenStorage.getAccessToken();
  const headers: Record<string, string> = {};
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  // Let fetch set Content-Type with boundary
  const url = `${API_BASE_URL}${path}`;
  let res = await fetch(url, { method: 'POST', headers, body: formData });
  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const retryHeaders: Record<string, string> = { Authorization: `Bearer ${newToken}` };
      res = await fetch(url, { method: 'POST', headers: retryHeaders, body: formData });
    }
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err: any = new Error(data?.error || `Upload failed ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}
