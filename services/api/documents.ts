import { apiJson } from './client';
import { VehicleDocument, VehicleDocumentFormData } from '../../types/vehicleDocument';

function serializeDoc(d: any): VehicleDocument {
  return {
    id: d.id,
    userId: d.userId,
    vehicleNumber: d.vehicleNumber,
    type: d.type,
    docNumber: d.docNumber || null,
    issuedOn: d.issuedOn || null,
    expiresAt: d.expiresAt || '',
    notes: d.notes || null,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

export const documentApi = {
  async getAll(params?: { vehicleNumber?: string }): Promise<VehicleDocument[]> {
    const q = new URLSearchParams();
    if (params?.vehicleNumber) q.set('vehicleNumber', params.vehicleNumber);
    const suffix = q.toString() ? `?${q}` : '';
    const res = await apiJson<{ data: any[] }>(`/documents${suffix}`, { method: 'GET' });
    // server returns {data:[]}
    const data = (res as any)?.data || res;
    const list = Array.isArray(data) ? data : (res as any).data || [];
    return (list || []).map(serializeDoc);
  },

  async add(data: VehicleDocumentFormData): Promise<VehicleDocument> {
    const payload: any = {
      vehicleNumber: data.vehicleNumber,
      type: data.type,
      docNumber: data.docNumber || null,
      issuedOn: data.issuedOn || null,
      expiresAt: data.expiresAt,
      notes: data.notes || null,
    };
    const res = await apiJson<any>('/documents', { method: 'POST', body: JSON.stringify(payload) });
    return serializeDoc(res);
  },

  async update(id: string, data: Partial<VehicleDocumentFormData>): Promise<VehicleDocument> {
    const payload: any = {};
    if (data.vehicleNumber !== undefined) payload.vehicleNumber = data.vehicleNumber;
    if (data.type !== undefined) payload.type = data.type;
    if (data.docNumber !== undefined) payload.docNumber = data.docNumber || null;
    if (data.issuedOn !== undefined) payload.issuedOn = data.issuedOn || null;
    if (data.expiresAt !== undefined) payload.expiresAt = data.expiresAt;
    if (data.notes !== undefined) payload.notes = data.notes || null;
    const res = await apiJson<any>(`/documents/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    return serializeDoc(res);
  },

  async remove(id: string): Promise<void> {
    await apiJson(`/documents/${id}`, { method: 'DELETE' });
  },
};
