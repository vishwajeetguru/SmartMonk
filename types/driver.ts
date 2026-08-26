export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export type DriverStatus = 'Active' | 'On Trip' | 'Inactive';

export interface Driver {
  id: string;
  userId: string;
  fullName: string;
  contact: string;
  bloodGroup?: BloodGroup;
  aadhar?: string;
  licence: string;
  address?: string;
  salary?: string;
  assignedVehicle?: string;
  photoUrl?: string | null;
  createdAt: string;
  updatedAt?: string;
  status?: DriverStatus;
}

export interface DriverFormData {
  fullName: string;
  contact: string;
  bloodGroup?: BloodGroup;
  aadhar?: string;
  licence: string;
  address?: string;
  salary?: string;
  assignedVehicle?: string;
  photoUrl?: string | null;
  status?: DriverStatus;
}
