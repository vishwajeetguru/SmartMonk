import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  refreshProfile: () => Promise<void>;
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

const AuthContext = createContext<UseAuthReturn | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await profileApi.get();
      if (mountedRef.current) setIsProfileComplete(!!profile?.completed);
    } catch {
      if (mountedRef.current) setIsProfileComplete(false);
    }
  }, []);

  const checkAuthState = useCallback(async () => {
    try {
      if (mountedRef.current) setIsLoading(true);
      const token = await tokenStorage.getAccessToken();
      const apiUser = await tokenStorage.getUser();
      if (!mountedRef.current) return;
      if (token && apiUser) {
        setUser(mapApiUser(apiUser));
        setIsAuthenticated(true);
        try {
          const profile = await profileApi.get();
          if (mountedRef.current) setIsProfileComplete(!!profile?.completed);
        } catch {
          if (mountedRef.current) setIsProfileComplete(false);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setIsProfileComplete(false);
      }
    } catch (err) {
      if (__DEV__) console.error('Error checking auth state:', err);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [refreshProfile]);

  useEffect(() => {
    checkAuthState();
  }, [checkAuthState]);

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

  const value = useMemo<UseAuthReturn>(
    () => ({
      user,
      isLoading,
      isAuthenticated,
      isProfileComplete,
      error,
      login,
      signup,
      logout,
      clearError,
      refreshProfile,
    }),
    [user, isLoading, isAuthenticated, isProfileComplete, error, login, signup, logout, clearError, refreshProfile]
  );

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): UseAuthReturn {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
