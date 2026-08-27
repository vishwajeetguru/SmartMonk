import React, { useCallback, useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { DatePicker } from '../../components/ui/DatePicker';
import { TimePicker } from '../../components/ui/TimePicker';
import { AlarmModal } from '../../components/ui/AlarmModal';
import { ActionMenu, ActionMenuItem } from '../../components/ui/ActionMenu';
import { tripApi } from '../../services/api/trips';
import { Trip } from '../../types/trip';
import { Reminder, ReminderRepeat } from '../../types/reminder';
import { scheduleReminder, cancelReminder, listReminders, syncReminders, hasPermissions, ensurePermissions, setReminderEnabled, snoozeReminder } from '../../services/notifications/reminderService';

type Tab = 'custom' | 'payments';

export default function ReminderScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { t } = useTranslation();

  const [tab, setTab] = useState<Tab>('custom');
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [pendingTrips, setPendingTrips] = useState<Trip[]>([]);
  const [permission, setPermission] = useState(true);

  // custom reminder form
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [repeat, setRepeat] = useState<ReminderRepeat>('none');
  const [formErr, setFormErr] = useState<Record<string, string>>({});

  // payment reminder
  const [paymentTrip, setPaymentTrip] = useState<Trip | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [payDate, setPayDate] = useState('');
  const [payTime, setPayTime] = useState('');

  const [toast, setToast] = useState('');
  const [alarm, setAlarm] = useState<{ title: string; body: string; reminderId?: string; enabled: boolean } | null>(null);
  const [menuReminder, setMenuReminder] = useState<Reminder | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  useEffect(() => {
    // Show full-screen alarm when a reminder fires while the app is open
    const sub = Notifications.addNotificationReceivedListener((n) => {
      const content = n.request.content;
      const data = (content.data || {}) as { kind?: string; reminderId?: string };
      if (data.kind === 'custom' || data.kind === 'payment') {
        const rid = data.reminderId;
        const stored = rid ? reminders.find((r) => r.id === rid) : undefined;
        setAlarm({
          title: content.title || 'Reminder',
          body: content.body || '',
          reminderId: rid,
          enabled: stored ? stored.enabled : true,
        });
      }
    });
    return () => sub.remove();
  }, [reminders]);

  const handleDismiss = () => {
    setAlarm(null);
    reload();
  };

  const handleSnooze = async (minutes: number) => {
    const reminderId = alarm?.reminderId;
    setAlarm(null);
    if (reminderId) {
      await snoozeReminder(reminderId, minutes);
      showToast(`Snoozed ${minutes} min`);
    }
    reload();
  };

  const handleAlarmToggleEnabled = async (v: boolean) => {
    const rid = alarm?.reminderId;
    if (!v && rid) {
      // Toggle off in alarm -> disable reminder and close
      setAlarm(null);
      await setReminderEnabled(rid, false);
      showToast(t('reminder.cancelled'));
      reload();
    }
    // Toggling on in alarm is a no-op (reminder is already enabled since notification fired)
  };

  const toggleEnabled = async (id: string, enabled: boolean) => {
    await setReminderEnabled(id, enabled);
    if (!enabled) showToast(t('reminder.cancelled'));
    reload();
  };

  const reload = useCallback(async () => {
    try {
      await syncReminders();
      setReminders(await listReminders());
      setPermission(await hasPermissions());
      const trips = await tripApi.getAll();
      setPendingTrips(trips.filter((tr) => tr.paymentStatus !== 'Paid'));
    } catch (e) {
      console.error('Failed to load reminders', e);
    }
  }, []);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const customReminders = useMemo(() => reminders.filter((r) => r.kind === 'custom'), [reminders]);
  const paymentReminders = useMemo(() => reminders.filter((r) => r.kind === 'payment'), [reminders]);

  const openAdd = () => {
    const now = new Date();
    setTitle('');
    setDate(fmtDate(now));
    setTime(fmtTime(new Date(now.getTime() + 3600000)));
    setRepeat('none');
    setFormErr({});
    setShowAdd(true);
  };

  const scheduleCustom = async () => {
    const err: Record<string, string> = {};
    if (!title.trim()) err.title = t('reminder.titleRequired');
    if (!date) err.date = t('reminder.dateRequired');
    if (!time) err.time = t('reminder.timeRequired');
    setFormErr(err);
    if (Object.keys(err).length) return;
    try {
      await scheduleReminder({ title: title.trim(), body: title.trim(), date, time, repeat, kind: 'custom' });
      setShowAdd(false);
      showToast(t('reminder.scheduled'));
      reload();
    } catch (e: any) {
      setFormErr({ general: e?.message || 'Failed to schedule' });
      if (e?.message?.toLowerCase().includes('permission')) setPermission(false);
    }
  };

  const requestPermission = async () => {
    const granted = await ensurePermissions();
    setPermission(granted);
    if (granted) showToast(t('reminder.enableNotifications'));
  };

  const schedulePayment = async (tr: Trip, d: string, tm: string) => {
    const body = `${tr.material || 'Trip'} • ${tr.clientName || ''} — ₹${Number(tr.totalValue || 0).toLocaleString('en-IN')}`.trim();
    try {
      await scheduleReminder({
        title: 'Collect payment',
        body,
        date: d,
        time: tm,
        repeat: 'none',
        kind: 'payment',
        tripId: tr.id,
      });
      setPaymentTrip(null);
      setCustomMode(false);
      showToast(t('reminder.scheduled'));
      reload();
    } catch (e: any) {
      showToast(e?.message || 'Failed to schedule');
      if (e?.message?.toLowerCase().includes('permission')) setPermission(false);
    }
  };

  const openPayment = (tr: Trip) => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    setPayDate(fmtDate(d));
    setPayTime('09:00');
    setCustomMode(false);
    setPaymentTrip(tr);
  };

  const handlePreset = (tr: Trip, preset: '1h' | 't9' | 't6') => {
    if (preset === '1h') {
      const d = new Date(Date.now() + 3600000);
      schedulePayment(tr, fmtDate(d), fmtTime(d));
    } else if (preset === 't9') {
      const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0);
      schedulePayment(tr, fmtDate(d), '09:00');
    } else {
      const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(18, 0, 0, 0);
      schedulePayment(tr, fmtDate(d), '18:00');
    }
  };

  const cancel = async (id: string) => {
    await cancelReminder(id);
    showToast(t('reminder.cancelled'));
    reload();
  };

  return (
    <ScreenContainer safeArea padded={false} style={{ backgroundColor: '#F8FAFC' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <ScreenHeader title={t('reminder.title')} subtitle={t('reminder.subtitle')} actionLabel={t('reminder.addReminder')} onAction={openAdd} />

        {!permission && (
          <View style={styles.permissionCard}>
            <View style={styles.permissionIcon}><Ionicons name="notifications" size={22} color="#F59E0B" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.permissionTitle}>{t('reminder.enableNotifications')}</Text>
              <Text style={styles.permissionMsg}>{t('reminder.permissionMsg')}</Text>
            </View>
            <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission} activeOpacity={0.8}>
              <Text style={styles.permissionBtnText}>{t('common.confirm')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Segmented */}
        <View style={styles.segmented}>
          <TouchableOpacity style={[styles.segBtn, tab === 'custom' && styles.segBtnActive]} onPress={() => setTab('custom')} activeOpacity={0.8}>
            <Ionicons name="alarm-outline" size={16} color={tab === 'custom' ? '#fff' : '#475569'} />
            <Text style={[styles.segText, tab === 'custom' && styles.segTextActive]}>{t('reminder.custom')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.segBtn, tab === 'payments' && styles.segBtnActive]} onPress={() => setTab('payments')} activeOpacity={0.8}>
            <Ionicons name="card-outline" size={16} color={tab === 'payments' ? '#fff' : '#475569'} />
            <Text style={[styles.segText, tab === 'payments' && styles.segTextActive]}>{t('reminder.payments')}</Text>
          </TouchableOpacity>
        </View>

        {tab === 'custom' ? (
          customReminders.length === 0 ? (
            <View style={styles.empty}><Ionicons name="alarm-outline" size={48} color={colors.muted} /><Text style={styles.emptyText}>{t('reminder.noReminders')}</Text></View>
          ) : (
            <View style={{ paddingHorizontal: spacing.base, gap: 12 }}>
              {customReminders.map((r) => (
                <ReminderCard key={r.id} r={r} onToggle={(v) => toggleEnabled(r.id, v)} onMenu={() => setMenuReminder(r)} />
              ))}
            </View>
          )
        ) : (
          <View style={{ paddingHorizontal: spacing.base, gap: 12 }}>
            <Text style={styles.sectionTitle}>{t('reminder.pendingPayments')} ({pendingTrips.length})</Text>
            {pendingTrips.length === 0 ? (
              <View style={styles.empty}><Ionicons name="checkmark-circle-outline" size={48} color={colors.success} /><Text style={styles.emptyText}>{t('reminder.noPending')}</Text></View>
            ) : (
              pendingTrips.map((tr) => <PaymentTripCard key={tr.id} tr={tr} onRemind={() => openPayment(tr)} />)
            )}
            {paymentReminders.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Scheduled payment reminders</Text>
                {paymentReminders.map((r) => (
                  <ReminderCard key={r.id} r={r} onToggle={(v) => toggleEnabled(r.id, v)} onMenu={() => setMenuReminder(r)} />
                ))}
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Add custom reminder modal */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
          <View style={styles.overlay}><View style={styles.sheet}>
            <View style={styles.sheetHeader}><Text style={styles.sheetTitle}>{t('reminder.addReminder')}</Text><TouchableOpacity onPress={() => setShowAdd(false)}><Ionicons name="close" size={24} color={colors.textPrimary} /></TouchableOpacity></View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: spacing.base }}>
              {formErr.general ? <Text style={styles.generalError}>{formErr.general}</Text> : null}
              <AppInput label={t('reminder.titleLabel')} value={title} onChangeText={setTitle} placeholder={t('reminder.titlePlaceholder')} error={formErr.title} leftIcon={<Ionicons name="create-outline" size={18} color={colors.textSecondary} />} />
              <DatePicker label="Date" value={date} onChange={setDate} error={formErr.date} inline minYear={new Date().getFullYear()} maxYear={new Date().getFullYear() + 2} />
              <TimePicker label="Time" value={time} onChange={setTime} error={formErr.time} />

              <Text style={styles.label}>{t('reminder.repeat')}</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: spacing.base }}>
                {(['none', 'daily'] as const).map((rp) => (
                  <TouchableOpacity key={rp} style={[styles.repeatChip, repeat === rp && styles.repeatChipActive]} onPress={() => setRepeat(rp)} activeOpacity={0.8}>
                    <Text style={[styles.repeatChipText, repeat === rp && styles.repeatChipTextActive]}>{rp === 'daily' ? t('reminder.repeatDaily') : t('reminder.repeatNone')}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <AppButton title={t('common.save')} onPress={scheduleCustom} />
            </ScrollView>
          </View></View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Payment reminder modal */}
      <Modal visible={!!paymentTrip} transparent animationType="slide" onRequestClose={() => { setPaymentTrip(null); setCustomMode(false); }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
          <View style={styles.overlay}><View style={styles.sheet}>
            <View style={styles.sheetHeader}><Text style={styles.sheetTitle}>{t('reminder.remind')}</Text><TouchableOpacity onPress={() => { setPaymentTrip(null); setCustomMode(false); }}><Ionicons name="close" size={24} color={colors.textPrimary} /></TouchableOpacity></View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: spacing.base }}>
              {paymentTrip && (
                <View style={styles.tripSummary}>
                  <Text style={styles.tripSummaryTitle}>{paymentTrip.material || 'Trip'} • {paymentTrip.clientName || ''}</Text>
                  <Text style={styles.tripSummaryAmount}>₹{Number(paymentTrip.totalValue || 0).toLocaleString('en-IN')} {paymentTrip.paymentStatus ? `• ${paymentTrip.paymentStatus}` : ''}</Text>
                </View>
              )}

              {!customMode ? (
                <View style={{ gap: 4, marginBottom: spacing.base }}>
                  <PresetRow icon="time-outline" label={t('reminder.in1Hour')} onPress={() => paymentTrip && handlePreset(paymentTrip, '1h')} />
                  <PresetRow icon="sunny-outline" label={t('reminder.tomorrow9')} onPress={() => paymentTrip && handlePreset(paymentTrip, 't9')} />
                  <PresetRow icon="moon-outline" label={t('reminder.tomorrow6')} onPress={() => paymentTrip && handlePreset(paymentTrip, 't6')} />
                  <PresetRow icon="calendar-outline" label={t('reminder.customTime')} onPress={() => setCustomMode(true)} />
                </View>
              ) : (
                <View>
                  <DatePicker label="Date" value={payDate} onChange={setPayDate} inline minYear={new Date().getFullYear()} maxYear={new Date().getFullYear() + 2} />
                  <TimePicker label="Time" value={payTime} onChange={setPayTime} />
                  <AppButton title={t('common.save')} onPress={() => paymentTrip && schedulePayment(paymentTrip, payDate, payTime)} />
                </View>
              )}
            </ScrollView>
          </View></View>
        </KeyboardAvoidingView>
      </Modal>

      <ActionMenu
        visible={!!menuReminder}
        onClose={() => setMenuReminder(null)}
        items={
          menuReminder
            ? [
                { label: 'Toggle Off', icon: 'power-outline', onPress: () => { setReminderEnabled(menuReminder.id, false).then(reload); setMenuReminder(null); } },
                { label: 'Delete Reminder', icon: 'trash-outline', color: colors.error, divider: true, onPress: () => { cancel(menuReminder.id); setMenuReminder(null); } },
              ]
            : []
        }
      />

      <AlarmModal
        visible={!!alarm}
        title={alarm?.title || ''}
        body={alarm?.body || ''}
        enabled={alarm?.enabled ?? false}
        onDismiss={handleDismiss}
        onSnooze={handleSnooze}
        onToggleEnabled={handleAlarmToggleEnabled}
      />

      {toast ? (
        <View style={styles.toast} pointerEvents="none">
          <Ionicons name="checkmark-circle" size={18} color="#fff" />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}
    </ScreenContainer>
  );
}

function PresetRow({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={presetStyles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={presetStyles.left}><Ionicons name={icon} size={20} color="#2563EB" /><Text style={presetStyles.label}>{label}</Text></View>
      <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
    </TouchableOpacity>
  );
}

function ReminderCard({ r, onToggle, onMenu }: { r: Reminder; onToggle: (enabled: boolean) => void; onMenu: () => void }) {
  const active = r.enabled;
  const isPayment = r.kind === 'payment';
  const iconName = isPayment ? 'cash-outline' : 'bus-outline';
  const iconBg = isPayment ? '#FEF3C7' : '#E0E7FF';
  const iconColor = isPayment ? '#D97706' : '#4F46E5';
  const pillBg = active ? '#ECFDF5' : '#FEF3C7';
  const pillColor = active ? '#059669' : '#D97706';

  return (
    <View style={[cardStyles.card, !active && cardStyles.cardDisabled]}>
      <View style={[cardStyles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={iconName} size={24} color={iconColor} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={cardStyles.title} numberOfLines={1}>{r.title}</Text>
        <Text style={cardStyles.sub} numberOfLines={1}>{r.body}</Text>

        <View style={cardStyles.metaRow}>
          <Ionicons name="calendar-outline" size={14} color="#94A3B8" />
          <Text style={cardStyles.metaText}>{fmtDateDisplay(r.date)}</Text>
          <Ionicons name="time-outline" size={14} color="#94A3B8" style={{ marginLeft: 14 }} />
          <Text style={cardStyles.metaText}>{fmtTimeDisplay(r.time)}</Text>
        </View>

        <View style={[cardStyles.statusPill, { backgroundColor: pillBg, opacity: active ? 1 : 0.9 }]}>
          <Ionicons name={active ? 'notifications' : 'notifications-off-outline'} size={12} color={pillColor} />
          <Text style={[cardStyles.statusText, { color: pillColor }]}>{active ? 'Active' : 'Paused'}</Text>
        </View>
      </View>

      <View style={cardStyles.right}>
        <Switch value={r.enabled} onValueChange={onToggle} trackColor={{ false: '#CBD5E1', true: '#4F46E5' }} thumbColor="#fff" />
        <TouchableOpacity onPress={onMenu} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ padding: 4 }}>
          <Ionicons name="ellipsis-vertical" size={18} color="#64748B" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PaymentTripCard({ tr, onRemind }: { tr: Trip; onRemind: () => void }) {
  const statusColor = tr.paymentStatus === 'Partial' ? '#F59E0B' : '#EF4444';
  return (
    <View style={cardStyles.card}>
      <View style={[cardStyles.iconWrap, { backgroundColor: '#FEF2F2' }]}><Ionicons name="cash-outline" size={22} color="#EF4444" /></View>
      <View style={{ flex: 1 }}>
        <Text style={cardStyles.title} numberOfLines={1}>{tr.material || 'Trip'} • {tr.clientName || tr.truckNumber}</Text>
        <Text style={cardStyles.sub} numberOfLines={1}>₹{Number(tr.totalValue || 0).toLocaleString('en-IN')} <Text style={{ color: statusColor, fontWeight: '700' }}>• {tr.paymentStatus}</Text></Text>
      </View>
      <TouchableOpacity onPress={onRemind} style={cardStyles.remind} activeOpacity={0.8}><Ionicons name="notifications-outline" size={16} color="#fff" /><Text style={cardStyles.remindText}>Remind</Text></TouchableOpacity>
    </View>
  );
}

function fmtDate(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function fmtTime(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}
function fmtDateDisplay(iso: string) {
  if (!iso) return '';
  try { const d = new Date(iso); return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return iso; }
}
function fmtTimeDisplay(tm: string) {
  if (!tm) return '';
  const [h, m] = tm.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

const cardStyles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, gap: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  cardDisabled: { opacity: 0.55 },
  iconWrap: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  sub: { fontSize: 13, color: '#475569', marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  metaText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '700' },
  right: { alignItems: 'center', justifyContent: 'space-between', gap: 14, marginLeft: 12, alignSelf: 'stretch' },
  remind: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2563EB', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  remindText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});

const presetStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 4 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
});

const makeStyles = (colors: any) => StyleSheet.create({
  permissionCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: spacing.base, marginBottom: 16, backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA', borderRadius: 16, padding: 14 },
  permissionIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FED7AA', alignItems: 'center', justifyContent: 'center' },
  permissionTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  permissionMsg: { fontSize: 12, color: '#64748B', marginTop: 2 },
  permissionBtn: { backgroundColor: '#F59E0B', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  permissionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  segmented: { flexDirection: 'row', marginHorizontal: spacing.base, marginBottom: 16, backgroundColor: '#E2E8F0', borderRadius: 12, padding: 4 },
  segBtn: { flex: 1, flexDirection: 'row', gap: 6, paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segBtnActive: { backgroundColor: '#2563EB' },
  segText: { fontSize: 14, fontWeight: '700', color: '#475569' },
  segTextActive: { color: '#fff' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 12, padding: spacing.xl, marginTop: 12 },
  emptyText: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center' },
  label: { ...typography.label, color: colors.textPrimary, marginBottom: 6, marginTop: 4 },
  generalError: { ...typography.caption, color: colors.error, marginBottom: spacing.sm },
  repeatChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, backgroundColor: '#fff' },
  repeatChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  repeatChipText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  repeatChipTextActive: { color: '#fff' },
  tripSummary: { backgroundColor: colors.primarySurface, borderRadius: 12, padding: 14, marginBottom: spacing.base },
  tripSummaryTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  tripSummaryAmount: { fontSize: 13, color: colors.textSecondary, marginTop: 2, fontWeight: '600' },
  toast: { position: 'absolute', bottom: 100, left: spacing.base, right: spacing.base, backgroundColor: '#0F172A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 8 },
  toastText: { ...typography.bodySmall, color: '#fff', fontWeight: '700' },
  kav: { flex: 1 },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.base, paddingBottom: spacing.xl, maxHeight: '90%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.base },
  sheetTitle: { ...typography.headingSmall, color: colors.textPrimary },
});
