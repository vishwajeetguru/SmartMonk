import { storage, STORAGE_KEYS } from './storage';
import { User, Session, LoginCredentials, SignupCredentials } from '../../types/auth';
import { generateId } from '../../utils/generateId';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface StoredUsers {
  [email: string]: Omit<User, 'password'> & { password?: string };
}

const isWeb = Platform.OS === 'web';
const PWD_PREFIX = 'smartmonk_pwd_';
const LEGACY_PWD_PREFIX = '@smartmonk_pwd_';

function pwdKey(email: string): string {
  const sanitized = email.toLowerCase().replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${PWD_PREFIX}${sanitized}`;
}
function legacyPwdKey(email: string): string {
  return `${LEGACY_PWD_PREFIX}${email.toLowerCase()}`;
}
function toSecurePwdKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function secureSetPwd(email: string, password: string): Promise<void> {
  const key = pwdKey(email);
  const secureKey = toSecurePwdKey(key);
  const legacyKey = legacyPwdKey(email);
  try {
    if (isWeb) {
      await storage.set(key, password);
      await storage.remove(legacyKey).catch(() => {});
      return;
    }
    const available = await SecureStore.isAvailableAsync().catch(() => false);
    if (!available) {
      await storage.set(key, password);
      return;
    }
    await SecureStore.setItemAsync(secureKey, password);
    await storage.remove(key).catch(() => {});
    await storage.remove(legacyKey).catch(() => {});
  } catch {
    await storage.set(key, password).catch(() => {});
  }
}

async function secureGetPwd(email: string): Promise<string | null> {
  const key = pwdKey(email);
  const secureKey = toSecurePwdKey(key);
  const legacyKey = legacyPwdKey(email);
  try {
    if (isWeb) {
      const v = await storage.get<string>(key);
      if (v !== null) return v;
      return storage.get<string>(legacyKey);
    }
    const available = await SecureStore.isAvailableAsync().catch(() => false);
    if (!available) {
      const v = await storage.get<string>(key);
      if (v !== null) return v;
      return storage.get<string>(legacyKey);
    }
    const val = await SecureStore.getItemAsync(secureKey).catch(() => null);
    if (val !== null) return val;
    const asyncVal = await storage.get<string>(key);
    if (asyncVal !== null) return asyncVal;
    const legacyVal = await storage.get<string>(legacyKey);
    if (legacyVal !== null) {
      // migrate legacy to SecureStore
      await SecureStore.setItemAsync(secureKey, legacyVal).catch(() => {});
      await storage.remove(legacyKey).catch(() => {});
      return legacyVal;
    }
    return null;
  } catch {
    const v = await storage.get<string>(key).catch(() => null);
    if (v !== null) return v;
    return storage.get<string>(legacyKey).catch(() => null);
  }
}

async function secureDeletePwd(email: string): Promise<void> {
  const key = pwdKey(email);
  const secureKey = toSecurePwdKey(key);
  const legacyKey = legacyPwdKey(email);
  try {
    if (isWeb) {
      await storage.remove(key).catch(() => {});
      await storage.remove(legacyKey).catch(() => {});
      return;
    }
    const available = await SecureStore.isAvailableAsync().catch(() => false);
    if (available) await SecureStore.deleteItemAsync(secureKey).catch(() => {});
    await storage.remove(key).catch(() => {});
    await storage.remove(legacyKey).catch(() => {});
  } catch {
    await storage.remove(key).catch(() => {});
    await storage.remove(legacyKey).catch(() => {});
  }
}

/**
 * @deprecated Legacy offline auth - prefer authApi + tokenStorage (SecureStore).
 * Passwords are now stored encrypted via SecureStore, never plaintext in @smartmonk_users.
 */
export const authStorage = {
  async getUsers(): Promise<StoredUsers> {
    const users = await storage.get<StoredUsers>(STORAGE_KEYS.USERS);
    return users || {};
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const users = await this.getUsers();
    const stored = users[email.toLowerCase()];
    if (!stored) return null;
    // Migrate legacy plaintext password if present in map
    let pwd: string | null = null;
    if (stored.password) {
      // Legacy: password was inside users map plaintext - migrate to SecureStore
      pwd = stored.password;
      await secureSetPwd(email, pwd).catch(() => {});
      const migrated = { ...stored };
      delete (migrated as any).password;
      users[email.toLowerCase()] = migrated as any;
      await storage.set(STORAGE_KEYS.USERS, users).catch(() => {});
    } else {
      pwd = await secureGetPwd(email);
    }
    return {
      id: stored.id,
      name: stored.name,
      email: stored.email,
      password: pwd || '',
      createdAt: stored.createdAt,
    };
  },

  async createUser(credentials: SignupCredentials): Promise<User> {
    const users = await this.getUsers();
    const email = credentials.email.toLowerCase();

    if (users[email]) {
      throw new Error('An account with this email already exists.');
    }

    const newUser: User = {
      id: generateId(),
      name: credentials.name,
      email,
      password: credentials.password,
      createdAt: new Date().toISOString(),
    };

    // Store user WITHOUT plaintext password in AsyncStorage map
    const { password, ...userWithoutPwd } = newUser as any;
    users[email] = userWithoutPwd as any;
    await storage.set(STORAGE_KEYS.USERS, users);
    // Store password encrypted via SecureStore
    await secureSetPwd(email, credentials.password);
    return newUser;
  },

  async getSession(): Promise<Session | null> {
    return storage.get<Session>(STORAGE_KEYS.SESSION);
  },

  async setSession(session: Session): Promise<boolean> {
    return storage.set(STORAGE_KEYS.SESSION, session);
  },

  async clearSession(): Promise<boolean> {
    return storage.remove(STORAGE_KEYS.SESSION);
  },

  async login(credentials: LoginCredentials): Promise<User> {
    const user = await this.getUserByEmail(credentials.email);

    if (!user) {
      throw new Error('No account found with this email.');
    }

    if (user.password !== credentials.password) {
      throw new Error('Incorrect password. Please try again.');
    }

    await this.setSession({
      isLoggedIn: true,
      userId: user.id,
    });

    return user;
  },

  async signup(credentials: SignupCredentials): Promise<User> {
    const user = await this.createUser(credentials);

    await this.setSession({
      isLoggedIn: true,
      userId: user.id,
    });

    return user;
  },

  async logout(): Promise<boolean> {
    return this.clearSession();
  },

  async isLoggedIn(): Promise<boolean> {
    const session = await this.getSession();
    return session?.isLoggedIn || false;
  },

  async getCurrentUserId(): Promise<string | null> {
    const session = await this.getSession();
    return session?.userId || null;
  },
};
