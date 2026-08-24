import { authStorage } from '../storage/authStorage';
import { User } from '../../types/auth';

export const localAuth = {
  async getCurrentUser(): Promise<User | null> {
    const userId = await authStorage.getCurrentUserId();
    if (!userId) return null;

    const user = await authStorage.getUserByEmail(userId);
    return user;
  },

  async isAuthenticated(): Promise<boolean> {
    return authStorage.isLoggedIn();
  },

  async hasCompletedOnboarding(): Promise<boolean> {
    const userId = await authStorage.getCurrentUserId();
    if (!userId) return false;

    return authStorage.isLoggedIn();
  },
};
