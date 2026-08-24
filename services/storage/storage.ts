import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USERS: '@smartmonk_users',
  SESSION: '@smartmonk_session',
  PROFILE: '@smartmonk_profile',
  ONBOARDING: '@smartmonk_onboarding',
} as const;

export const storage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error reading from storage (${key}):`, error);
      return null;
    }
  },

  async set<T>(key: string, value: T): Promise<boolean> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to storage (${key}):`, error);
      return false;
    }
  },

  async remove(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from storage (${key}):`, error);
      return false;
    }
  },

  async clear(): Promise<boolean> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const smartMonkKeys = keys.filter((k) => k.startsWith('@smartmonk'));
      await AsyncStorage.multiRemove(smartMonkKeys);
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  },
};

export { STORAGE_KEYS };
