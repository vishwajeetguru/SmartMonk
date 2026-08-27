import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Reminder, ReminderFormData, ReminderRepeat } from '../../types/reminder';
import { generateId } from '../../utils/generateId';

const STORAGE_KEY = '@smartmonk_reminders';
const CHANNEL_ID = 'reminders';
const CHANNEL_ID_ALARM = 'alarms';

// Configure foreground presentation: show a banner even when app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });
    // Alarm channel: max importance + vibration so it rings like an alarm
    await Notifications.setNotificationChannelAsync(CHANNEL_ID_ALARM, {
      name: 'Reminder Alarms',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 300, 500, 300, 500],
      sound: 'default',
      enableVibrate: true,
    });
  } catch {}
}

export async function hasPermissions(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  return !!current.granted;
}

export async function ensurePermissions(): Promise<boolean> {
  await ensureChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (current.status === 'undetermined' || current.canAskAgain) {
    const req = await Notifications.requestPermissionsAsync();
    return req.granted;
  }
  return false;
}

function combineDateTime(date: string, time: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
}

async function readAll(): Promise<Reminder[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Reminder[]) : [];
  } catch {
    return [];
  }
}

async function writeAll(list: Reminder[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function buildTrigger(repeat: ReminderRepeat, dateObj: Date) {
  if (repeat === 'daily') {
    return {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: dateObj.getHours(),
      minute: dateObj.getMinutes(),
    } as Notifications.DailyTriggerInput;
  }
  return {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: dateObj,
  } as Notifications.DateTriggerInput;
}

async function scheduleForReminder(r: Reminder): Promise<string> {
  const dateObj = combineDateTime(r.date, r.time);
  return Notifications.scheduleNotificationAsync({
    content: {
      title: r.title,
      body: r.body,
      sound: 'default',
      data: { kind: r.kind, tripId: r.tripId, reminderId: r.id },
    },
    trigger: buildTrigger(r.repeat, dateObj),
  });
}

export async function listReminders(): Promise<Reminder[]> {
  const list = await readAll();
  return list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export async function scheduleReminder(data: ReminderFormData): Promise<Reminder | null> {
  const granted = await ensurePermissions();
  if (!granted) throw new Error('Notification permission denied');

  const id = generateId();
  const reminder: Reminder = {
    id,
    notificationId: '',
    title: data.title,
    body: data.body,
    date: data.date,
    time: data.time,
    repeat: data.repeat,
    kind: data.kind,
    tripId: data.tripId,
    enabled: true,
    createdAt: new Date().toISOString(),
  };

  reminder.notificationId = await scheduleForReminder(reminder);

  const list = await readAll();
  list.push(reminder);
  await writeAll(list);
  return reminder;
}

export async function cancelReminder(id: string): Promise<void> {
  const list = await readAll();
  const target = list.find((r) => r.id === id);
  if (target?.notificationId) {
    await Notifications.cancelScheduledNotificationAsync(target.notificationId).catch(() => {});
  }
  await writeAll(list.filter((r) => r.id !== id));
}

// Toggle a reminder on/off. Off cancels the notification (the only way it stops ringing).
export async function setReminderEnabled(id: string, enabled: boolean): Promise<void> {
  const list = await readAll();
  const target = list.find((r) => r.id === id);
  if (!target) return;
  if (enabled) {
    if (target.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(target.notificationId).catch(() => {});
    }
    target.notificationId = await scheduleForReminder(target);
  } else if (target.notificationId) {
    await Notifications.cancelScheduledNotificationAsync(target.notificationId).catch(() => {});
    target.notificationId = '';
  }
  target.enabled = enabled;
  await writeAll(list);
}

// Snooze: re-schedule the reminder `minutes` from now (one-off).
export async function snoozeReminder(id: string, minutes: number): Promise<void> {
  const list = await readAll();
  const target = list.find((r) => r.id === id);
  if (!target) return;
  if (target.notificationId) {
    await Notifications.cancelScheduledNotificationAsync(target.notificationId).catch(() => {});
  }
  const d = new Date(Date.now() + minutes * 60000);
  const p = (n: number) => String(n).padStart(2, '0');
  target.date = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  target.time = `${p(d.getHours())}:${p(d.getMinutes())}`;
  target.repeat = 'none';
  target.enabled = true;
  target.notificationId = await scheduleForReminder(target);
  await writeAll(list);
}

// Reconcile storage with actually-scheduled notifications (removes stale entries).
export async function syncReminders(): Promise<Reminder[]> {
  const list = await readAll();
  const scheduled = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
  const validIds = new Set(scheduled.map((s) => s.identifier));
  const valid = list.filter((r) => r.notificationId && validIds.has(r.notificationId));
  if (valid.length !== list.length) await writeAll(valid);
  return valid;
}
