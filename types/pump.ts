export interface Pump {
  id: string;
  userId: string;
  name: string;
  contact: string;
  location: string;
  createdAt: string;
}

export interface PumpFormData {
  name: string;
  contact: string;
  location: string;
}
