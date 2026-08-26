import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const TOKEN_KEYS = {
  ACCESS: 'smartmonk_access_token',
  REFRESH: 'smartmonk_refresh_token',
  USER: 'smartmonk_api_user',
} as const;

// Legacy AsyncStorage keys with @ prefix (pre-fix migration)
const LEGACY_KEYS = {
  ACCESS: '@smartmonk_access_token',
  REFRESH: '@smartmonk_refresh_token',
  USER: '@smartmonk_api_user',
} as const;

function toSecureKey(key: string): string {
  // SecureStore: only alphanumeric, ".", "-", "_" allowed — replace @ and others with _
  return key.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
}

const isWeb = Platform.OS === 'web';

// Helpers: use SecureStore on native (encrypted at rest), AsyncStorage on web
async function secureGet(key: string): Promise<string | null> {
  const secureKey = toSecureKey(key);
  const legacyKey = (LEGACY_KEYS as any)[Object.keys(TOKEN_KEYS).find((k) => (TOKEN_KEYS as any)[k] === key) || ''] || key;
  try {
    if (isWeb) {
      const v = await AsyncStorage.getItem(key);
      if (v !== null) return v;
      if (legacyKey !== key) return AsyncStorage.getItem(legacyKey);
      return null;
    }
    const available = await SecureStore.isAvailableAsync().catch(() => false);
    if (!available) {
      const v = await AsyncStorage.getItem(key);
      if (v !== null) return v;
      if (legacyKey !== key) return AsyncStorage.getItem(legacyKey);
      return null;
    }
    const secureVal = await SecureStore.getItemAsync(secureKey).catch(() => null);
    if (secureVal !== null) return secureVal;
    // Fallback to AsyncStorage (current + legacy)
    const asyncVal = await AsyncStorage.getItem(key).catch(() => null);
    if (asyncVal !== null) return asyncVal;
    if (legacyKey !== key) {
      const legacyVal = await AsyncStorage.getItem(legacyKey).catch(() => null);
      if (legacyVal !== null) {
        // migrate legacy to SecureStore
        await SecureStore.setItemAsync(secureKey, legacyVal).catch(() => {});
        await AsyncStorage.removeItem(legacyKey).catch(() => {});
        return legacyVal;
      }
    }
    return null;
  } catch {
    const v = await AsyncStorage.getItem(key).catch(() => null);
    if (v !== null) return v;
    if (legacyKey !== key) return AsyncStorage.getItem(legacyKey).catch(() => null);
    return null;
  }
}

async function secureSet(key: string, value: string): Promise<void> {
  const secureKey = toSecureKey(key);
  const legacyKey = (LEGACY_KEYS as any)[Object.keys(TOKEN_KEYS).find((k) => (TOKEN_KEYS as any)[k] === key) || ''] || key;
  try {
    if (isWeb) {
      await AsyncStorage.setItem(key, value);
      if (legacyKey !== key) await AsyncStorage.removeItem(legacyKey).catch(() => {});
      return;
    }
    const available = await SecureStore.isAvailableAsync().catch(() => false);
    if (!available) {
      await AsyncStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(secureKey, value);
    // Clean legacy AsyncStorage copies
    await AsyncStorage.removeItem(key).catch(() => {});
    if (legacyKey !== key) await AsyncStorage.removeItem(legacyKey).catch(() => {});
  } catch {
    await AsyncStorage.setItem(key, value).catch(() => {});
  }
}

async function secureDelete(key: string): Promise<void> {
  const secureKey = toSecureKey(key);
  const legacyKey = (LEGACY_KEYS as any)[Object.keys(TOKEN_KEYS).find((k) => (TOKEN_KEYS as any)[k] === key) || ''] || key;
  try {
    if (isWeb) {
      await AsyncStorage.removeItem(key).catch(() => {});
      if (legacyKey !== key) await AsyncStorage.removeItem(legacyKey).catch(() => {});
      return;
    }
    const available = await SecureStore.isAvailableAsync().catch(() => false);
    if (available) await SecureStore.deleteItemAsync(secureKey).catch(() => {});
    await AsyncStorage.removeItem(key).catch(() => {});
    if (legacyKey !== key) await AsyncStorage.removeItem(legacyKey).catch(() => {});
  } catch {
    await AsyncStorage.removeItem(key).catch(() => {});
    if (legacyKey !== key) await AsyncStorage.removeItem(legacyKey).catch(() => {});
  }
}

export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    return secureGet(TOKEN_KEYS.ACCESS);
  },
  async getRefreshToken(): Promise<string | null> {
    return secureGet(TOKEN_KEYS.REFRESH);
  },
  async getUser(): Promise<ApiUser | null> {
    const raw = await secureGet(TOKEN_KEYS.USER);
    if (raw) {
      try {
        return JSON.parse(raw) as ApiUser;
      } catch {
        return null;
      }
    }
    return null;
  },
  async setTokens(access: string, refresh: string, user?: ApiUser): Promise<void> {
    await secureSet(TOKEN_KEYS.ACCESS, access);
    await secureSet(TOKEN_KEYS.REFRESH, refresh);
    if (user) await secureSet(TOKEN_KEYS.USER, JSON.stringify(user));
  },
  async setAccessToken(access: string): Promise<void> {
    await secureSet(TOKEN_KEYS.ACCESS, access);
  },
  async clear(): Promise<void> {
    await Promise.all([
      secureDelete(TOKEN_KEYS.ACCESS),
      secureDelete(TOKEN_KEYS.REFRESH),
      secureDelete(TOKEN_KEYS.USER),
    ]);
    // Also clear any legacy AsyncStorage copies (both new and old)
    await AsyncStorage.multiRemove([
      TOKEN_KEYS.ACCESS,
      TOKEN_KEYS.REFRESH,
      TOKEN_KEYS.USER,
      LEGACY_KEYS.ACCESS,
      LEGACY_KEYS.REFRESH,
      LEGACY_KEYS.USER,
    ]).catch(() => {});
  },
};
