export interface Supplier {
  id: string;
  userId: string;
  name: string;
  contact: string;
  address?: string;
  createdAt: string;
}

export interface SupplierFormData {
  name: string;
  contact: string;
  address?: string;
}
