export type DocumentType = 'RC' | 'Insurance' | 'Permit' | 'PUC' | 'Fitness';
export const DOCUMENT_TYPES: DocumentType[] = ['RC', 'Insurance', 'Permit', 'PUC', 'Fitness'];

export interface VehicleDocument {
  id: string;
  userId: string;
  vehicleNumber: string;
  type: DocumentType;
  docNumber?: string | null;
  issuedOn?: string | null; // YYYY-MM-DD
  expiresAt: string; // YYYY-MM-DD
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface VehicleDocumentFormData {
  vehicleNumber: string;
  type: DocumentType;
  docNumber?: string | null;
  issuedOn?: string | null;
  expiresAt: string;
  notes?: string | null;
}
