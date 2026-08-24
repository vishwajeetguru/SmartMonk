export interface Trip {
  id: string;
  userId: string;
  title: string;
  from: string;
  to: string;
  date: string;
  vehicleNumber: string;
  driverId?: string;
  amount?: string;
  notes?: string;
  createdAt: string;
}

export interface TripFormData {
  title: string;
  from: string;
  to: string;
  date: string;
  vehicleNumber: string;
  driverId?: string;
  amount?: string;
  notes?: string;
}
