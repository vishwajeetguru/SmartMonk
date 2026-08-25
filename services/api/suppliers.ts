import { apiJson } from './client';
import { Supplier, SupplierFormData } from '../../types/supplier';

interface ListResponse {
  data: Supplier[];
  total: number;
  page: number;
  limit: number;
}

export const supplierApi = {
  async getAll(): Promise<Supplier[]> {
    const res = await apiJson<ListResponse>('/suppliers?limit=100', { method: 'GET' });
    return res.data || [];
  },
  async add(data: SupplierFormData): Promise<Supplier> {
    return apiJson<Supplier>('/suppliers', { method: 'POST', body: JSON.stringify(data) });
  },
  async update(id: string, data: Partial<SupplierFormData>): Promise<Supplier> {
    return apiJson<Supplier>(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async remove(id: string): Promise<void> {
    await apiJson(`/suppliers/${id}`, { method: 'DELETE' });
  },
};
