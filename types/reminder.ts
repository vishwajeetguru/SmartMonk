export type ReminderKind = 'custom' | 'payment';
export type ReminderRepeat = 'none' | 'daily';

export interface Reminder {
  id: string;
  notificationId: string;
  title: string;
  body: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (24h)
  repeat: ReminderRepeat;
  kind: ReminderKind;
  tripId?: string;
  enabled: boolean;
  createdAt: string;
}

export interface ReminderFormData {
  title: string;
  body: string;
  date: string;
  time: string;
  repeat: ReminderRepeat;
  kind: ReminderKind;
  tripId?: string;
}
