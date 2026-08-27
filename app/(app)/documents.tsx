import React, { useCallback, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../theme/ThemeContext';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { DatePicker } from '../../components/ui/DatePicker';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { SuccessModal } from '../../components/ui/SuccessModal';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { StatCard, StatsGrid } from '../../components/ui/StatCard';
import { SearchFilterBar, FilterOption } from '../../components/ui/SearchFilterBar';
import { ActionMenu, ActionMenuItem } from '../../components/ui/ActionMenu';
import { documentApi } from '../../services/api/documents';
import { VehicleDocument, DOCUMENT_TYPES, DocumentType } from '../../types/vehicleDocument';
import { useProfile } from '../../hooks/useProfile';
import { scheduleReminder } from '../../services/notifications/reminderService';

const TYPE_META: Record<DocumentType, { icon: any; color: string; bg: string }> = {
  RC: { icon: 'document-text', color: '#2563EB', bg: '#EFF6FF' },
  Insurance: { icon: 'shield-checkmark', color: '#059669', bg: '#ECFDF5' },
  Permit: { icon: 'map', color: '#7C3AED', bg: '#F5F3FF' },
  PUC: { icon: 'leaf', color: '#0891B2', bg: '#ECFEFF' },
  Fitness: { icon: 'checkmark-circle', color: '#D97706', bg: '#FFF7ED' },
};

function expiryStatus(expiresAt: string): { label: string; color: string; bg: string; days: number } {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const exp = new Date(expiresAt);
  const diff = Math.ceil((exp.getTime() - now.getTime()) / 86400000);
  if (diff < 0) return { label: `Expired ${Math.abs(diff)}d ago`, color: '#DC2626', bg: '#FEF2F2', days: diff };
  if (diff <= 30) return { label: `Expires in ${diff}d`, color: '#D97706', bg: '#FFF7ED', days: diff };
  return { label: `${diff}d left`, color: '#059669', bg: '#ECFDF5', days: diff };
}

export default function DocumentsScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { profile, loadProfile } = useProfile();
  const [list, setList] = useState<VehicleDocument[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<VehicleDocument | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [type, setType] = useState<DocumentType>('RC');
  const [docNumber, setDocNumber] = useState('');
  const [issuedOn, setIssuedOn] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [notes, setNotes] = useState('');
  const [showVehicle, setShowVehicle] = useState(false);
  const [showType, setShowType] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [menuDoc, setMenuDoc] = useState<VehicleDocument | null>(null);
  const [showCopied, setShowCopied] = useState(false);

  const vehicles = profile?.vehicles || [];
  const typeFilters: FilterOption[] = DOCUMENT_TYPES.map((t) => ({ label: t, value: t, dotColor: TYPE_META[t].color }));

  const load = useCallback(async () => {
    try { setList(await documentApi.getAll()); } catch {}
  }, []);
  useFocusEffect(useCallback(() => { load(); loadProfile(''); }, [load]));

  const filtered = useMemo(() => {
    let r = list;
    if (filter !== 'All') r = r.filter((d) => d.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((d) => [d.vehicleNumber, d.type, d.docNumber, d.notes].some((v) => (v || '').toLowerCase().includes(q)));
    }
    return [...r].sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
  }, [list, filter, search]);

  const stats = useMemo(() => {
    const expired = list.filter((d) => expiryStatus(d.expiresAt).days < 0).length;
    const soon = list.filter((d) => { const s = expiryStatus(d.expiresAt); return s.days >= 0 && s.days <= 30; }).length;
    const valid = list.length - expired - soon;
    return { total: list.length, expired, soon, valid };
  }, [list]);

  const openAdd = () => {
    setEditing(null); setVehicleNumber(vehicles[0]?.number || ''); setType('RC'); setDocNumber(''); setIssuedOn(''); setExpiresAt(''); setNotes(''); setErrors({}); setShowAdd(true);
  };
  const openEdit = (item: VehicleDocument) => {
    setMenuDoc(null); setEditing(item); setVehicleNumber(item.vehicleNumber); setType(item.type); setDocNumber(item.docNumber || ''); setIssuedOn(item.issuedOn || ''); setExpiresAt(item.expiresAt); setNotes(item.notes || ''); setErrors({}); setShowAdd(true);
  };

  const validate = (): boolean => {
    const err: Record<string, string> = {};
    if (!vehicleNumber.trim()) err.vehicleNumber = 'Select vehicle';
    if (!type) err.type = 'Select type';
    if (!expiresAt) err.expiresAt = 'Expiry date required';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const maybeScheduleExpiryReminder = async (doc: VehicleDocument) => {
    try {
      const exp = new Date(doc.expiresAt);
      const remindAt = new Date(exp.getTime() - 7 * 86400000);
      if (remindAt.getTime() <= Date.now()) return;
      const date = remindAt.toISOString().slice(0, 10);
      const hh = String(remindAt.getHours()).padStart(2, '0');
      const mm = String(remindAt.getMinutes()).padStart(2, '0');
      await scheduleReminder({
        title: `${doc.type} expiry: ${doc.vehicleNumber}`,
        body: `${doc.type} for ${doc.vehicleNumber} expires on ${doc.expiresAt}`,
        date, time: `${hh}:${mm}`, repeat: 'none', kind: 'custom',
      });
    } catch {}
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      let saved: VehicleDocument;
      const payload: any = { vehicleNumber: vehicleNumber.trim(), type, docNumber: docNumber.trim() || null, issuedOn: issuedOn || null, expiresAt, notes: notes.trim() || null };
      if (editing) saved = await documentApi.update(editing.id, payload);
      else saved = await documentApi.add(payload);
      await maybeScheduleExpiryReminder(saved);
      setShowAdd(false); setSuccessMsg(editing ? 'Document updated' : 'Document added'); setShowSuccess(true); load();
    } catch (e: any) { setErrors({ vehicleNumber: e?.message || 'Failed' }); }
  };

  const handleDelete = async () => { if (!deleteId) return; try { await documentApi.remove(deleteId); } catch {} setDeleteId(null); setMenuDoc(null); load(); };
  const formatDoc = (d: VehicleDocument) => `Document: ${d.type} - ${d.vehicleNumber}\nNo: ${d.docNumber || '-'}\nExpires: ${d.expiresAt}\nNotes: ${d.notes || '-'}`;
  const handleCopy = async (d: VehicleDocument) => { await Clipboard.setStringAsync(formatDoc(d)); setMenuDoc(null); setShowCopied(true); setTimeout(() => setShowCopied(false), 2000); };
  const handleShare = async (d: VehicleDocument) => { const { Linking } = require('react-native'); Linking.openURL(`https://wa.me/?text=${encodeURIComponent(formatDoc(d))}`).catch(() => {}); setMenuDoc(null); };

  const menuItems: ActionMenuItem[] = menuDoc ? [
    { label: 'Edit Document', icon: 'pencil-outline', onPress: () => openEdit(menuDoc) },
    { label: 'Share on WhatsApp', icon: 'logo-whatsapp', color: '#25D366', onPress: () => handleShare(menuDoc) },
    { label: 'Copy details', icon: 'copy-outline', onPress: () => handleCopy(menuDoc) },
    { label: 'Delete Document', icon: 'trash-outline', color: colors.error, divider: true, onPress: () => { setDeleteId(menuDoc.id); setMenuDoc(null); } },
  ] : [];

  return (
    <ScreenContainer safeArea padded={false} style={{ backgroundColor: '#F8FAFC' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <ScreenHeader title="Documents" subtitle="RC, Insurance, Permit, PUC, Fitness" actionLabel="Add Document" onAction={openAdd} />

        <StatsGrid>
          <StatCard icon="document-text" iconBg="#EFF6FF" iconColor="#2563EB" value={String(stats.total)} label="Total Docs" />
          <StatCard icon="alert-circle" iconBg="#FEF2F2" iconColor="#DC2626" value={String(stats.expired)} label="Expired" />
          <StatCard icon="warning" iconBg="#FFF7ED" iconColor="#D97706" value={String(stats.soon)} label="Expiring Soon" />
          <StatCard icon="checkmark-circle" iconBg="#ECFDF5" iconColor="#059669" value={String(stats.valid)} label="Valid" />
        </StatsGrid>

        <SearchFilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Search by vehicle, type, number..." filter={filter} onFilterChange={setFilter} filterOptions={typeFilters} filterTitle="Filter by Type" />

        {filtered.length === 0 ? (
          <View style={styles.empty}><Ionicons name="document-text-outline" size={48} color={colors.muted} /><Text style={styles.emptyText}>No documents yet</Text></View>
        ) : (
          <View style={{ paddingHorizontal: spacing.base, gap: 12 }}>
            {filtered.map((item) => {
              const st = expiryStatus(item.expiresAt);
              const meta = TYPE_META[item.type];
              return (
                <TouchableOpacity key={item.id} style={styles.card} onPress={() => openEdit(item)} activeOpacity={0.85}>
                  <View style={styles.cardTop}>
                    <View style={[styles.avatar, { backgroundColor: meta.bg }]}><Ionicons name={meta.icon as any} size={22} color={meta.color} /></View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={styles.cardTitle}>{item.type}</Text>
                        <View style={[styles.vehPill]}><Text style={styles.vehText}>{item.vehicleNumber}</Text></View>
                      </View>
                      <Text style={styles.cardSub} numberOfLines={1}>{item.docNumber || 'No number'}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setMenuDoc(item)} hitSlop={10} style={{ padding: 4 }}><Ionicons name="ellipsis-vertical" size={18} color="#64748B" /></TouchableOpacity>
                  </View>
                  <View style={{ gap: 6, marginTop: 10 }}>
                    <View style={styles.infoRow}><Ionicons name="calendar-outline" size={14} color="#475569" /><Text style={styles.infoText}>Expires: {new Date(item.expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Text></View>
                    {item.notes ? <View style={styles.infoRow}><Ionicons name="document-text-outline" size={14} color="#475569" /><Text style={styles.infoText} numberOfLines={1}>{item.notes}</Text></View> : null}
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: st.bg }]}><View style={[styles.dot, { backgroundColor: st.color }]} /><Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text></View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <ActionMenu visible={!!menuDoc} onClose={() => setMenuDoc(null)} items={menuItems} />
      {showCopied && <View style={styles.toast} pointerEvents="none"><Ionicons name="checkmark-circle" size={18} color="#fff" /><Text style={styles.toastText}>Copied</Text></View>}

      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
          <View style={styles.overlay}><View style={styles.sheet}>
            <View style={styles.sheetHeader}><Text style={styles.sheetTitle}>{editing ? 'Edit Document' : 'Add Document'}</Text><TouchableOpacity onPress={() => setShowAdd(false)}><Ionicons name="close" size={24} color={colors.textPrimary} /></TouchableOpacity></View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: spacing.base }}>
              <Text style={styles.label}>Vehicle *</Text>
              <TouchableOpacity style={[styles.picker, errors.vehicleNumber && { borderColor: colors.error }]} onPress={() => setShowVehicle((v) => !v)} activeOpacity={0.7}>
                <Text style={vehicleNumber ? styles.pickerText : styles.pickerPlaceholder}>{vehicleNumber || (vehicles.length ? 'Select vehicle' : 'No vehicles')}</Text><Ionicons name={showVehicle ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              {showVehicle && (
                <View style={styles.inlineDropdown}>
                  <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled>
                    {vehicles.map((v) => (
                      <TouchableOpacity key={v.id} style={styles.option} onPress={() => { setVehicleNumber(v.number); setShowVehicle(false); }}><Text style={styles.optionText}>{v.number}</Text>{vehicleNumber === v.number && <Ionicons name="checkmark" size={18} color={colors.primary} />}</TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
              {errors.vehicleNumber ? <Text style={styles.errorText}>{errors.vehicleNumber}</Text> : null}

              <Text style={styles.label}>Document Type *</Text>
              <TouchableOpacity style={[styles.picker, errors.type && { borderColor: colors.error }]} onPress={() => setShowType((v) => !v)} activeOpacity={0.7}>
                <Text style={styles.pickerText}>{type}</Text><Ionicons name={showType ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              {showType && (
                <View style={styles.inlineDropdown}>
                  {DOCUMENT_TYPES.map((t) => (
                    <TouchableOpacity key={t} style={styles.option} onPress={() => { setType(t); setShowType(false); }}><Text style={styles.optionText}>{t}</Text>{type === t && <Ionicons name="checkmark" size={18} color={colors.primary} />}</TouchableOpacity>
                  ))}
                </View>
              )}

              <AppInput label="Document Number" value={docNumber} onChangeText={setDocNumber} placeholder="MH12 AB 1234" />
              <DatePicker label="Issued On" value={issuedOn} onChange={setIssuedOn} inline placeholder="Optional" />
              <DatePicker label="Expiry Date *" value={expiresAt} onChange={setExpiresAt} error={errors.expiresAt} inline />
              <AppInput label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional" multiline />
              <AppButton title={editing ? 'Update' : 'Save Document'} onPress={handleSave} />
            </ScrollView>
          </View></View>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmationModal visible={!!deleteId} title="Delete Document" message="Delete this document?" confirmText="Delete" cancelText="Cancel" icon="trash-outline" iconColor={colors.error} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
      <SuccessModal visible={showSuccess} title={successMsg} onClose={() => setShowSuccess(false)} />
    </ScreenContainer>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center', gap: 12, padding: spacing.xl, marginTop: 20 },
  emptyText: { ...typography.bodySmall, color: colors.textSecondary },
  card: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  vehPill: { backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  vehText: { fontSize: 11, fontWeight: '700', color: '#1D4ED8' },
  cardSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontSize: 12, fontWeight: '700' },
  toast: { position: 'absolute', bottom: 100, left: spacing.base, right: spacing.base, backgroundColor: '#0F172A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, elevation: 8 },
  toastText: { color: '#fff', fontWeight: '700' },
  label: { ...typography.label, color: colors.textPrimary, marginBottom: 6, marginTop: 4 },
  errorText: { ...typography.caption, color: colors.error, marginBottom: 8 },
  picker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 14, backgroundColor: colors.surface, marginBottom: 4 },
  pickerText: { ...typography.body, color: colors.textPrimary },
  pickerPlaceholder: { ...typography.body, color: colors.textTertiary },
  inlineDropdown: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.base, marginTop: -4 },
  option: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  optionText: { ...typography.body, color: colors.textPrimary },
  kav: { flex: 1 },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.base, paddingBottom: spacing.xl, maxHeight: '90%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.base },
  sheetTitle: { ...typography.headingSmall, color: colors.textPrimary },
});
