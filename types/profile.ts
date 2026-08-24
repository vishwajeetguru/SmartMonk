export type BusinessType =
  | 'Truck Owner'
  | 'Fleet Owner'
  | 'Transport Contractor'
  | 'Driver'
  | 'Other';

export type VehicleCount = '1' | '2-5' | '6-10' | '10+';

export interface Vehicle {
  id: string;
  number: string;
}

export interface Profile {
  userId: string;
  fullName: string;
  businessName: string;
  mobile: string;
  countryCode: string;
  dob: string | null;
  businessType: BusinessType | null;
  vehicleCount: VehicleCount | null;
  vehicles: Vehicle[];
  location: string;
  gstNumber: string;
  profileImage: string | null;
  completed: boolean;
}

export interface ProfileFormData {
  fullName: string;
  businessName: string;
  mobile: string;
  countryCode: string;
  dob: string | null;
  businessType: BusinessType | null;
  vehicleCount: VehicleCount | null;
  vehicles: Vehicle[];
  location: string;
  gstNumber: string;
  profileImage: string | null;
}

export const BUSINESS_TYPES: BusinessType[] = [
  'Truck Owner',
  'Fleet Owner',
  'Transport Contractor',
  'Driver',
  'Other',
];

export const VEHICLE_COUNT_OPTIONS: VehicleCount[] = [
  '1',
  '2-5',
  '6-10',
  '10+',
];

export const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1', flag: '🇺🇸', name: 'USA' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
] as const;

export type CountryCode = (typeof COUNTRY_CODES)[number]['code'];
