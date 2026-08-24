import { storage, STORAGE_KEYS } from './storage';
import { User, Session, LoginCredentials, SignupCredentials } from '../../types/auth';
import { generateId } from '../../utils/generateId';

interface StoredUsers {
  [email: string]: User;
}

export const authStorage = {
  async getUsers(): Promise<StoredUsers> {
    const users = await storage.get<StoredUsers>(STORAGE_KEYS.USERS);
    return users || {};
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const users = await this.getUsers();
    return users[email.toLowerCase()] || null;
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

    users[email] = newUser;
    await storage.set(STORAGE_KEYS.USERS, users);
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
