import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEYS = {
  ACCESS: '@smartmonk_access_token',
  REFRESH: '@smartmonk_refresh_token',
  USER: '@smartmonk_api_user',
} as const;

export interface ApiUser {
  id: string;
  name: string;
  email: string;
}

export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEYS.ACCESS);
  },
  async getRefreshToken(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEYS.REFRESH);
  },
  async getUser(): Promise<ApiUser | null> {
    const raw = await AsyncStorage.getItem(TOKEN_KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  },
  async setTokens(access: string, refresh: string, user?: ApiUser): Promise<void> {
    await AsyncStorage.setItem(TOKEN_KEYS.ACCESS, access);
    await AsyncStorage.setItem(TOKEN_KEYS.REFRESH, refresh);
    if (user) await AsyncStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(user));
  },
  async setAccessToken(access: string): Promise<void> {
    await AsyncStorage.setItem(TOKEN_KEYS.ACCESS, access);
  },
  async clear(): Promise<void> {
    await AsyncStorage.multiRemove([TOKEN_KEYS.ACCESS, TOKEN_KEYS.REFRESH, TOKEN_KEYS.USER]);
  },
};
