import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { SuccessModal } from '../../components/ui/SuccessModal';
import { useAuth } from '../../hooks/useAuth';
import { tripStorage } from '../../services/storage/tripStorage';
import { Trip } from '../../types/trip';
import { useProfile } from '../../hooks/useProfile';

export default function TripsScreen() {
  const { user } = useAuth();
  const { profile, loadProfile } = useProfile();
  const [list, setList] = useState<Trip[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Trip | null>(null);
  const [title, setTitle] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDateModal, setShowDateModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [tempYear, setTempYear] = useState(new Date().getFullYear());
  const [tempMonth, setTempMonth] = useState(new Date().getMonth() + 1);
  const [tempDay, setTempDay] = useState(new Date().getDate());

  const load = useCallback(async () => { if (user?.id) setList(await tripStorage.getAll(user.id)); }, [user?.id]);
  useFocusEffect(useCallback(() => { load(); if (user?.id) loadProfile(user.id); }, [load, user?.id]));

  const openAdd = () => { setEditing(null); setTitle(''); setFrom(''); setTo(''); setDate(new Date().toISOString().slice(0, 10)); setVehicleNumber(''); setAmount(''); setErrors({}); setShowAdd(true); };
  const openEdit = (item: Trip) => { setEditing(item); setTitle(item.title); setFrom(item.from); setTo(item.to); setDate(item.date); setVehicleNumber(item.vehicleNumber); setAmount(item.amount || ''); setErrors({}); setShowAdd(true); };
  const openDatePicker = () => {
    if (date) { const p = date.split('-'); if (p.length === 3) { setTempYear(parseInt(p[0]) || new Date().getFullYear()); setTempMonth(parseInt(p[1]) || 1); setTempDay(parseInt(p[2]) || 1); } }
    setShowDateModal(true);
  };
  const confirmDate = () => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const d = new Date(tempYear, tempMonth, 0).getDate();
    const safe = Math.min(tempDay, d);
    setDate(`${tempYear}-${pad(tempMonth)}-${pad(safe)}`); setShowDateModal(false);
  };
  const formatDisplay = (v: string) => { if (!v) return 'Select date'; const [y, m, d] = v.split('-'); const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; return `${d} ${months[parseInt(m) - 1] || m} ${y}`; };

  const validate = (): boolean => {
    const newErr: Record<string, string> = {};
    if (!title.trim()) newErr.title = 'Title required';
    if (!from.trim()) newErr.from = 'From required';
    if (!to.trim()) newErr.to = 'To required';
    if (!date.trim()) newErr.date = 'Date required';
    if (!vehicleNumber.trim()) newErr.vehicleNumber = 'Vehicle required';
    if (amount && isNaN(Number(amount))) newErr.amount = 'Amount must be number';
    setErrors(newErr);
    return Object.keys(newErr).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !user?.id) return;
    setSaving(true);
    if (editing) { await tripStorage.update(editing.id, { title, from, to, date, vehicleNumber, amount }); setSuccessMsg('Trip updated successfully'); }
    else { await tripStorage.add(user.id, { title, from, to, date, vehicleNumber, amount }); setSuccessMsg('Trip added successfully'); }
    setShowAdd(false); setSaving(false); setShowSuccess(true); load();
  };
  const handleDelete = async () => { if (!deleteId) return; await tripStorage.remove(deleteId); setDeleteId(null); load(); };
  const vehicles = profile?.vehicles || [];

  return (
    <ScreenContainer safeArea style={{ backgroundColor: colors.background }}>
      <View style={styles.header}><Text style={styles.title}>Trips</Text><TouchableOpacity style={styles.addBtn} onPress={openAdd}><Ionicons name="add" size={22} color={colors.white} /></TouchableOpacity></View>
      {list.length === 0 ? <View style={styles.empty}><Ionicons name="navigate-outline" size={48} color={colors.muted} /><Text style={styles.emptyText}>No trips yet. Tap + to add your first trip.</Text></View> : (
        <FlatList data={list} keyExtractor={(i) => i.id} contentContainerStyle={{ padding: spacing.base, paddingBottom: 100, gap: 10 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSub}>{item.from} → {item.to} • {item.date}</Text>
                <Text style={styles.cardSub2}>{item.vehicleNumber}{item.amount ? ` • ₹${item.amount}` : ''}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconBtn}><Ionicons name="pencil-outline" size={18} color={colors.primary} /></TouchableOpacity>
                <TouchableOpacity onPress={() => setDeleteId(item.id)} style={styles.iconBtn}><Ionicons name="trash-outline" size={18} color={colors.error} /></TouchableOpacity>
              </View>
            </View>
          )} />
      )}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
          <View style={styles.overlay}><View style={styles.sheet}>
            <View style={styles.sheetHeader}><Text style={styles.sheetTitle}>{editing ? 'Edit Trip' : 'Add Trip'}</Text><TouchableOpacity onPress={() => setShowAdd(false)}><Ionicons name="close" size={24} color={colors.textPrimary} /></TouchableOpacity></View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: spacing.base }}>
              <AppInput label="Title *" value={title} onChangeText={setTitle} placeholder="e.g. Mumbai to Pune" error={errors.title} />
              <View style={{ flexDirection: 'row', gap: 10 }}><View style={{ flex: 1 }}><AppInput label="From *" value={from} onChangeText={setFrom} placeholder="Origin" error={errors.from} /></View><View style={{ flex: 1 }}><AppInput label="To *" value={to} onChangeText={setTo} placeholder="Destination" error={errors.to} /></View></View>
              <Text style={styles.label}>Date *</Text>
              <TouchableOpacity style={[styles.picker, errors.date && { borderColor: colors.error }]} onPress={openDatePicker}><Text style={date ? styles.pickerText : styles.pickerPlaceholder}>{formatDisplay(date)}</Text><Ionicons name="calendar-outline" size={18} color={colors.textSecondary} /></TouchableOpacity>
              {errors.date ? <Text style={styles.errorText}>{errors.date}</Text> : null}
              <Text style={styles.label}>Vehicle *</Text>
              <TouchableOpacity style={[styles.picker, errors.vehicleNumber && { borderColor: colors.error }]} onPress={() => setShowVehicleModal(true)}><Text style={vehicleNumber ? styles.pickerText : styles.pickerPlaceholder}>{vehicleNumber || (vehicles.length ? 'Select vehicle' : 'No vehicles')}</Text><Ionicons name="chevron-down" size={18} color={colors.textSecondary} /></TouchableOpacity>
              {errors.vehicleNumber ? <Text style={styles.errorText}>{errors.vehicleNumber}</Text> : null}
              <AppInput label="Amount" value={amount} onChangeText={setAmount} placeholder="Optional" keyboardType="numeric" error={errors.amount} />
              <AppButton title={editing ? 'Update Trip' : 'Save Trip'} onPress={handleSave} loading={saving} />
            </ScrollView>
          </View></View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showDateModal} transparent animationType="fade" onRequestClose={() => setShowDateModal(false)}>
        <View style={styles.overlay}><View style={styles.dateModal}>
          <View style={styles.sheetHeader}><Text style={styles.sheetTitle}>Select Date</Text><TouchableOpacity onPress={() => setShowDateModal(false)}><Ionicons name="close" size={24} color={colors.textPrimary} /></TouchableOpacity></View>
          {(() => {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const years = Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - 5 + i);
            const daysInMonth = new Date(tempYear, tempMonth, 0).getDate();
            const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
            const safeDay = Math.min(tempDay, daysInMonth);
            return (
              <View style={styles.dateRow}>
                <View style={styles.dateCol}><Text style={styles.dateLabel}>Day</Text><ScrollView style={styles.dateScroll}>{days.map((d) => (<TouchableOpacity key={d} style={[styles.dateItem, safeDay === d && styles.dateItemActive]} onPress={() => setTempDay(d)}><Text style={[styles.dateText, safeDay === d && styles.dateTextActive]}>{String(d).padStart(2, '0')}</Text></TouchableOpacity>))}</ScrollView></View>
                <View style={styles.dateCol}><Text style={styles.dateLabel}>Month</Text><ScrollView style={styles.dateScroll}>{months.map((m, idx) => (<TouchableOpacity key={m} style={[styles.dateItem, tempMonth === idx + 1 && styles.dateItemActive]} onPress={() => setTempMonth(idx + 1)}><Text style={[styles.dateText, tempMonth === idx + 1 && styles.dateTextActive]}>{m}</Text></TouchableOpacity>))}</ScrollView></View>
                <View style={styles.dateCol}><Text style={styles.dateLabel}>Year</Text><ScrollView style={styles.dateScroll}>{years.map((y) => (<TouchableOpacity key={y} style={[styles.dateItem, tempYear === y && styles.dateItemActive]} onPress={() => setTempYear(y)}><Text style={[styles.dateText, tempYear === y && styles.dateTextActive]}>{y}</Text></TouchableOpacity>))}</ScrollView></View>
              </View>
            );
          })()}
          <View style={styles.dateFooter}><TouchableOpacity style={styles.cancelBtn} onPress={() => setShowDateModal(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity><TouchableOpacity style={styles.confirmBtn} onPress={confirmDate}><Text style={styles.confirmText}>Confirm</Text></TouchableOpacity></View>
        </View></View>
      </Modal>

      <Modal visible={showVehicleModal} transparent animationType="fade" onRequestClose={() => setShowVehicleModal(false)}>
        <TouchableOpacity style={styles.overlayCenter} activeOpacity={1} onPress={() => setShowVehicleModal(false)}><View style={styles.smallSheet}>
          <Text style={styles.smallTitle}>Select Vehicle</Text>
          {vehicles.length === 0 ? <Text style={{ ...typography.bodySmall, color: colors.textSecondary, paddingVertical: 8 }}>No vehicles found. Add vehicles in Profile setup.</Text> : vehicles.map((v) => (
            <TouchableOpacity key={v.id} style={styles.option} onPress={() => { setVehicleNumber(v.number); setShowVehicleModal(false); }}><Text style={styles.optionText}>{v.number}</Text>{vehicleNumber === v.number && <Ionicons name="checkmark" size={18} color={colors.primary} />}</TouchableOpacity>
          ))}
        </View></TouchableOpacity>
      </Modal>

      <ConfirmationModal visible={!!deleteId} title="Delete Trip" message="Are you sure you want to delete this trip?" confirmText="Delete" icon="trash-outline" iconColor={colors.error} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
      <SuccessModal visible={showSuccess} title={successMsg} message={editing ? 'Your trip has been updated.' : 'Your trip has been saved and can be reused anywhere.'} onClose={() => setShowSuccess(false)} />
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, paddingTop: spacing.sm, paddingBottom: spacing.xs },
  title: { ...typography.headingSmall, color: colors.textPrimary },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: spacing.xl },
  emptyText: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.base, borderWidth: 1, borderColor: colors.border, gap: 12 },
  cardTitle: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
  cardSub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  cardSub2: { ...typography.caption, color: colors.textTertiary, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.backgroundSecondary, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderLight },
  kav: { flex: 1 },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  overlayCenter: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.xl },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.base, paddingBottom: spacing.xl, maxHeight: '85%' },
  smallSheet: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.base },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.base },
  sheetTitle: { ...typography.headingSmall, color: colors.textPrimary },
  label: { ...typography.label, color: colors.textPrimary, marginBottom: 6 },
  picker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 14, backgroundColor: colors.white, marginBottom: 4 },
  pickerText: { ...typography.body, color: colors.textPrimary },
  pickerPlaceholder: { ...typography.body, color: colors.textTertiary },
  errorText: { ...typography.caption, color: colors.error, marginBottom: 8 },
  dateModal: { backgroundColor: colors.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.base, paddingBottom: spacing.xl, maxHeight: '70%' },
  dateRow: { flexDirection: 'row', gap: 8, height: 260 },
  dateCol: { flex: 1, borderWidth: 1, borderColor: colors.borderLight, borderRadius: radius.md, overflow: 'hidden' },
  dateLabel: { ...typography.labelSmall, color: colors.textSecondary, textAlign: 'center', paddingVertical: 6, backgroundColor: colors.backgroundSecondary, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  dateScroll: { flex: 1 },
  dateItem: { paddingVertical: 10, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  dateItemActive: { backgroundColor: colors.primary },
  dateText: { ...typography.bodySmall, color: colors.textPrimary },
  dateTextActive: { color: colors.white, fontWeight: '700' },
  dateFooter: { flexDirection: 'row', gap: 10, marginTop: spacing.base },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center' },
  cancelText: { ...typography.button, color: colors.textPrimary },
  confirmBtn: { flex: 1, paddingVertical: 14, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center' },
  confirmText: { ...typography.button, color: colors.white },
  option: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  optionText: { ...typography.body, color: colors.textPrimary },
  smallTitle: { ...typography.body, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 },
});
