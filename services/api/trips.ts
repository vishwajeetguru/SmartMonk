import { apiJson } from './client';
import { Trip, TripFormData } from '../../types/trip';

interface ListResponse {
  data: any[];
  total: number;
  page: number;
  limit: number;
}

function mapPaymentToStatus(payment: string | undefined): import('../../types/trip').TripStatus {
  if (payment === 'Paid') return 'Completed';
  if (payment === 'Partial') return 'Active';
  return 'Pending';
}

function serializeTrip(t: any): Trip {
  const rawStatus = t.status as import('../../types/trip').TripStatus | undefined;
  const derivedStatus = rawStatus || mapPaymentToStatus(t.paymentStatus);
  return {
    id: t.id,
    userId: t.userId,
    truckNumber: t.truckNumber || t.vehicleNumber || '',
    vehicleNumber: t.truckNumber || t.vehicleNumber || '',
    date: t.date ? new Date(t.date).toISOString().slice(0, 10) : '',
    material: t.material || '',
    materialPrice: t.materialPrice != null ? String(t.materialPrice) : '',
    supplierName: t.supplierName || '',
    supplierId: t.supplierId,
    clientName: t.clientName || '',
    tripsCount: t.tripsCount ?? 1,
    location: t.location || '',
    totalValue: t.totalValue != null ? String(t.totalValue) : '0',
    profit: t.profit != null ? String(t.profit) : '0',
    totalExpense: t.totalExpense != null ? String(t.totalExpense) : '0',
    paymentStatus: t.paymentStatus || 'Pending',
    status: derivedStatus,
    createdAt: t.createdAt,
    // legacy
    title: t.material || t.clientName || 'Trip',
    from: t.location || '',
    to: t.location || '',
    amount: t.totalValue != null ? String(t.totalValue) : '0',
  } as any;
}

export const tripApi = {
  async getAll(): Promise<Trip[]> {
    const res = await apiJson<ListResponse>('/trips?limit=100', { method: 'GET' });
    return (res.data || []).map(serializeTrip);
  },
  async add(data: TripFormData): Promise<Trip> {
    const payload: any = {
      truckNumber: data.truckNumber || data.vehicleNumber,
      date: data.date,
      material: data.material,
      materialPrice: data.materialPrice ? Number(data.materialPrice) : undefined,
      supplierName: data.supplierName,
      supplierId: data.supplierId || undefined,
      clientName: data.clientName,
      tripsCount: Number(data.tripsCount) || 1,
      location: data.location,
      totalValue: data.totalValue ? Number(data.totalValue) : 0,
      profit: data.profit ? Number(data.profit) : 0,
      totalExpense: data.totalExpense ? Number(data.totalExpense) : 0,
      paymentStatus: data.paymentStatus || 'Pending',
      status: (data as any).status || data.paymentStatus || 'Pending',
    };
    const res = await apiJson<any>('/trips', { method: 'POST', body: JSON.stringify(payload) });
    return serializeTrip(res);
  },
  async update(id: string, data: Partial<TripFormData>): Promise<Trip> {
    const payload: any = {};
    if (data.truckNumber !== undefined) payload.truckNumber = data.truckNumber;
    if ((data as any).vehicleNumber !== undefined) payload.truckNumber = (data as any).vehicleNumber;
    if (data.date !== undefined) payload.date = data.date;
    if (data.material !== undefined) payload.material = data.material;
    if (data.materialPrice !== undefined) payload.materialPrice = data.materialPrice ? Number(data.materialPrice) : null;
    if (data.supplierName !== undefined) payload.supplierName = data.supplierName;
    if (data.clientName !== undefined) payload.clientName = data.clientName;
    if (data.tripsCount !== undefined) payload.tripsCount = Number(data.tripsCount);
    if (data.location !== undefined) payload.location = data.location;
    if (data.totalValue !== undefined) payload.totalValue = Number(data.totalValue);
    if (data.profit !== undefined) payload.profit = Number(data.profit);
    if (data.totalExpense !== undefined) payload.totalExpense = Number(data.totalExpense);
    if (data.paymentStatus !== undefined) payload.paymentStatus = data.paymentStatus;
    if ((data as any).status !== undefined) {
      payload.status = (data as any).status;
      // keep paymentStatus in sync for legacy
      if (!data.paymentStatus) {
        const s = (data as any).status;
        if (s === 'Completed') payload.paymentStatus = 'Paid';
        else if (s === 'Active') payload.paymentStatus = 'Partial';
        else payload.paymentStatus = 'Pending';
      }
    }
    const res = await apiJson<any>(`/trips/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    return serializeTrip(res);
  },
  async remove(id: string): Promise<void> {
    await apiJson(`/trips/${id}`, { method: 'DELETE' });
  },
};
