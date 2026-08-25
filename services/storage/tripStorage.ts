import { storage, STORAGE_KEYS } from './storage';
import { Trip, TripFormData } from '../../types/trip';
import { generateId } from '../../utils/generateId';

function migrateTrip(t: any): Trip {
  return {
    id: t.id,
    userId: t.userId,
    title: t.title || t.material || 'Trip',
    from: t.from || t.location || '',
    to: t.to || t.location || '',
    date: t.date || new Date().toISOString().slice(0, 10),
    vehicleNumber: t.vehicleNumber || t.truckNumber || '',
    truckNumber: t.truckNumber || t.vehicleNumber || '',
    material: t.material || '',
    materialPrice: t.materialPrice || '',
    supplierName: t.supplierName || '',
    supplierId: t.supplierId,
    clientName: t.clientName || '',
    tripsCount: t.tripsCount ?? 1,
    location: t.location || t.from || '',
    totalValue: t.totalValue || t.amount || '0',
    profit: t.profit || '0',
    totalExpense: t.totalExpense || '0',
    paymentStatus: t.paymentStatus || 'Pending',
    driverId: t.driverId,
    amount: t.amount || t.totalValue || '0',
    notes: t.notes,
    createdAt: t.createdAt,
  } as Trip;
}

export const tripStorage = {
  async getAll(userId: string): Promise<Trip[]> {
    const all = (await storage.get<any[]>(STORAGE_KEYS.TRIPS)) || [];
    return all.filter((t) => t.userId === userId).map(migrateTrip);
  },
  async add(userId: string, data: TripFormData): Promise<Trip> {
    const all = (await storage.get<any[]>(STORAGE_KEYS.TRIPS)) || [];
    const item: Trip = {
      id: generateId(),
      userId,
      title: data.material || data.clientName || 'Trip',
      from: data.location || '',
      to: data.location || '',
      date: data.date,
      vehicleNumber: (data.truckNumber || data.vehicleNumber || '').trim(),
      truckNumber: (data.truckNumber || data.vehicleNumber || '').trim(),
      material: data.material.trim(),
      materialPrice: data.materialPrice.trim(),
      supplierName: data.supplierName.trim(),
      supplierId: data.supplierId,
      clientName: data.clientName.trim(),
      tripsCount: data.tripsCount,
      location: data.location.trim(),
      totalValue: data.totalValue.trim() || '0',
      profit: data.profit.trim() || '0',
      totalExpense: data.totalExpense.trim() || '0',
      paymentStatus: data.paymentStatus,
      driverId: (data as any).driverId,
      amount: data.totalValue.trim() || '0',
      createdAt: new Date().toISOString(),
    };
    await storage.set(STORAGE_KEYS.TRIPS, [item as any, ...all]);
    return item;
  },
  async update(id: string, data: Partial<TripFormData>): Promise<void> {
    const all = (await storage.get<any[]>(STORAGE_KEYS.TRIPS)) || [];
    const next = all.map((t) => (t.id === id ? { ...t, ...data } : t));
    await storage.set(STORAGE_KEYS.TRIPS, next);
  },
  async remove(id: string): Promise<void> {
    const all = (await storage.get<any[]>(STORAGE_KEYS.TRIPS)) || [];
    await storage.set(STORAGE_KEYS.TRIPS, all.filter((t) => t.id !== id));
  },
};
