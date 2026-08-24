import { useState, useEffect, useCallback } from 'react';
import { User, LoginCredentials, SignupCredentials, AuthError } from '../types/auth';
import { authStorage } from '../services/storage/authStorage';
import { profileStorage } from '../services/storage/profileStorage';
import { validation } from '../utils/validation';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  error: AuthError | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  signup: (credentials: SignupCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      setIsLoading(true);
      const session = await authStorage.getSession();

      if (session?.isLoggedIn && session.userId) {
        const users = await authStorage.getUsers();
        const foundUser = Object.values(users).find((u) => u.id === session.userId);

        if (foundUser) {
          setUser(foundUser);
          setIsAuthenticated(true);
          const profileComplete = await profileStorage.isProfileComplete(foundUser.id);
          setIsProfileComplete(profileComplete);
        } else {
          await authStorage.clearSession();
        }
      }
    } catch (err) {
      console.error('Error checking auth state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setError(null);
      setIsLoading(true);

      const validationError = validation.loginCredentials(credentials);
      if (!validationError.isValid) {
        setError({ message: validationError.error || 'Invalid credentials' });
        return false;
      }

      const loggedInUser = await authStorage.login(credentials);
      setUser(loggedInUser);
      setIsAuthenticated(true);

      const profileComplete = await profileStorage.isProfileComplete(loggedInUser.id);
      setIsProfileComplete(profileComplete);

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError({ message });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (credentials: SignupCredentials): Promise<boolean> => {
    try {
      setError(null);
      setIsLoading(true);

      const validationError = validation.signupCredentials(credentials);
      if (!validationError.isValid) {
        setError({
          field: validationError.field,
          message: validationError.error || 'Invalid credentials',
        });
        return false;
      }

      const newUser = await authStorage.signup(credentials);
      setUser(newUser);
      setIsAuthenticated(true);
      setIsProfileComplete(false);

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed. Please try again.';
      setError({ message });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authStorage.logout();
      setUser(null);
      setIsAuthenticated(false);
      setIsProfileComplete(false);
      setError(null);
    } catch (err) {
      console.error('Error logging out:', err);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated,
    isProfileComplete,
    error,
    login,
    signup,
    logout,
    clearError,
  };
}
