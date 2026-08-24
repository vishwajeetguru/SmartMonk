import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
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
import { driverStorage } from '../../services/storage/driverStorage';
import { Driver, BLOOD_GROUPS } from '../../types/driver';
import { useProfile } from '../../hooks/useProfile';
import { validation } from '../../utils/validation';

export default function DriversScreen() {
  const { user } = useAuth();
  const { profile, loadProfile } = useProfile();
  const [list, setList] = useState<Driver[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [fullName, setFullName] = useState('');
  const [contact, setContact] = useState('');
  const [bloodGroup, setBloodGroup] = useState<string>('');
  const [aadhar, setAadhar] = useState('');
  const [licence, setLicence] = useState('');
  const [address, setAddress] = useState('');
  const [salary, setSalary] = useState('');
  const [assignedVehicle, setAssignedVehicle] = useState('');
  const [saving, setSaving] = useState(false);
  const [showBlood, setShowBlood] = useState(false);
  const [showVehicle, setShowVehicle] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => { if (user?.id) setList(await driverStorage.getAll(user.id)); }, [user?.id]);
  useFocusEffect(useCallback(() => { load(); if (user?.id) loadProfile(user.id); }, [load, user?.id]));

  const openAdd = () => {
    setEditing(null); setFullName(''); setContact(''); setBloodGroup(''); setAadhar(''); setLicence(''); setAddress(''); setSalary(''); setAssignedVehicle(''); setErrors({}); setShowAdd(true);
  };
  const openEdit = (item: Driver) => {
    setEditing(item); setFullName(item.fullName); setContact(item.contact); setBloodGroup(item.bloodGroup || ''); setAadhar(item.aadhar || ''); setLicence(item.licence); setAddress(item.address || ''); setSalary(item.salary || ''); setAssignedVehicle(item.assignedVehicle || ''); setErrors({}); setShowAdd(true);
  };

  const validate = (): boolean => {
    const newErr: Record<string, string> = {};
    const nameRes = validation.name(fullName);
    if (!nameRes.isValid) newErr.fullName = nameRes.error!;
    const mobRes = validation.mobile(contact);
    if (!mobRes.isValid) newErr.contact = mobRes.error!;
    const aadharRes = validation.aadhar(aadhar);
    if (!aadharRes.isValid) newErr.aadhar = aadharRes.error!;
    const licRes = validation.licence(licence);
    if (!licRes.isValid) newErr.licence = licRes.error!;
    const others = list.filter((d) => d.id !== editing?.id);
    if (others.some((d) => d.contact.trim() === contact.trim())) newErr.contact = 'Contact already exists';
    if (aadhar.trim() && others.some((d) => d.aadhar?.trim() === aadhar.trim())) newErr.aadhar = 'Aadhar already exists';
    if (others.some((d) => d.licence.trim().toLowerCase() === licence.trim().toLowerCase())) newErr.licence = 'Licence already exists';
    setErrors(newErr);
    return Object.keys(newErr).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !user?.id) return;
    setSaving(true);
    if (editing) {
      await driverStorage.update(editing.id, { fullName, contact, bloodGroup: bloodGroup as any, aadhar, licence, address, salary, assignedVehicle });
      setSuccessMsg('Driver updated successfully');
    } else {
      await driverStorage.add(user.id, { fullName, contact, bloodGroup: bloodGroup as any, aadhar, licence, address, salary, assignedVehicle });
      setSuccessMsg('Driver added successfully');
    }
    setShowAdd(false); setSaving(false); setShowSuccess(true); load();
  };
  const handleDelete = async () => { if (!deleteId) return; await driverStorage.remove(deleteId); setDeleteId(null); load(); };
  const vehicles = profile?.vehicles || [];

  return (
    <ScreenContainer safeArea style={{ backgroundColor: colors.background }}>
      <View style={styles.header}><Text style={styles.title}>Drivers</Text><TouchableOpacity style={styles.addBtn} onPress={openAdd}><Ionicons name="add" size={22} color={colors.white} /></TouchableOpacity></View>
      {list.length === 0 ? <View style={styles.empty}><Ionicons name="people-outline" size={48} color={colors.muted} /><Text style={styles.emptyText}>No drivers yet. Tap + to add.</Text></View> : (
        <FlatList data={list} keyExtractor={(i) => i.id} contentContainerStyle={{ padding: spacing.base, paddingBottom: 100, gap: 10 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.fullName}</Text>
                <Text style={styles.cardSub}>{item.contact}{item.bloodGroup ? ` • ${item.bloodGroup}` : ''}</Text>
                <Text style={styles.cardSub2}>Lic: {item.licence}{item.assignedVehicle ? ` • Vehicle: ${item.assignedVehicle}` : ''}</Text>
                {item.aadhar ? <Text style={styles.cardSub2}>Aadhar: {item.aadhar}</Text> : null}
                {item.salary ? <Text style={styles.cardSub2}>Salary: ₹{item.salary}</Text> : null}
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
          <View style={styles.overlay}><View style={[styles.sheet, { maxHeight: '90%' }]}>
            <View style={styles.sheetHeader}><Text style={styles.sheetTitle}>{editing ? 'Edit Driver' : 'Add Driver'}</Text><TouchableOpacity onPress={() => setShowAdd(false)}><Ionicons name="close" size={24} color={colors.textPrimary} /></TouchableOpacity></View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: spacing.base }}>
              <AppInput label="Full Name *" value={fullName} onChangeText={setFullName} placeholder="Driver name" error={errors.fullName} />
              <AppInput label="Contact Number *" value={contact} onChangeText={setContact} placeholder="Phone" keyboardType="phone-pad" error={errors.contact} />
              <Text style={styles.label}>Blood Group</Text>
              <TouchableOpacity style={styles.picker} onPress={() => setShowBlood(true)}><Text style={bloodGroup ? styles.pickerText : styles.pickerPlaceholder}>{bloodGroup || 'Select blood group'}</Text><Ionicons name="chevron-down" size={18} color={colors.textSecondary} /></TouchableOpacity>
              <AppInput label="Aadhar Card" value={aadhar} onChangeText={setAadhar} placeholder="12-digit Aadhar" keyboardType="numeric" error={errors.aadhar} />
              <AppInput label="Driving Licence *" value={licence} onChangeText={setLicence} placeholder="Licence number" error={errors.licence} autoCapitalize="characters" />
              <AppInput label="Address" value={address} onChangeText={setAddress} placeholder="Address" />
              <AppInput label="Salary" value={salary} onChangeText={setSalary} placeholder="Monthly salary" keyboardType="numeric" />
              <Text style={styles.label}>Assign to Vehicle</Text>
              <TouchableOpacity style={styles.picker} onPress={() => setShowVehicle(true)}><Text style={assignedVehicle ? styles.pickerText : styles.pickerPlaceholder}>{assignedVehicle || (vehicles.length ? 'Select vehicle' : 'No vehicles - add in profile')}</Text><Ionicons name="chevron-down" size={18} color={colors.textSecondary} /></TouchableOpacity>
              <View style={{ height: 12 }} />
              <AppButton title={editing ? 'Update Driver' : 'Save Driver'} onPress={handleSave} loading={saving} />
            </ScrollView>
          </View></View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showBlood} transparent animationType="fade" onRequestClose={() => setShowBlood(false)}>
        <TouchableOpacity style={styles.overlayCenter} activeOpacity={1} onPress={() => setShowBlood(false)}>
          <View style={[styles.smallSheet, { maxHeight: '80%' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="water" size={18} color={colors.error} />
              </View>
              <View>
                <Text style={styles.smallTitle}>Select Blood Group</Text>
                <Text style={{ ...typography.caption, color: colors.textSecondary }}>All 8 groups available</Text>
              </View>
            </View>
            <View style={styles.bloodGrid}>
              {BLOOD_GROUPS.map((b) => (
                <TouchableOpacity key={b} style={[styles.bloodChip, bloodGroup === b && styles.bloodChipActive]} onPress={() => { setBloodGroup(b); setShowBlood(false); }}>
                  <Ionicons name="water" size={14} color={bloodGroup === b ? colors.white : colors.error} />
                  <Text style={[styles.bloodChipText, bloodGroup === b && styles.bloodChipTextActive]}>{b}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.clearRow} onPress={() => { setBloodGroup(''); setShowBlood(false); }}>
              <Ionicons name="close-circle-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.clearText}>Clear Selection</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showVehicle} transparent animationType="fade" onRequestClose={() => setShowVehicle(false)}>
        <TouchableOpacity style={styles.overlayCenter} activeOpacity={1} onPress={() => setShowVehicle(false)}>
          <View style={[styles.smallSheet, { maxHeight: '80%' }]}>
            <Text style={styles.smallTitle}>Assign Vehicle — {vehicles.length} available</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
              <TouchableOpacity style={styles.option} onPress={() => { setAssignedVehicle(''); setShowVehicle(false); }}><Text style={styles.optionText}>None</Text>{!assignedVehicle && <Ionicons name="checkmark" size={18} color={colors.primary} />}</TouchableOpacity>
              {vehicles.length === 0 ? (
                <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                  <Ionicons name="car-outline" size={32} color={colors.muted} />
                  <Text style={{ ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center', marginTop: 8 }}>No vehicles found.{'\n'}Add vehicles in Profile → Edit Profile → Fleet step.</Text>
                </View>
              ) : (
                vehicles.map((v) => (
                  <TouchableOpacity key={v.id} style={styles.option} onPress={() => { setAssignedVehicle(v.number); setShowVehicle(false); }}><Text style={styles.optionText}>{v.number}</Text>{assignedVehicle === v.number && <Ionicons name="checkmark" size={18} color={colors.primary} />}</TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <ConfirmationModal visible={!!deleteId} title="Delete Driver" message="Are you sure you want to delete this driver? This cannot be undone." confirmText="Delete" icon="trash-outline" iconColor={colors.error} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
      <SuccessModal visible={showSuccess} title={successMsg} onClose={() => setShowSuccess(false)} />
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
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.base, paddingBottom: spacing.xl },
  smallSheet: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.base },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.base },
  sheetTitle: { ...typography.headingSmall, color: colors.textPrimary },
  smallTitle: { ...typography.body, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 },
  label: { ...typography.label, color: colors.textPrimary, marginBottom: 6, marginTop: 4 },
  picker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 14, backgroundColor: colors.white, marginBottom: 12 },
  pickerText: { ...typography.body, color: colors.textPrimary },
  pickerPlaceholder: { ...typography.body, color: colors.textTertiary },
  option: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  optionText: { ...typography.body, color: colors.textPrimary },
  bloodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 8 },
  bloodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 72,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    justifyContent: 'center',
  },
  bloodChipActive: { backgroundColor: colors.error, borderColor: colors.error },
  bloodChipText: { ...typography.bodySmall, fontWeight: '700', color: colors.textPrimary },
  bloodChipTextActive: { color: colors.white },
  clearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, marginTop: 8, borderTopWidth: 1, borderTopColor: colors.borderLight },
  clearText: { ...typography.bodySmall, color: colors.textSecondary, fontWeight: '600' },
});
