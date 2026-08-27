export type ExpenseCategory = 'Fuel' | 'Repair' | 'Toll' | 'Bhatta' | 'Other';
export const EXPENSE_CATEGORIES: ExpenseCategory[] = ['Fuel', 'Repair', 'Toll', 'Bhatta', 'Other'];

export interface Expense {
  id: string;
  userId: string;
  category: ExpenseCategory;
  amount: string;
  date: string; // YYYY-MM-DD
  vehicleNumber?: string | null;
  tripId?: string | null;
  odometer?: string | null; // km
  liters?: string | null; // fuel liters
  receiptUrl?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ExpenseFormData {
  category: ExpenseCategory;
  amount: string;
  date: string;
  vehicleNumber?: string | null;
  tripId?: string | null;
  odometer?: string | null;
  liters?: string | null;
  receiptUrl?: string | null;
  notes?: string | null;
}
