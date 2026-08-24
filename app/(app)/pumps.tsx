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
import { pumpStorage } from '../../services/storage/pumpStorage';
import { Pump } from '../../types/pump';
import { validation } from '../../utils/validation';

export default function PumpsScreen() {
  const { user } = useAuth();
  const [list, setList] = useState<Pump[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Pump | null>(null);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; contact?: string; location?: string }>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const load = useCallback(async () => { if (user?.id) setList(await pumpStorage.getAll(user.id)); }, [user?.id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openAdd = () => { setEditing(null); setName(''); setContact(''); setLocation(''); setErrors({}); setShowAdd(true); };
  const openEdit = (item: Pump) => { setEditing(item); setName(item.name); setContact(item.contact); setLocation(item.location); setErrors({}); setShowAdd(true); };

  const validate = (): boolean => {
    const newErr: any = {};
    if (!name.trim()) newErr.name = 'Please enter pump name';
    if (!validation.mobile(contact).isValid) newErr.contact = validation.mobile(contact).error;
    if (!location.trim()) newErr.location = 'Please enter location';
    const others = list.filter((p) => p.id !== editing?.id);
    if (others.some((p) => p.name.trim().toLowerCase() === name.trim().toLowerCase())) newErr.name = 'Pump name already exists';
    if (others.some((p) => p.contact.trim() === contact.trim())) newErr.contact = 'Contact already exists';
    setErrors(newErr);
    return Object.keys(newErr).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !user?.id) return;
    setSaving(true);
    if (editing) { await pumpStorage.update(editing.id, { name, contact, location }); setSuccessMsg('Pump updated successfully'); }
    else { await pumpStorage.add(user.id, { name, contact, location }); setSuccessMsg('Pump added successfully'); }
    setShowAdd(false); setSaving(false); setShowSuccess(true); load();
  };
  const handleDelete = async () => { if (!deleteId) return; await pumpStorage.remove(deleteId); setDeleteId(null); load(); };

  return (
    <ScreenContainer safeArea style={{ backgroundColor: colors.background }}>
      <View style={styles.header}><Text style={styles.title}>Petrol Pumps</Text><TouchableOpacity style={styles.addBtn} onPress={openAdd}><Ionicons name="add" size={22} color={colors.white} /></TouchableOpacity></View>
      {list.length === 0 ? <View style={styles.empty}><Ionicons name="flame-outline" size={48} color={colors.muted} /><Text style={styles.emptyText}>No pumps yet. Tap + to add.</Text></View> : (
        <FlatList data={list} keyExtractor={(i) => i.id} contentContainerStyle={{ padding: spacing.base, paddingBottom: 100, gap: 10 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardLeft}><View style={[styles.avatar, { backgroundColor: '#FEF3C7' }]}><Ionicons name="flame" size={20} color={colors.warning} /></View><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{item.name}</Text><Text style={styles.cardSub}>{item.contact} • {item.location}</Text></View></View>
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
            <View style={styles.sheetHeader}><Text style={styles.sheetTitle}>{editing ? 'Edit Pump' : 'Add Petrol Pump'}</Text><TouchableOpacity onPress={() => setShowAdd(false)}><Ionicons name="close" size={24} color={colors.textPrimary} /></TouchableOpacity></View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: spacing.base }}>
              <AppInput label="Pump Name *" value={name} onChangeText={setName} placeholder="e.g. HP Petrol Pump" error={errors.name} />
              <AppInput label="Contact Number *" value={contact} onChangeText={setContact} placeholder="Phone" keyboardType="phone-pad" error={errors.contact} />
              <AppInput label="Location *" value={location} onChangeText={setLocation} placeholder="Area / City" error={errors.location} />
              <AppButton title={editing ? 'Update Pump' : 'Save Pump'} onPress={handleSave} loading={saving} />
            </ScrollView>
          </View></View>
        </KeyboardAvoidingView>
      </Modal>
      <ConfirmationModal visible={!!deleteId} title="Delete Pump" message="Are you sure you want to delete this pump?" confirmText="Delete" icon="trash-outline" iconColor={colors.error} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
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
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
  cardSub: { ...typography.caption, color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.backgroundSecondary, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderLight },
  kav: { flex: 1 },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.base, paddingBottom: spacing.xl, maxHeight: '85%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.base },
  sheetTitle: { ...typography.headingSmall, color: colors.textPrimary },
});
