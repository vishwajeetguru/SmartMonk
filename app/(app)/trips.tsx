import React, { useCallback, useState, useMemo } from 'react';
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
import { DatePicker } from '../../components/ui/DatePicker';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { SuccessModal } from '../../components/ui/SuccessModal';
import { tripApi } from '../../services/api/trips';
import { supplierApi } from '../../services/api/suppliers';
import { Trip, PAYMENT_STATUSES, PaymentStatus } from '../../types/trip';
import { Supplier } from '../../types/supplier';
import { useProfile } from '../../hooks/useProfile';

export default function TripsScreen() {
  const { profile, loadProfile } = useProfile();
  const [list, setList] = useState<Trip[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Trip | null>(null);

  const [truckNumber, setTruckNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [material, setMaterial] = useState('');
  const [materialPrice, setMaterialPrice] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [clientName, setClientName] = useState('');
  const [tripsCount, setTripsCount] = useState(1);
  const [location, setLocation] = useState('');
  const [totalValue, setTotalValue] = useState('0');
  const [profit, setProfit] = useState('0');
  const [totalExpense, setTotalExpense] = useState('0');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Pending');

  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [showTruckPicker, setShowTruckPicker] = useState(false);
  const [showMaterialPicker, setShowMaterialPicker] = useState(false);
  const [showSupplierPicker, setShowSupplierPicker] = useState(false);
  const [showPaymentPicker, setShowPaymentPicker] = useState(false);

  const vehicles = profile?.vehicles || [];
  const materials = useMemo(() => {
    const set = new Set<string>();
    suppliers.forEach((s) => { if (s.material) set.add(s.material.trim()); });
    return Array.from(set);
  }, [suppliers]);

  const load = useCallback(async () => {
    try {
      const [trips, sups] = await Promise.all([tripApi.getAll(), supplierApi.getAll()]);
      setList(trips);
      setSuppliers(sups);
    } catch (e) {
      console.error(e);
    }
  }, []);
  useFocusEffect(useCallback(() => { load(); loadProfile(''); }, [load]));

  const openAdd = () => {
    setEditing(null);
    const singleTruck = vehicles.length === 1 ? vehicles[0].number : '';
    setTruckNumber(singleTruck);
    setDate(new Date().toISOString().slice(0, 10));
    setMaterial(''); setMaterialPrice(''); setSupplierName(''); setClientName(''); setTripsCount(1); setLocation(''); setTotalValue('0'); setProfit('0'); setTotalExpense('0'); setPaymentStatus('Pending');
    setErrors({}); setShowTruckPicker(false); setShowMaterialPicker(false); setShowSupplierPicker(false); setShowPaymentPicker(false); setShowAdd(true);
  };
  const openEdit = (item: Trip) => {
    setEditing(item);
    setTruckNumber(item.truckNumber || item.vehicleNumber || '');
    setDate(item.date);
    setMaterial(item.material || '');
    setMaterialPrice(item.materialPrice || '');
    setSupplierName(item.supplierName || '');
    setClientName(item.clientName || '');
    setTripsCount(item.tripsCount || 1);
    setLocation(item.location || '');
    setTotalValue(item.totalValue || '0');
    setProfit(item.profit || '0');
    setTotalExpense(item.totalExpense || '0');
    setPaymentStatus(item.paymentStatus || 'Pending');
    setErrors({}); setShowAdd(true);
  };

  const validate = (): boolean => {
    const newErr: Record<string, string> = {};
    if (!truckNumber.trim()) newErr.truckNumber = 'Select truck';
    if (!date.trim()) newErr.date = 'Date required';
    if (!material.trim()) newErr.material = 'Material required';
    if (materialPrice && isNaN(Number(materialPrice))) newErr.materialPrice = 'Must be number';
    if (!supplierName.trim()) newErr.supplierName = 'Supplier required';
    if (!clientName.trim()) newErr.clientName = 'Client required';
    if (!location.trim()) newErr.location = 'Location required';
    if (totalValue && isNaN(Number(totalValue))) newErr.totalValue = 'Must be number';
    if (profit && isNaN(Number(profit))) newErr.profit = 'Must be number';
    if (totalExpense && isNaN(Number(totalExpense))) newErr.totalExpense = 'Must be number';
    setErrors(newErr);
    return Object.keys(newErr).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const data: any = {
        truckNumber: truckNumber.trim(),
        date,
        material: material.trim(),
        materialPrice: materialPrice.trim(),
        supplierName: supplierName.trim(),
        clientName: clientName.trim(),
        tripsCount,
        location: location.trim(),
        totalValue: totalValue.trim() || '0',
        profit: profit.trim() || '0',
        totalExpense: totalExpense.trim() || '0',
        paymentStatus,
        vehicleNumber: truckNumber.trim(),
        amount: totalValue.trim() || '0',
      };
      if (editing) {
        await tripApi.update(editing.id, data);
        setSuccessMsg('Trip updated successfully');
      } else {
        await tripApi.add(data);
        setSuccessMsg('Trip added successfully');
      }
      setShowAdd(false); setShowSuccess(true); load();
    } catch (e: any) {
      setErrors({ material: e?.message || 'Failed to save trip' });
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await tripApi.remove(deleteId);
    } catch {}
    setDeleteId(null); load();
  };

  const renderTruckField = () => {
    if (vehicles.length === 0) {
      return (
        <View>
          <Text style={styles.label}>Select Truck *</Text>
          <View style={[styles.picker, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={styles.pickerPlaceholder}>No trucks — add in Profile</Text>
            <Ionicons name="car-outline" size={18} color={colors.textTertiary} />
          </View>
          {errors.truckNumber ? <Text style={styles.errorText}>{errors.truckNumber}</Text> : null}
        </View>
      );
    }
    if (vehicles.length === 1) {
      return (
        <View>
          <Text style={styles.label}>Select Truck *</Text>
          <View style={styles.singleTruck}>
            <Ionicons name="car-sport" size={20} color={colors.primary} />
            <Text style={styles.singleTruckText}>{vehicles[0].number}</Text>
            <View style={styles.singleBadge}><Text style={styles.singleBadgeText}>Only 1 available</Text></View>
          </View>
        </View>
      );
    }
    return (
      <View>
        <Text style={styles.label}>Select Truck *</Text>
        <TouchableOpacity style={[styles.picker, errors.truckNumber && { borderColor: colors.error }]} onPress={() => setShowTruckPicker((v) => !v)} activeOpacity={0.7}>
          <Text style={truckNumber ? styles.pickerText : styles.pickerPlaceholder}>{truckNumber || `Select from ${vehicles.length} trucks`}</Text>
          <Ionicons name={showTruckPicker ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        {showTruckPicker && (
          <View style={styles.inlineDropdown}>
            <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {vehicles.map((v) => (
                <TouchableOpacity key={v.id} style={styles.option} onPress={() => { setTruckNumber(v.number); setShowTruckPicker(false); }}>
                  <Text style={styles.optionText}>{v.number}</Text>{truckNumber === v.number && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        {errors.truckNumber ? <Text style={styles.errorText}>{errors.truckNumber}</Text> : null}
      </View>
    );
  };

  return (
    <ScreenContainer safeArea style={{ backgroundColor: colors.background }}>
      <View style={styles.header}><Text style={styles.title}>Trips</Text><TouchableOpacity style={styles.addBtn} onPress={openAdd}><Ionicons name="add" size={22} color={colors.white} /></TouchableOpacity></View>
      {list.length === 0 ? <View style={styles.empty}><Ionicons name="navigate-outline" size={48} color={colors.muted} /><Text style={styles.emptyText}>No trips yet. Tap + to add.</Text></View> : (
        <FlatList data={list} keyExtractor={(i) => i.id} contentContainerStyle={{ padding: spacing.base, paddingBottom: 100, gap: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => openEdit(item)} activeOpacity={0.7}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.material} • {item.truckNumber}</Text>
                <Text style={styles.cardSub}>{item.supplierName} → {item.clientName} • {item.date} (x{item.tripsCount})</Text>
                <Text style={styles.cardSub2}>{item.location} • ₹{item.totalValue} | Profit ₹{item.profit} | Exp ₹{item.totalExpense} • {item.paymentStatus}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconBtn}><Ionicons name="pencil-outline" size={18} color={colors.primary} /></TouchableOpacity>
                <TouchableOpacity onPress={() => setDeleteId(item.id)} style={styles.iconBtn}><Ionicons name="trash-outline" size={18} color={colors.error} /></TouchableOpacity>
              </View>
            </TouchableOpacity>
          )} />
      )}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
          <View style={styles.overlay}><View style={styles.sheet}>
            <View style={styles.sheetHeader}><Text style={styles.sheetTitle}>{editing ? 'Edit Trip' : 'Add Trip'}</Text><TouchableOpacity onPress={() => setShowAdd(false)}><Ionicons name="close" size={24} color={colors.textPrimary} /></TouchableOpacity></View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: spacing.base }}>
              {renderTruckField()}
              <DatePicker
                label="Trip Date *"
                value={date}
                onChange={setDate}
                placeholder="Select date"
                error={errors.date}
                minYear={new Date().getFullYear() - 5}
                maxYear={new Date().getFullYear() + 5}
                displayFormat="MM_DD_YYYY"
                inline
              />

              <Text style={styles.label}>Material *</Text>
              <TouchableOpacity style={[styles.picker, errors.material && { borderColor: colors.error }]} onPress={() => setShowMaterialPicker((v) => !v)} activeOpacity={0.7}>
                <Text style={material ? styles.pickerText : styles.pickerPlaceholder}>{material || (materials.length ? 'Select material' : 'No materials — add supplier first')}</Text><Ionicons name={showMaterialPicker ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              {showMaterialPicker && (
                <View style={styles.inlineDropdown}>
                  <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                    {materials.length === 0 ? <Text style={{ ...typography.bodySmall, color: colors.textSecondary, paddingVertical: 8 }}>No materials — add material in Suppliers first</Text> : materials.map((m) => (
                      <TouchableOpacity key={m} style={styles.option} onPress={() => { setMaterial(m); setShowMaterialPicker(false); }}><Text style={styles.optionText}>{m}</Text>{material === m && <Ionicons name="checkmark" size={18} color={colors.primary} />}</TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
              {errors.material ? <Text style={styles.errorText}>{errors.material}</Text> : null}

              <AppInput label="Material Price" value={materialPrice} onChangeText={(t) => setMaterialPrice(t.replace(/[^0-9.]/g, ''))} placeholder="Only numbers" keyboardType="numeric" error={errors.materialPrice} leftIcon={<Ionicons name="cash-outline" size={18} color={colors.textSecondary} />} />

              <Text style={styles.label}>Supplier Name *</Text>
              <TouchableOpacity style={[styles.picker, errors.supplierName && { borderColor: colors.error }]} onPress={() => setShowSupplierPicker((v) => !v)} activeOpacity={0.7}>
                <Text style={supplierName ? styles.pickerText : styles.pickerPlaceholder}>{supplierName || (suppliers.length ? 'Select supplier' : 'No suppliers')}</Text><Ionicons name={showSupplierPicker ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              {showSupplierPicker && (
                <View style={styles.inlineDropdown}>
                  <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                    {suppliers.length === 0 ? <Text style={{ ...typography.bodySmall, color: colors.textSecondary, paddingVertical: 8 }}>No suppliers — add in Suppliers tab</Text> : suppliers.map((s) => (
                      <TouchableOpacity key={s.id} style={styles.option} onPress={() => { setSupplierName(s.name); setShowSupplierPicker(false); }}><View><Text style={styles.optionText}>{s.name}</Text>{s.material ? <Text style={{ ...typography.caption, color: colors.textSecondary }}>{s.material}</Text> : null}</View>{supplierName === s.name && <Ionicons name="checkmark" size={18} color={colors.primary} />}</TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
              {errors.supplierName ? <Text style={styles.errorText}>{errors.supplierName}</Text> : null}

              <AppInput label="Client Name *" value={clientName} onChangeText={setClientName} placeholder="Add manually" error={errors.clientName} leftIcon={<Ionicons name="person-outline" size={18} color={colors.textSecondary} />} />

              <Text style={styles.label}>Trips Count</Text>
              <View style={styles.counterRow}>
                <TouchableOpacity style={styles.counterBtn} onPress={() => setTripsCount((c) => Math.max(1, c - 1))}><Ionicons name="remove" size={20} color={colors.primary} /></TouchableOpacity>
                <View style={styles.counterValue}><Text style={styles.counterText}>{tripsCount}</Text></View>
                <TouchableOpacity style={styles.counterBtn} onPress={() => setTripsCount((c) => c + 1)}><Ionicons name="add" size={20} color={colors.white} /></TouchableOpacity>
              </View>

              <AppInput label="Location *" value={location} onChangeText={setLocation} placeholder="Input field" error={errors.location} leftIcon={<Ionicons name="location-outline" size={18} color={colors.textSecondary} />} />

              <View style={styles.financialCard}>
                <Text style={styles.financialTitle}>FINANCIAL DETAILS</Text>
                <AppInput label="Total Value (₹)" value={totalValue} onChangeText={(t) => setTotalValue(t.replace(/[^0-9.]/g, ''))} placeholder="0" keyboardType="numeric" error={errors.totalValue} />
                <AppInput label="Profit (₹)" value={profit} onChangeText={(t) => setProfit(t.replace(/[^0-9.-]/g, ''))} placeholder="0" keyboardType="numeric" error={errors.profit} />
                <AppInput label="Total Expense (₹)" value={totalExpense} onChangeText={(t) => setTotalExpense(t.replace(/[^0-9.]/g, ''))} placeholder="0" keyboardType="numeric" error={errors.totalExpense} />
              </View>

              <Text style={styles.label}>Payment Status</Text>
              <TouchableOpacity style={styles.picker} onPress={() => setShowPaymentPicker((v) => !v)} activeOpacity={0.7}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[styles.statusDot, { backgroundColor: paymentStatus === 'Paid' ? colors.success : paymentStatus === 'Partial' ? colors.warning : colors.textTertiary }]} />
                  <Text style={styles.pickerText}>{paymentStatus}</Text>
                </View>
                <Ionicons name={showPaymentPicker ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              {showPaymentPicker && (
                <View style={styles.inlineDropdown}>
                  {PAYMENT_STATUSES.map((p) => (
                    <TouchableOpacity key={p} style={styles.option} onPress={() => { setPaymentStatus(p); setShowPaymentPicker(false); }}><Text style={styles.optionText}>{p}</Text>{paymentStatus === p && <Ionicons name="checkmark" size={18} color={colors.primary} />}</TouchableOpacity>
                  ))}
                </View>
              )}

              <AppButton title={editing ? 'Update Trip' : 'Save Trip'} onPress={handleSave} loading={saving} />
            </ScrollView>
          </View></View>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmationModal visible={!!deleteId} title="Delete Trip" message="Are you sure you want to delete this trip?" confirmText="Delete" icon="trash-outline" iconColor={colors.error} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
      <SuccessModal visible={showSuccess} title={successMsg} message="Your trip has been saved." onClose={() => setShowSuccess(false)} />
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
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.base, paddingBottom: spacing.xl, maxHeight: '90%' },
  smallSheet: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.base },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.base },
  sheetTitle: { ...typography.headingSmall, color: colors.textPrimary },
  label: { ...typography.label, color: colors.textPrimary, marginBottom: 6, marginTop: 4 },
  picker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 14, backgroundColor: colors.white, marginBottom: 4 },
  pickerText: { ...typography.body, color: colors.textPrimary },
  pickerPlaceholder: { ...typography.body, color: colors.textTertiary },
  errorText: { ...typography.caption, color: colors.error, marginBottom: 8 },
  inlineDropdown: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.base, marginTop: -4, maxHeight: 220 },
  inlineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm, paddingBottom: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  inlineTitle: { ...typography.labelSmall, color: colors.textSecondary, fontWeight: '600' },
  singleTruck: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.primarySurface, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 14, marginBottom: 8 },
  singleTruckText: { ...typography.body, fontWeight: '700', color: colors.primary, flex: 1 },
  singleBadge: { backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full },
  singleBadgeText: { ...typography.caption, color: colors.white, fontWeight: '700', fontSize: 10 },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  counterBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  counterValue: { minWidth: 60, paddingVertical: 10, paddingHorizontal: 16, borderRadius: radius.md, backgroundColor: colors.primarySurface, borderWidth: 1, borderColor: colors.primary, alignItems: 'center' },
  counterText: { ...typography.headingSmall, color: colors.primary, textAlign: 'center' },
  financialCard: { borderWidth: 2, borderColor: colors.textPrimary, borderRadius: radius.lg, padding: spacing.base, marginVertical: spacing.base, backgroundColor: colors.white },
  financialTitle: { ...typography.labelSmall, color: colors.textSecondary, letterSpacing: 0.8, marginBottom: spacing.sm },
  dateRow: { flexDirection: 'row', gap: 8, height: 200 },
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
  statusDot: { width: 10, height: 10, borderRadius: 5 },
});
