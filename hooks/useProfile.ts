import { useState, useCallback } from 'react';
import { Profile, ProfileFormData } from '../types/profile';
import { validation } from '../utils/validation';
import { profileApi } from '../services/api/profile';

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

  const loadProfile = useCallback(async (_userId: string) => {
    try {
      setIsLoading(true);
      const existingProfile = await profileApi.get();
      setProfile(existingProfile);
      setIsProfileComplete(existingProfile?.completed || false);
    } catch (err: any) {
      if (__DEV__) console.warn('Error loading profile:', err?.message || err);
      setError(err?.message || 'Failed to load profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveProfile = useCallback(
    async (_userId: string, data: ProfileFormData): Promise<boolean> => {
      try {
        setError(null);
        setIsLoading(true);

        const validationError = validation.profileForm(data);
        if (!validationError.isValid) {
          setError(validationError.error || 'Please fill in all required fields.');
          return false;
        }

        let profileImageUrl: string | null = (data as any).profileImageUrl ?? data.profileImage;
        // If it's a local file, upload first
        if (profileImageUrl && profileImageUrl.startsWith('file://')) {
          try {
            profileImageUrl = await profileApi.uploadImage(profileImageUrl);
          } catch (e) {
            console.warn('Image upload failed, saving local uri as is', e);
          }
        }

        const payload: any = {
          ...data,
          profileImageUrl,
          // Ensure vehicles are in correct shape
          vehicles: data.vehicles || [],
        };
        const savedProfile = await profileApi.upsert(payload);
        setProfile(savedProfile);
        setIsProfileComplete(true);
        return true;
      } catch (err: any) {
        if (__DEV__) console.warn('Error saving profile:', err?.message || err);
        const msg = err?.status === 408 || err?.message?.toLowerCase().includes('timed out')
          ? 'Could not reach server. Please check your internet connection and try again.'
          : err?.message || 'Failed to save profile. Please try again.';
        setError(msg);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateProfile = useCallback(
    async (_userId: string, data: Partial<ProfileFormData>): Promise<boolean> => {
      try {
        setError(null);
        setIsLoading(true);
        // For partial update, just upsert with existing profile merged
        const current = profile;
        const merged: any = { ...(current as any), ...data };
        // Handle image upload if needed
        if (data.profileImage && data.profileImage.startsWith('file://')) {
          try {
            merged.profileImageUrl = await profileApi.uploadImage(data.profileImage);
          } catch {}
        }
        const updatedProfile = await profileApi.upsert(merged);
        setProfile(updatedProfile);
        setIsProfileComplete(updatedProfile.completed);
        return true;
      } catch (err: any) {
        if (__DEV__) console.warn('Error updating profile:', err?.message || err);
        setError(err?.message || 'Failed to update profile. Please try again.');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [profile]
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
