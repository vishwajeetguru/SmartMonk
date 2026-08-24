import { useState, useEffect, useCallback } from 'react';
import { Profile, ProfileFormData } from '../types/profile';
import { profileStorage } from '../services/storage/profileStorage';
import { validation } from '../utils/validation';

interface UseProfileReturn {
  profile: Profile | null;
  isLoading: boolean;
  isProfileComplete: boolean;
  error: string | null;
  saveProfile: (userId: string, data: ProfileFormData) => Promise<boolean>;
  updateProfile: (userId: string, data: Partial<ProfileFormData>) => Promise<boolean>;
  loadProfile: (userId: string) => Promise<void>;
  clearError: () => void;
}

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      setIsLoading(true);
      const existingProfile = await profileStorage.getProfile(userId);
      setProfile(existingProfile);
      setIsProfileComplete(existingProfile?.completed || false);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveProfile = useCallback(
    async (userId: string, data: ProfileFormData): Promise<boolean> => {
      try {
        setError(null);
        setIsLoading(true);

        const validationError = validation.profileForm(data);
        if (!validationError.isValid) {
          setError(validationError.error || 'Please fill in all required fields.');
          return false;
        }

        const savedProfile = await profileStorage.saveProfile(userId, data);
        setProfile(savedProfile);
        setIsProfileComplete(true);

        return true;
      } catch (err) {
        console.error('Error saving profile:', err);
        setError('Failed to save profile. Please try again.');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateProfile = useCallback(
    async (userId: string, data: Partial<ProfileFormData>): Promise<boolean> => {
      try {
        setError(null);
        setIsLoading(true);

        const updatedProfile = await profileStorage.updateProfile(userId, data);

        if (updatedProfile) {
          setProfile(updatedProfile);
          setIsProfileComplete(updatedProfile.completed);
          return true;
        }

        return false;
      } catch (err) {
        console.error('Error updating profile:', err);
        setError('Failed to update profile. Please try again.');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    profile,
    isLoading,
    isProfileComplete,
    error,
    saveProfile,
    updateProfile,
    loadProfile,
    clearError,
  };
}
