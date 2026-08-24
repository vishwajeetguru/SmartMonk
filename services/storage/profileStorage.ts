import { storage, STORAGE_KEYS } from './storage';
import { Profile, ProfileFormData } from '../../types/profile';

export const profileStorage = {
  async getProfile(userId: string): Promise<Profile | null> {
    const profiles = await storage.get<Record<string, Profile>>(STORAGE_KEYS.PROFILE);
    return profiles?.[userId] || null;
  },

  async saveProfile(userId: string, data: ProfileFormData): Promise<Profile> {
    const profiles = (await storage.get<Record<string, Profile>>(STORAGE_KEYS.PROFILE)) || {};

    const profile: Profile = {
      userId,
      fullName: data.fullName,
      businessName: data.businessName,
      mobile: data.mobile,
      businessType: data.businessType,
      vehicleCount: data.vehicleCount,
      location: data.location,
      gstNumber: data.gstNumber,
      profileImage: data.profileImage,
      completed: true,
    };

    profiles[userId] = profile;
    await storage.set(STORAGE_KEYS.PROFILE, profiles);
    return profile;
  },

  async updateProfile(userId: string, data: Partial<ProfileFormData>): Promise<Profile | null> {
    const existingProfile = await this.getProfile(userId);

    if (!existingProfile) {
      return null;
    }

    const updatedProfile: Profile = {
      ...existingProfile,
      ...data,
    };

    const profiles = (await storage.get<Record<string, Profile>>(STORAGE_KEYS.PROFILE)) || {};
    profiles[userId] = updatedProfile;
    await storage.set(STORAGE_KEYS.PROFILE, profiles);

    return updatedProfile;
  },

  async isProfileComplete(userId: string): Promise<boolean> {
    const profile = await this.getProfile(userId);
    return profile?.completed || false;
  },

  async deleteProfile(userId: string): Promise<boolean> {
    const profiles = (await storage.get<Record<string, Profile>>(STORAGE_KEYS.PROFILE)) || {};
    delete profiles[userId];
    return storage.set(STORAGE_KEYS.PROFILE, profiles);
  },
};
