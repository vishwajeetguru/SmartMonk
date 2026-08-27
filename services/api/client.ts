import { API_BASE_URL } from './config';
import { tokenStorage } from './tokenStorage';

type FetchOptions = RequestInit & { _retry?: boolean; timeoutMs?: number };

const DEFAULT_TIMEOUT_MS = 30000;

function withTimeout(signal: AbortSignal | undefined, timeoutMs: number): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const cleanup = () => clearTimeout(timeout);
  if (signal) {
    signal.addEventListener('abort', () => controller.abort(), { once: true });
  }
  return { signal: controller.signal, cleanup };
}

function safeJsonParse(text: string): any | null {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    // Malformed JSON / HTML error page - return raw text wrapped
    return { error: text.slice(0, 500), message: 'Invalid JSON response', raw: text };
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) return null;
  try {
    const { signal, cleanup } = withTimeout(undefined, DEFAULT_TIMEOUT_MS);
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      signal,
    });
    cleanup();
    if (!res.ok) {
      await tokenStorage.clear();
      return null;
    }
    const text = await res.text();
    const data = safeJsonParse(text);
    if (!data?.accessToken) {
      await tokenStorage.clear();
      return null;
    }
    await tokenStorage.setTokens(data.accessToken, data.refreshToken, data.user);
    return data.accessToken;
  } catch {
    await tokenStorage.clear();
    return null;
  }
}

export async function apiFetch(path: string, options: FetchOptions = {}): Promise<Response> {
  const { _retry, timeoutMs, signal: externalSignal, ...fetchOpts } = options as FetchOptions & { timeoutMs?: number };
  const accessToken = await tokenStorage.getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((fetchOpts.headers as Record<string, string> | undefined) || {}),
  };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const { signal, cleanup } = withTimeout(externalSignal as AbortSignal | undefined, timeoutMs ?? DEFAULT_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, { ...fetchOpts, headers, signal });
  } catch (e: any) {
    cleanup();
    if (e?.name === 'AbortError') {
      const err: any = new Error('Could not reach server. Check that your phone and PC are on the same Wi-Fi and that the backend is running on 192.168.1.6:3000');
      err.status = 408;
      throw err;
    }
    // Include original error message for network failures (e.g. Failed to fetch)
    const msg = e?.message?.includes('Network request failed') || e?.message?.includes('Failed to fetch')
      ? 'Could not reach server. Check that your phone and PC are on the same Wi-Fi and that the backend is running on 192.168.1.6:3000'
      : e?.message;
    if (msg && msg !== e?.message) { e.message = msg; }
    throw e;
  }
  cleanup();

  if (res.status === 401 && !_retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
      const { signal: retrySignal, cleanup: retryCleanup } = withTimeout(externalSignal as AbortSignal | undefined, timeoutMs ?? DEFAULT_TIMEOUT_MS);
      try {
        res = await fetch(url, { ...fetchOpts, headers: retryHeaders, signal: retrySignal, _retry: true } as any);
      } finally {
        retryCleanup();
      }
    }
  }
  return res;
}

export async function apiJson<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const res = await apiFetch(path, options);
  const text = await res.text().catch(() => '');
  const data = safeJsonParse(text);
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

export async function apiUpload(path: string, formData: FormData, options: FetchOptions = {}): Promise<any> {
  const { _retry } = options as FetchOptions;
  const accessToken = await tokenStorage.getAccessToken();
  const headers: Record<string, string> = {};
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  // Let fetch set Content-Type with boundary
  const url = `${API_BASE_URL}${path}`;
  const { signal, cleanup } = withTimeout(options.signal as AbortSignal | undefined, (options as any).timeoutMs ?? DEFAULT_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, { method: 'POST', headers, body: formData, signal });
  } catch (e: any) {
    cleanup();
    if (e?.name === 'AbortError') {
      const err: any = new Error('Upload timed out — check your connection and try again');
      err.status = 408;
      throw err;
    }
    throw e;
  }
  cleanup();
  if (res.status === 401 && !_retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const retryHeaders: Record<string, string> = { Authorization: `Bearer ${newToken}` };
      const { signal: retrySignal, cleanup: retryCleanup } = withTimeout(options.signal as AbortSignal | undefined, (options as any).timeoutMs ?? DEFAULT_TIMEOUT_MS);
      try {
        res = await fetch(url, { method: 'POST', headers: retryHeaders, body: formData, signal: retrySignal });
      } finally {
        retryCleanup();
      }
      // Mark retry to avoid infinite loop - attach flag via options but fetch doesn't need it, just prevent second retry
      (options as any)._retry = true;
    }
  }
  let data: any = null;
  try {
    const text = await res.text();
    data = safeJsonParse(text);
  } catch {
    data = null;
  }
  if (!res.ok) {
    const err: any = new Error(data?.error || data?.message || `Upload failed ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
