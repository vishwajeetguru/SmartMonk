import { storage, STORAGE_KEYS } from './storage';
import { Pump, PumpFormData } from '../../types/pump';
import { generateId } from '../../utils/generateId';

export const pumpStorage = {
  async getAll(userId: string): Promise<Pump[]> {
    const all = (await storage.get<Pump[]>(STORAGE_KEYS.PUMPS)) || [];
    return all.filter((p) => p.userId === userId);
  },
  async add(userId: string, data: PumpFormData): Promise<Pump> {
    const all = (await storage.get<Pump[]>(STORAGE_KEYS.PUMPS)) || [];
    const item: Pump = {
      id: generateId(),
      userId,
      name: data.name.trim(),
      contact: data.contact.trim(),
      location: data.location.trim(),
      createdAt: new Date().toISOString(),
    };
    await storage.set(STORAGE_KEYS.PUMPS, [item, ...all]);
    return item;
  },
  async update(id: string, data: Partial<PumpFormData>): Promise<void> {
    const all = (await storage.get<Pump[]>(STORAGE_KEYS.PUMPS)) || [];
    await storage.set(STORAGE_KEYS.PUMPS, all.map((p) => (p.id === id ? { ...p, ...data } : p)) as any);
  },
  async remove(id: string): Promise<void> {
    const all = (await storage.get<Pump[]>(STORAGE_KEYS.PUMPS)) || [];
    await storage.set(STORAGE_KEYS.PUMPS, all.filter((p) => p.id !== id));
  },
};
