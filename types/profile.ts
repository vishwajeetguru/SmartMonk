export type BusinessType =
  | 'Truck Owner'
  | 'Fleet Owner'
  | 'Transport Contractor'
  | 'Driver'
  | 'Other';

export type VehicleCount = '1' | '2-5' | '6-10' | '10+';

export interface Profile {
  userId: string;
  fullName: string;
  businessName: string;
  mobile: string;
  businessType: BusinessType | null;
  vehicleCount: VehicleCount | null;
  location: string;
  gstNumber: string;
  profileImage: string | null;
  completed: boolean;
}

export interface ProfileFormData {
  fullName: string;
  businessName: string;
  mobile: string;
  businessType: BusinessType | null;
  vehicleCount: VehicleCount | null;
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
