import { storage, STORAGE_KEYS } from './storage';
import { Supplier, SupplierFormData } from '../../types/supplier';
import { generateId } from '../../utils/generateId';

export const supplierStorage = {
  async getAll(userId: string): Promise<Supplier[]> {
    const all = (await storage.get<Supplier[]>(STORAGE_KEYS.SUPPLIERS)) || [];
    return all.filter((s) => s.userId === userId);
  },
  async add(userId: string, data: SupplierFormData): Promise<Supplier> {
    const all = (await storage.get<Supplier[]>(STORAGE_KEYS.SUPPLIERS)) || [];
    const item: Supplier = {
      id: generateId(),
      userId,
      name: data.name.trim(),
      contact: data.contact.trim(),
      address: data.address?.trim(),
      createdAt: new Date().toISOString(),
    };
    await storage.set(STORAGE_KEYS.SUPPLIERS, [item, ...all]);
    return item;
  },
  async update(id: string, data: Partial<SupplierFormData>): Promise<void> {
    const all = (await storage.get<Supplier[]>(STORAGE_KEYS.SUPPLIERS)) || [];
    const next = all.map((s) => (s.id === id ? { ...s, ...data } : s));
    await storage.set(STORAGE_KEYS.SUPPLIERS, next);
  },
  async remove(id: string): Promise<void> {
    const all = (await storage.get<Supplier[]>(STORAGE_KEYS.SUPPLIERS)) || [];
    await storage.set(STORAGE_KEYS.SUPPLIERS, all.filter((s) => s.id !== id));
  },
};
