import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ServerSubscription, SubscriptionStatus } from '../types/subscription';
import { subscriptionApi } from '../services/api/subscription';
import { useAuth } from './useAuth';

const CACHE_KEY = '@smartmonk_subscription_cache';

interface SubscriptionContextValue {
  subscription: ServerSubscription | null;
  status: SubscriptionStatus;
  premium: boolean;
  remainingMs: number;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

function msRemaining(sub: ServerSubscription): number {
  const now = Date.now();
  const target = sub.status === 'active' ? sub.activeUntil : sub.trialEndsAt;
  if (!target) return 0;
  return Math.max(0, new Date(target).getTime() - now);
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [subscription, setSubscription] = useState<ServerSubscription | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const sub = await subscriptionApi.get();
      setSubscription(sub);
      if (sub) await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(sub)).catch(() => {});
    } catch (e) {
      // Offline fallback: use last known subscription (don't lock out paying users on network error).
      const raw = await AsyncStorage.getItem(CACHE_KEY).catch(() => null);
      if (raw) {
        try { setSubscription(JSON.parse(raw)); } catch {}
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) refresh();
  }, [isAuthenticated, refresh]);

  // Clear cross-user cache on logout.
  useEffect(() => {
    if (!isAuthenticated) {
      setSubscription(null);
      AsyncStorage.removeItem(CACHE_KEY).catch(() => {});
    }
  }, [isAuthenticated]);

  const status: SubscriptionStatus = useMemo(
    () => subscription?.status || 'trial',
    [subscription]
  );
  const premium = useMemo(() => subscription?.premium || false, [subscription]);
  const remainingMs = useMemo(() => (subscription ? msRemaining(subscription) : 0), [subscription]);

  const value = useMemo<SubscriptionContextValue>(
    () => ({ subscription, status, premium, remainingMs, loading, refresh }),
    [subscription, status, premium, remainingMs, loading, refresh]
  );

  return React.createElement(SubscriptionContext.Provider, { value }, children);
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}
