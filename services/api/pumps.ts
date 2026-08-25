import { apiJson } from './client';
import { Pump, PumpFormData } from '../../types/pump';

interface ListResponse {
  data: Pump[];
  total: number;
}

export const pumpApi = {
  async getAll(): Promise<Pump[]> {
    const res = await apiJson<ListResponse>('/pumps?limit=100', { method: 'GET' });
    return res.data || [];
  },
  async add(data: PumpFormData): Promise<Pump> {
    return apiJson<Pump>('/pumps', { method: 'POST', body: JSON.stringify(data) });
  },
  async update(id: string, data: Partial<PumpFormData>): Promise<Pump> {
    return apiJson<Pump>(`/pumps/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async remove(id: string): Promise<void> {
    await apiJson(`/pumps/${id}`, { method: 'DELETE' });
  },
};
