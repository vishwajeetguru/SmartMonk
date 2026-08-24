import { storage, STORAGE_KEYS } from './storage';
import { Driver, DriverFormData } from '../../types/driver';
import { generateId } from '../../utils/generateId';

export const driverStorage = {
  async getAll(userId: string): Promise<Driver[]> {
    const all = (await storage.get<Driver[]>(STORAGE_KEYS.DRIVERS)) || [];
    return all.filter((d) => d.userId === userId);
  },
  async add(userId: string, data: DriverFormData): Promise<Driver> {
    const all = (await storage.get<Driver[]>(STORAGE_KEYS.DRIVERS)) || [];
    const item: Driver = {
      id: generateId(),
      userId,
      fullName: data.fullName.trim(),
      contact: data.contact.trim(),
      bloodGroup: data.bloodGroup,
      aadhar: data.aadhar?.trim(),
      licence: data.licence.trim(),
      address: data.address?.trim(),
      salary: data.salary?.trim(),
      assignedVehicle: data.assignedVehicle?.trim(),
      createdAt: new Date().toISOString(),
    };
    await storage.set(STORAGE_KEYS.DRIVERS, [item, ...all]);
    return item;
  },
  async update(id: string, data: Partial<DriverFormData>): Promise<void> {
    const all = (await storage.get<Driver[]>(STORAGE_KEYS.DRIVERS)) || [];
    const next = all.map((d) => (d.id === id ? { ...d, ...data, fullName: data.fullName?.trim() ?? d.fullName, contact: data.contact?.trim() ?? d.contact, licence: data.licence?.trim() ?? d.licence } : d));
    await storage.set(STORAGE_KEYS.DRIVERS, next);
  },
  async remove(id: string): Promise<void> {
    const all = (await storage.get<Driver[]>(STORAGE_KEYS.DRIVERS)) || [];
    await storage.set(STORAGE_KEYS.DRIVERS, all.filter((d) => d.id !== id));
  },
};
