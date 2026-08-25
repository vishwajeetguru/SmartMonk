import { apiJson } from './client';
import { tokenStorage, ApiUser } from './tokenStorage';

interface AuthResponse {
  user: ApiUser;
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  async signup(data: { name: string; email: string; password: string; confirmPassword: string }): Promise<AuthResponse> {
    const res = await apiJson<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    await tokenStorage.setTokens(res.accessToken, res.refreshToken, res.user);
    return res;
  },
  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const res = await apiJson<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    await tokenStorage.setTokens(res.accessToken, res.refreshToken, res.user);
    return res;
  },
  async logout(): Promise<void> {
    try {
      await apiJson('/auth/logout', { method: 'POST' });
    } catch {}
    await tokenStorage.clear();
  },
  async getCurrentUser(): Promise<ApiUser | null> {
    return tokenStorage.getUser();
  },
  async isAuthenticated(): Promise<boolean> {
    const token = await tokenStorage.getAccessToken();
    return !!token;
  },
};
