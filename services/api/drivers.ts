import { apiJson, apiUpload } from './client';
import { Driver, DriverFormData } from '../../types/driver';

interface ListResponse {
  data: Driver[];
  total: number;
}

function serializeDriver(d: any): Driver {
  const rawStatus = d.status as import('../../types/driver').DriverStatus | undefined;
  // fallback: if no status but has vehicle -> Active else Inactive
  const derivedStatus: import('../../types/driver').DriverStatus =
    rawStatus || (d.assignedVehicle ? 'Active' : 'Inactive');
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
    photoUrl: d.photoUrl || null,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    status: derivedStatus,
  } as Driver;
}

export const driverApi = {
  async getAll(): Promise<Driver[]> {
    const res = await apiJson<ListResponse>('/drivers?limit=100', { method: 'GET' });
    // Handle both {data:[]} and Driver[] direct
    const data = (res as any).data || (res as any);
    const list = Array.isArray(data) ? data : (res.data || []);
    return (list || []).map(serializeDriver);
  },
  async getById(id: string): Promise<Driver> {
    const res = await apiJson<any>(`/drivers/${id}`, { method: 'GET' });
    return serializeDriver(res);
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
  async uploadPhoto(fileUri: string): Promise<string> {
    const form = new FormData();
    // @ts-ignore
    form.append('photo', { uri: fileUri, name: `driver_${Date.now()}.jpg`, type: 'image/jpeg' } as any);
    const res = await apiUpload('/uploads/driver-photo', form);
    // Backend returns {url} or {photoUrl}
    return res.url || res.photoUrl || res.path || fileUri;
  },
  async uploadDriverPhoto(id: string, fileUri: string): Promise<Driver> {
    const form = new FormData();
    // @ts-ignore
    form.append('photo', { uri: fileUri, name: `driver_${id}.jpg`, type: 'image/jpeg' } as any);
    const res = await apiUpload(`/drivers/${id}/photo`, form);
    return serializeDriver(res);
  },
};
