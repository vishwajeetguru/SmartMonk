import { apiJson, apiUpload } from './client';
import { Expense, ExpenseFormData } from '../../types/expense';

interface ListResponse {
  data: any[];
  total: number;
  page: number;
  limit: number;
}

function serializeExpense(e: any): Expense {
  return {
    id: e.id,
    userId: e.userId,
    category: e.category,
    amount: e.amount != null ? String(e.amount) : '0',
    date: e.date ? new Date(e.date).toISOString().slice(0, 10) : '',
    vehicleNumber: e.vehicleNumber || null,
    tripId: e.tripId || null,
    odometer: e.odometer != null ? String(e.odometer) : null,
    liters: e.liters != null ? String(e.liters) : null,
    receiptUrl: e.receiptUrl || null,
    notes: e.notes || null,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  };
}

export const expenseApi = {
  async getAll(params?: { category?: string; vehicleNumber?: string; from?: string; to?: string }): Promise<Expense[]> {
    const q = new URLSearchParams();
    if (params?.category) q.set('category', params.category);
    if (params?.vehicleNumber) q.set('vehicleNumber', params.vehicleNumber);
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    q.set('limit', '200');
    const suffix = q.toString() ? `?${q}` : '';
    const res = await apiJson<ListResponse>(`/expenses${suffix}`, { method: 'GET' });
    return (res.data || []).map(serializeExpense);
  },

  async add(data: ExpenseFormData): Promise<Expense> {
    const payload: any = {
      category: data.category,
      amount: data.amount ? Number(data.amount) : 0,
      date: data.date,
      vehicleNumber: data.vehicleNumber || null,
      tripId: data.tripId || null,
      odometer: data.odometer ? Number(data.odometer) : null,
      liters: data.liters ? Number(data.liters) : null,
      receiptUrl: data.receiptUrl || null,
      notes: data.notes || null,
    };
    const res = await apiJson<any>('/expenses', { method: 'POST', body: JSON.stringify(payload) });
    return serializeExpense(res);
  },

  async update(id: string, data: Partial<ExpenseFormData>): Promise<Expense> {
    const payload: any = {};
    if (data.category !== undefined) payload.category = data.category;
    if (data.amount !== undefined) payload.amount = data.amount ? Number(data.amount) : 0;
    if (data.date !== undefined) payload.date = data.date;
    if (data.vehicleNumber !== undefined) payload.vehicleNumber = data.vehicleNumber || null;
    if (data.tripId !== undefined) payload.tripId = data.tripId || null;
    if (data.odometer !== undefined) payload.odometer = data.odometer ? Number(data.odometer) : null;
    if (data.liters !== undefined) payload.liters = data.liters ? Number(data.liters) : null;
    if (data.receiptUrl !== undefined) payload.receiptUrl = data.receiptUrl || null;
    if (data.notes !== undefined) payload.notes = data.notes || null;
    const res = await apiJson<any>(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    return serializeExpense(res);
  },

  async remove(id: string): Promise<void> {
    await apiJson(`/expenses/${id}`, { method: 'DELETE' });
  },

  async uploadReceipt(fileUri: string): Promise<string> {
    const form = new FormData();
    // @ts-ignore
    form.append('receipt', { uri: fileUri, name: `receipt_${Date.now()}.jpg`, type: 'image/jpeg' } as any);
    const res = await apiUpload('/uploads/expense-receipt', form);
    return res.url || res.path || fileUri;
  },
};
