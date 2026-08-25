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
import { supplierStorage } from '../../services/storage/supplierStorage';
import { Supplier } from '../../types/supplier';
import { validation } from '../../utils/validation';

export default function SuppliersScreen() {
  const { user } = useAuth();
  const [list, setList] = useState<Supplier[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [material, setMaterial] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; contact?: string; material?: string }>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const load = useCallback(async () => { if (user?.id) setList(await supplierStorage.getAll(user.id)); }, [user?.id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openAdd = () => { setEditing(null); setName(''); setContact(''); setMaterial(''); setAddress(''); setErrors({}); setShowAdd(true); };
  const openEdit = (item: Supplier) => { setEditing(item); setName(item.name); setContact(item.contact); setMaterial(item.material || ''); setAddress(item.address || ''); setErrors({}); setShowAdd(true); };

  const validate = (): boolean => {
    const nameRes = validation.name(name);
    const mobRes = validation.mobile(contact);
    const newErr: any = {};
    if (!nameRes.isValid) newErr.name = nameRes.error;
    if (!mobRes.isValid) newErr.contact = mobRes.error;
    if (material && material.trim().length < 2) newErr.material = 'Material too short';
    // duplicate check (name or contact)
    const others = list.filter((s) => s.id !== editing?.id);
    if (others.some((s) => s.contact.trim() === contact.trim())) newErr.contact = 'Contact already exists';
    if (others.some((s) => s.name.trim().toLowerCase() === name.trim().toLowerCase())) newErr.name = 'Supplier name already exists';
    setErrors(newErr);
    return Object.keys(newErr).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (!user?.id) return;
    setSaving(true);
    if (editing) {
      await supplierStorage.update(editing.id, { name, contact, material, address });
      setSuccessMsg('Supplier updated successfully');
    } else {
      await supplierStorage.add(user.id, { name, contact, material, address });
      setSuccessMsg('Supplier added successfully');
    }
    setShowAdd(false); setSaving(false); setShowSuccess(true); load();
  };
  const handleDelete = async () => {
    if (!deleteId) return;
    await supplierStorage.remove(deleteId);
    setDeleteId(null); load();
  };

  return (
    <ScreenContainer safeArea style={{ backgroundColor: colors.background }}>
      <View style={styles.header}>
        <Text style={styles.title}>Suppliers</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}><Ionicons name="add" size={22} color={colors.white} /></TouchableOpacity>
      </View>
      {list.length === 0 ? (
        <View style={styles.empty}><Ionicons name="cube-outline" size={48} color={colors.muted} /><Text style={styles.emptyText}>No suppliers yet. Tap + to add.</Text></View>
      ) : (
        <FlatList data={list} keyExtractor={(i) => i.id} contentContainerStyle={{ padding: spacing.base, paddingBottom: 100, gap: 10 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardLeft}><View style={styles.avatar}><Text style={styles.avatarText}>{item.name[0]?.toUpperCase()}</Text></View><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{item.name}</Text><Text style={styles.cardSub}>{item.contact}{item.material ? ` • ${item.material}` : ''}</Text>{item.address ? <Text style={styles.cardSub2}>{item.address}</Text> : null}</View></View>
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
            <View style={styles.sheetHeader}><Text style={styles.sheetTitle}>{editing ? 'Edit Supplier' : 'Add Supplier'}</Text><TouchableOpacity onPress={() => setShowAdd(false)}><Ionicons name="close" size={24} color={colors.textPrimary} /></TouchableOpacity></View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: spacing.base }}>
              <AppInput label="Name *" value={name} onChangeText={setName} placeholder="Supplier name" error={errors.name} />
              <AppInput label="Contact *" value={contact} onChangeText={setContact} placeholder="Phone number" keyboardType="phone-pad" error={errors.contact} />
              <AppInput label="Material" value={material} onChangeText={setMaterial} placeholder="e.g. Cement, Steel" error={errors.material} leftIcon={<Ionicons name="cube-outline" size={18} color={colors.textSecondary} />} />
              <AppInput label="Address" value={address} onChangeText={setAddress} placeholder="Optional address" />
              <AppButton title={editing ? 'Update Supplier' : 'Save Supplier'} onPress={handleSave} loading={saving} />
            </ScrollView>
          </View></View>
        </KeyboardAvoidingView>
      </Modal>
      <ConfirmationModal visible={!!deleteId} title="Delete Supplier" message="Are you sure you want to delete this supplier?" confirmText="Delete" cancelText="Cancel" icon="trash-outline" iconColor={colors.error} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
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
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySurface, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...typography.body, fontWeight: '700', color: colors.primary },
  cardTitle: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
  cardSub: { ...typography.caption, color: colors.textSecondary },
  cardSub2: { ...typography.caption, color: colors.textTertiary },
  actions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.backgroundSecondary, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderLight },
  kav: { flex: 1 },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.base, paddingBottom: spacing.xl, maxHeight: '85%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.base },
  sheetTitle: { ...typography.headingSmall, color: colors.textPrimary },
});
