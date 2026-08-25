import { apiJson, apiUpload } from './client';
import { Profile, Vehicle } from '../../types/profile';

interface ProfileResponse {
  profile: Profile | null;
}

function mapProfile(raw: any): Profile | null {
  if (!raw) return null;
  return {
    userId: raw.userId,
    fullName: raw.fullName,
    businessName: raw.businessName || '',
    mobile: raw.mobile,
    countryCode: raw.countryCode || '+91',
    dob: raw.dob || null,
    businessType: raw.businessType || null,
    vehicleCount: raw.vehicleCount || null,
    vehicles: (raw.vehicles || []).map((v: any) => ({ id: v.id, number: v.number })),
    location: raw.location || '',
    gstNumber: raw.gstNumber || '',
    profileImage: raw.profileImageUrl || null,
    completed: raw.completed || false,
  } as Profile;
}

export const profileApi = {
  async get(): Promise<Profile | null> {
    const res = await apiJson<ProfileResponse>('/profile', { method: 'GET' });
    return mapProfile(res.profile);
  },
  async upsert(data: Partial<Profile> & { profileImageUrl?: string | null }): Promise<Profile> {
    // Map local Profile to API shape
    const payload: any = {
      fullName: data.fullName,
      businessName: data.businessName,
      mobile: data.mobile,
      countryCode: (data as any).countryCode || '+91',
      dob: data.dob || null,
      businessType: data.businessType || null,
      vehicleCount: data.vehicleCount || null,
      location: data.location || null,
      gstNumber: data.gstNumber || null,
      profileImageUrl: (data as any).profileImageUrl ?? data.profileImage ?? null,
      completed: data.completed ?? true,
      vehicles: (data.vehicles || []).map((v: Vehicle) => ({ number: v.number })),
    };
    const res = await apiJson<ProfileResponse>('/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return mapProfile(res.profile)!;
  },
  async uploadImage(uri: string): Promise<string> {
    const form = new FormData();
    // @ts-ignore - React Native FormData file
    form.append('image', { uri, name: 'profile.jpg', type: 'image/jpeg' } as any);
    const res = await apiUpload('/uploads/profile-image', form);
    // Backend returns { url: "/uploads/xxx.jpg" } or { profileImageUrl }
    const url = res.url || res.profileImageUrl || res.path;
    if (!url) return uri;
    // If relative, make absolute
    if (url.startsWith('/')) {
      const base = require('./config').API_BASE_URL.replace('/api/v1', '');
      return `${base}${url}`;
    }
    return url;
  },
};
