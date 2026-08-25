import { useState, useEffect, useCallback } from 'react';
import { User, LoginCredentials, SignupCredentials, AuthError } from '../types/auth';
import { validation } from '../utils/validation';
import { authApi } from '../services/api/auth';
import { tokenStorage } from '../services/api/tokenStorage';
import { profileApi } from '../services/api/profile';

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

function mapApiUser(apiUser: any): User {
  return {
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    password: '', // not stored
    createdAt: apiUser.createdAt || new Date().toISOString(),
  };
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
      const token = await tokenStorage.getAccessToken();
      const apiUser = await tokenStorage.getUser();
      if (token && apiUser) {
        setUser(mapApiUser(apiUser));
        setIsAuthenticated(true);
        try {
          const profile = await profileApi.get();
          setIsProfileComplete(!!profile?.completed);
        } catch {
          setIsProfileComplete(false);
        }
      } else {
        setIsAuthenticated(false);
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

      const res = await authApi.login({ email: credentials.email.toLowerCase().trim(), password: credentials.password });
      setUser(mapApiUser(res.user));
      setIsAuthenticated(true);
      try {
        const profile = await profileApi.get();
        setIsProfileComplete(!!profile?.completed);
      } catch {
        setIsProfileComplete(false);
      }
      return true;
    } catch (err: any) {
      const message = err?.message || 'Login failed. Please try again.';
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

      const res = await authApi.signup({
        name: credentials.name.trim(),
        email: credentials.email.toLowerCase().trim(),
        password: credentials.password,
        confirmPassword: credentials.confirmPassword,
      });
      setUser(mapApiUser(res.user));
      setIsAuthenticated(true);
      setIsProfileComplete(false);
      return true;
    } catch (err: any) {
      const message = err?.message || 'Signup failed. Please try again.';
      // Handle 409 duplicate
      if (err?.status === 409) {
        setError({ message: 'An account with this email already exists.' });
      } else {
        setError({ message });
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
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
