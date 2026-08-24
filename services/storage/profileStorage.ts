import { storage, STORAGE_KEYS } from './storage';
import { Profile, ProfileFormData } from '../../types/profile';

export const profileStorage = {
  async getProfile(userId: string): Promise<Profile | null> {
    const profiles = await storage.get<Record<string, Profile>>(STORAGE_KEYS.PROFILE);
    const p = profiles?.[userId] as Profile | null;
    if (!p) return null;
    const defaults = {
      countryCode: '+91',
      dob: null as string | null,
      vehicles: [] as Profile['vehicles'],
      businessName: '',
      location: '',
      gstNumber: '',
    };
    const migrated = Object.assign({}, defaults, p) as Profile;
    if (!migrated.vehicles) migrated.vehicles = [];
    return migrated;
  },

  async saveProfile(userId: string, data: ProfileFormData): Promise<Profile> {
    const profiles = (await storage.get<Record<string, Profile>>(STORAGE_KEYS.PROFILE)) || {};

    const profile: Profile = {
      userId,
      fullName: data.fullName,
      businessName: data.businessName || '',
      mobile: data.mobile,
      countryCode: data.countryCode || '+91',
      dob: data.dob || null,
      businessType: data.businessType,
      vehicleCount: data.vehicleCount,
      vehicles: data.vehicles || [],
      location: data.location || '',
      gstNumber: data.gstNumber || '',
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
      vehicles: (data.vehicles as any) || existingProfile.vehicles || [],
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
