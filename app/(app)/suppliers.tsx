import React, { useCallback, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { SuccessModal } from '../../components/ui/SuccessModal';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { StatCard, StatsGrid } from '../../components/ui/StatCard';
import { SearchFilterBar, FilterOption } from '../../components/ui/SearchFilterBar';
import { ActionMenu, ActionMenuItem } from '../../components/ui/ActionMenu';
import { supplierApi } from '../../services/api/suppliers';
import { Supplier } from '../../types/supplier';
import { validation } from '../../utils/validation';
import { copyToClipboard, shareOnWhatsApp } from '../../utils/share';

export default function SuppliersScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { t } = useTranslation();
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

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [menuSupplier, setMenuSupplier] = useState<Supplier | null>(null);
  const [showCopied, setShowCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      setList(await supplierApi.getAll());
    } catch (e: any) {
      console.error('Failed to load suppliers', e);
    }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const materialOptions = useMemo<FilterOption[]>(() => {
    const set = new Set<string>();
    list.forEach((s) => { if (s.material) set.add(s.material.trim()); });
    return Array.from(set).map((m) => ({ label: m, value: m }));
  }, [list]);

  const stats = useMemo(() => {
    const total = list.length;
    const materials = new Set<string>();
    list.forEach((s) => { if (s.material) materials.add(s.material.trim()); });
    const thisMonth = list.filter((s) => isThisMonth(s.createdAt)).length;
    const withAddress = list.filter((s) => s.address?.trim()).length;
    return { total, materials: materials.size, thisMonth, withAddress };
  }, [list]);

  const filtered = useMemo(() => {
    let r = list;
    if (filter !== 'All') r = r.filter((s) => (s.material || '').trim() === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((s) =>
        [s.name, s.contact, s.material, s.address].some((v) => (v || '').toLowerCase().includes(q))
      );
    }
    return r;
  }, [list, filter, search]);

  const openAdd = () => { setEditing(null); setName(''); setContact(''); setMaterial(''); setAddress(''); setErrors({}); setShowAdd(true); };
  const openEdit = (item: Supplier) => { setMenuSupplier(null); setEditing(item); setName(item.name); setContact(item.contact); setMaterial(item.material || ''); setAddress(item.address || ''); setErrors({}); setShowAdd(true); };

  const validate = (): boolean => {
    const nameRes = validation.name(name);
    const mobRes = validation.mobile(contact);
    const newErr: any = {};
    if (!nameRes.isValid) newErr.name = nameRes.error;
    if (!mobRes.isValid) newErr.contact = mobRes.error;
    if (material && material.trim().length < 2) newErr.material = 'Material too short';
    const others = list.filter((s) => s.id !== editing?.id);
    if (others.some((s) => s.contact.trim() === contact.trim())) newErr.contact = 'Contact already exists';
    if (others.some((s) => s.name.trim().toLowerCase() === name.trim().toLowerCase())) newErr.name = 'Supplier name already exists';
    setErrors(newErr);
    return Object.keys(newErr).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) {
        await supplierApi.update(editing.id, { name, contact, material, address });
        setSuccessMsg(t('list.supplierUpdated'));
      } else {
        await supplierApi.add({ name, contact, material, address });
        setSuccessMsg(t('list.supplierAdded'));
      }
      setShowAdd(false); setShowSuccess(true); load();
    } catch (e: any) {
      const msg = e?.message || 'Failed to save supplier';
      setErrors({ name: msg });
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await supplierApi.remove(deleteId);
    } catch (e) {
      console.error(e);
    }
    setDeleteId(null); setMenuSupplier(null); load();
  };

  const formatSupplier = (s: Supplier): string => [
    `🏭 Supplier: ${s.name}`,
    `📞 Contact: ${s.contact}`,
    `🧱 Material: ${s.material || '-'}`,
    `📍 Address: ${s.address || '-'}`,
  ].join('\n');

  const handleCopySupplier = async (s: Supplier) => {
    setMenuSupplier(null);
    const ok = await copyToClipboard(formatSupplier(s));
    if (ok) { setShowCopied(true); setTimeout(() => setShowCopied(false), 2200); }
  };
  const handleShareSupplier = async (s: Supplier) => {
    setMenuSupplier(null);
    await shareOnWhatsApp(formatSupplier(s));
  };

  const menuItems: ActionMenuItem[] = menuSupplier
    ? [
        { label: 'Edit Supplier', icon: 'pencil-outline', onPress: () => openEdit(menuSupplier) },
        { label: 'Share on WhatsApp', icon: 'logo-whatsapp', color: '#25D366', onPress: () => handleShareSupplier(menuSupplier) },
        { label: 'Copy details', icon: 'copy-outline', onPress: () => handleCopySupplier(menuSupplier) },
        { label: 'Delete Supplier', icon: 'trash-outline', color: colors.error, divider: true, onPress: () => { setDeleteId(menuSupplier.id); setMenuSupplier(null); } },
      ]
    : [];

  return (
    <ScreenContainer safeArea padded={false} style={{ backgroundColor: '#F8FAFC' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <ScreenHeader
          title={t('screen.suppliers')}
          subtitle="Manage your material suppliers"
          actionLabel="Add Supplier"
          onAction={openAdd}
        />

        <StatsGrid>
          <StatCard icon="people" iconBg="#EFF6FF" iconColor="#2563EB" value={String(stats.total)} label="Total Suppliers" />
          <StatCard icon="cube" iconBg="#ECFDF5" iconColor="#10B981" value={String(stats.materials)} label="Materials" />
          <StatCard icon="calendar" iconBg="#FFF7ED" iconColor="#F59E0B" value={String(stats.thisMonth)} label="This Month" />
          <StatCard icon="location" iconBg="#F5F3FF" iconColor="#7C3AED" value={String(stats.withAddress)} label="With Address" />
        </StatsGrid>

        <SearchFilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name, contact or material..."
          filter={filter}
          onFilterChange={setFilter}
          filterOptions={materialOptions}
          filterTitle="Filter by Material"
        />

        {filtered.length === 0 ? (
          <View style={styles.empty}><Ionicons name="cube-outline" size={48} color={colors.muted} /><Text style={styles.emptyText}>{search || filter !== 'All' ? 'No suppliers match filter' : t('list.suppliersEmpty')}</Text></View>
        ) : (
          <View style={{ paddingHorizontal: spacing.base, gap: 12 }}>
            {filtered.map((item) => (
              <SupplierCard key={item.id} item={item} onMenu={() => setMenuSupplier(item)} onPress={() => openEdit(item)} />
            ))}
          </View>
        )}
      </ScrollView>

      <ActionMenu visible={!!menuSupplier} onClose={() => setMenuSupplier(null)} items={menuItems} />

      {showCopied && (
        <View style={styles.toast} pointerEvents="none">
          <Ionicons name="checkmark-circle" size={18} color="#fff" />
          <Text style={styles.toastText}>Copied to clipboard</Text>
        </View>
      )}

      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
          <View style={styles.overlay}><View style={styles.sheet}>
            <View style={styles.sheetHeader}><Text style={styles.sheetTitle}>{editing ? t('list.editSupplier') : t('list.addSupplier')}</Text><TouchableOpacity onPress={() => setShowAdd(false)}><Ionicons name="close" size={24} color={colors.textPrimary} /></TouchableOpacity></View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: spacing.base }}>
              <AppInput label={`${t('form.supplierName')} *`} value={name} onChangeText={setName} placeholder={t('form.supplierNamePlaceholder')} error={errors.name} />
              <AppInput label={`${t('form.supplierContact')} *`} value={contact} onChangeText={setContact} placeholder={t('form.supplierContactPlaceholder')} keyboardType="phone-pad" error={errors.contact} />
              <AppInput label={t('form.supplierMaterial')} value={material} onChangeText={setMaterial} placeholder={t('form.supplierMaterialPlaceholder')} error={errors.material} leftIcon={<Ionicons name="cube-outline" size={18} color={colors.textSecondary} />} />
              <AppInput label={t('form.supplierAddress')} value={address} onChangeText={setAddress} placeholder={t('form.locationPlaceholder')} />
              <AppButton title={editing ? t('list.updateSupplier') : t('list.saveSupplier')} onPress={handleSave} loading={saving} />
            </ScrollView>
          </View></View>
        </KeyboardAvoidingView>
      </Modal>
      <ConfirmationModal visible={!!deleteId} title={t('list.deleteSupplier')} message={t('list.deleteSupplierMsg')} confirmText={t('common.delete')} cancelText={t('common.cancel')} icon="trash-outline" iconColor={colors.error} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
      <SuccessModal visible={showSuccess} title={successMsg} onClose={() => setShowSuccess(false)} />
    </ScreenContainer>
  );
}

function SupplierCard({ item, onMenu, onPress }: { item: Supplier; onMenu: () => void; onPress: () => void }) {
  return (
    <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={cardStyles.topRow}>
        <View style={cardStyles.avatar}><Text style={cardStyles.avatarText}>{item.name[0]?.toUpperCase()}</Text></View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={cardStyles.name} numberOfLines={1}>{item.name}</Text>
            <TouchableOpacity onPress={onMenu} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ padding: 4 }}>
              <Ionicons name="ellipsis-vertical" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>
          {item.material ? (
            <View style={cardStyles.pill}><Text style={cardStyles.pillText} numberOfLines={1}>{item.material}</Text></View>
          ) : null}
        </View>
      </View>

      <View style={{ gap: 8, marginTop: 12 }}>
        <View style={cardStyles.infoRow}><Ionicons name="call-outline" size={16} color="#475569" /><Text style={cardStyles.infoText}>{item.contact}</Text></View>
        {item.address ? (
          <View style={cardStyles.infoRow}><Ionicons name="location-outline" size={16} color="#475569" /><Text style={cardStyles.infoText} numberOfLines={1}>{item.address}</Text></View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

function isThisMonth(iso: string) {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

const cardStyles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#2563EB' },
  name: { fontSize: 16, fontWeight: '800', color: '#0F172A', flex: 1 },
  pill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#EFF6FF', marginTop: 6 },
  pillText: { fontSize: 12, fontWeight: '700', color: '#1D4ED8' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 13, color: '#475569', fontWeight: '500', flex: 1 },
});

const makeStyles = (colors: any) => StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center', gap: 12, padding: spacing.xl, marginTop: 20 },
  emptyText: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center' },
  toast: {
    position: 'absolute', bottom: 100, left: spacing.base, right: spacing.base,
    backgroundColor: '#0F172A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 8,
  },
  toastText: { ...typography.bodySmall, color: '#fff', fontWeight: '700' },
  kav: { flex: 1 },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.base, paddingBottom: spacing.xl, maxHeight: '85%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.base },
  sheetTitle: { ...typography.headingSmall, color: colors.textPrimary },
});
