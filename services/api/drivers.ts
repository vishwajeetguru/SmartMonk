import { apiJson } from './client';
import { Driver, DriverFormData } from '../../types/driver';

interface ListResponse {
  data: Driver[];
  total: number;
}

function serializeDriver(d: any): Driver {
  return {
    id: d.id,
    userId: d.userId,
    fullName: d.fullName,
    contact: d.contact,
    bloodGroup: d.bloodGroup,
    aadhar: d.aadhar,
    licence: d.licence,
    address: d.address,
    salary: d.salary != null ? String(d.salary) : undefined,
    assignedVehicle: d.assignedVehicle,
    createdAt: d.createdAt,
  } as Driver;
}

export const driverApi = {
  async getAll(): Promise<Driver[]> {
    const res = await apiJson<ListResponse>('/drivers?limit=100', { method: 'GET' });
    return (res.data || []).map(serializeDriver);
  },
  async add(data: DriverFormData): Promise<Driver> {
    const payload: any = { ...data, salary: data.salary ? Number(data.salary) : undefined };
    const res = await apiJson<any>('/drivers', { method: 'POST', body: JSON.stringify(payload) });
    return serializeDriver(res);
  },
  async update(id: string, data: Partial<DriverFormData>): Promise<Driver> {
    const payload: any = { ...data };
    if (data.salary !== undefined) payload.salary = data.salary ? Number(data.salary) : null;
    const res = await apiJson<any>(`/drivers/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    return serializeDriver(res);
  },
  async remove(id: string): Promise<void> {
    await apiJson(`/drivers/${id}`, { method: 'DELETE' });
  },
};
