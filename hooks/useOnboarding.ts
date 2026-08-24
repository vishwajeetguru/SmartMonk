import { useState, useEffect, useCallback } from 'react';
import { storage, STORAGE_KEYS } from '../services/storage/storage';

interface UseOnboardingReturn {
  onboardingCompleted: boolean;
  isLoading: boolean;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

export function useOnboarding(): UseOnboardingReturn {
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      setIsLoading(true);
      const status = await storage.get<boolean>(STORAGE_KEYS.ONBOARDING);
      setOnboardingCompleted(status || false);
    } catch (err) {
      console.error('Error checking onboarding status:', err);
      setOnboardingCompleted(false);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = useCallback(async () => {
    try {
      await storage.set(STORAGE_KEYS.ONBOARDING, true);
      setOnboardingCompleted(true);
    } catch (err) {
      console.error('Error completing onboarding:', err);
    }
  }, []);

  const resetOnboarding = useCallback(async () => {
    try {
      await storage.remove(STORAGE_KEYS.ONBOARDING);
      setOnboardingCompleted(false);
    } catch (err) {
      console.error('Error resetting onboarding:', err);
    }
  }, []);

  return {
    onboardingCompleted,
    isLoading,
    completeOnboarding,
    resetOnboarding,
  };
}
