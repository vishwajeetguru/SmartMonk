import { storage, STORAGE_KEYS } from './storage';
import { Trip, TripFormData } from '../../types/trip';
import { generateId } from '../../utils/generateId';

export const tripStorage = {
  async getAll(userId: string): Promise<Trip[]> {
    const all = (await storage.get<Trip[]>(STORAGE_KEYS.TRIPS)) || [];
    return all.filter((t) => t.userId === userId);
  },
  async add(userId: string, data: TripFormData): Promise<Trip> {
    const all = (await storage.get<Trip[]>(STORAGE_KEYS.TRIPS)) || [];
    const item: Trip = {
      id: generateId(),
      userId,
      title: data.title.trim(),
      from: data.from.trim(),
      to: data.to.trim(),
      date: data.date,
      vehicleNumber: data.vehicleNumber.trim(),
      driverId: data.driverId,
      amount: data.amount?.trim(),
      notes: data.notes?.trim(),
      createdAt: new Date().toISOString(),
    };
    await storage.set(STORAGE_KEYS.TRIPS, [item, ...all]);
    return item;
  },
  async update(id: string, data: Partial<TripFormData>): Promise<void> {
    const all = (await storage.get<Trip[]>(STORAGE_KEYS.TRIPS)) || [];
    const next = all.map((t) => (t.id === id ? { ...t, ...data } : t));
    await storage.set(STORAGE_KEYS.TRIPS, next);
  },
  async remove(id: string): Promise<void> {
    const all = (await storage.get<Trip[]>(STORAGE_KEYS.TRIPS)) || [];
    await storage.set(STORAGE_KEYS.TRIPS, all.filter((t) => t.id !== id));
  },
};
