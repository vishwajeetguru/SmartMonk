export type PaymentStatus = 'Pending' | 'Paid' | 'Partial';

export const PAYMENT_STATUSES: PaymentStatus[] = ['Pending', 'Paid', 'Partial'];

export type TripStatus = 'Pending' | 'Active' | 'Completed' | 'Cancelled';

export const TRIP_STATUSES: TripStatus[] = ['Pending', 'Active', 'Completed', 'Cancelled'];

export interface Trip {
  id: string;
  userId: string;
  // legacy
  title?: string;
  from?: string;
  to?: string;
  amount?: string;
  driverId?: string;
  notes?: string;
  // new
  truckNumber: string;
  date: string;
  material: string;
  materialPrice: string;
  supplierName: string;
  supplierId?: string;
  clientName: string;
  tripsCount: number;
  location: string;
  totalValue: string;
  profit: string;
  totalExpense: string;
  paymentStatus: PaymentStatus;
  status?: TripStatus;
  vehicleNumber: string;
  createdAt: string;
}

export interface TripFormData {
  truckNumber: string;
  date: string;
  material: string;
  materialPrice: string;
  supplierName: string;
  supplierId?: string;
  clientName: string;
  tripsCount: number;
  location: string;
  totalValue: string;
  profit: string;
  totalExpense: string;
  paymentStatus: PaymentStatus;
  status?: TripStatus;
  // legacy compat
  title?: string;
  from?: string;
  to?: string;
  vehicleNumber?: string;
  amount?: string;
}
