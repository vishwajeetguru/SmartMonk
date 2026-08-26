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
import { pumpApi } from '../../services/api/pumps';
import { Pump } from '../../types/pump';
import { validation } from '../../utils/validation';
import { copyToClipboard, shareOnWhatsApp } from '../../utils/share';

export default function PumpsScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { t } = useTranslation();
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

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [menuPump, setMenuPump] = useState<Pump | null>(null);
  const [showCopied, setShowCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      setList(await pumpApi.getAll());
    } catch (e) {
      console.error(e);
    }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const locationOptions = useMemo<FilterOption[]>(() => {
    const set = new Set<string>();
    list.forEach((p) => { if (p.location) set.add(p.location.trim()); });
    return Array.from(set).map((l) => ({ label: l, value: l }));
  }, [list]);

  const stats = useMemo(() => {
    const total = list.length;
    const locations = new Set<string>();
    list.forEach((p) => { if (p.location) locations.add(p.location.trim()); });
    const thisMonth = list.filter((p) => isThisMonth(p.createdAt)).length;
    const withContact = list.filter((p) => p.contact?.trim()).length;
    return { total, locations: locations.size, thisMonth, withContact };
  }, [list]);

  const filtered = useMemo(() => {
    let r = list;
    if (filter !== 'All') r = r.filter((p) => (p.location || '').trim() === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((p) =>
        [p.name, p.contact, p.location].some((v) => (v || '').toLowerCase().includes(q))
      );
    }
    return r;
  }, [list, filter, search]);

  const openAdd = () => { setEditing(null); setName(''); setContact(''); setLocation(''); setErrors({}); setShowAdd(true); };
  const openEdit = (item: Pump) => { setMenuPump(null); setEditing(item); setName(item.name); setContact(item.contact); setLocation(item.location); setErrors({}); setShowAdd(true); };

  const validate = (): boolean => {
    const newErr: any = {};
    if (!name.trim()) newErr.name = 'Please enter fuel station name';
    if (!validation.mobile(contact).isValid) newErr.contact = validation.mobile(contact).error;
    if (!location.trim()) newErr.location = 'Please enter location';
    const others = list.filter((p) => p.id !== editing?.id);
    if (others.some((p) => p.name.trim().toLowerCase() === name.trim().toLowerCase())) newErr.name = 'Fuel station already exists';
    if (others.some((p) => p.contact.trim() === contact.trim())) newErr.contact = 'Contact already exists';
    setErrors(newErr);
    return Object.keys(newErr).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) {
        await pumpApi.update(editing.id, { name, contact, location });
        setSuccessMsg(t('list.pumpUpdated'));
      } else {
        await pumpApi.add({ name, contact, location });
        setSuccessMsg(t('list.pumpAdded'));
      }
      setShowAdd(false); setShowSuccess(true); load();
    } catch (e: any) {
      setErrors({ name: e?.message || 'Failed' });
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await pumpApi.remove(deleteId);
    } catch {}
    setDeleteId(null); setMenuPump(null); load();
  };

  const formatPump = (p: Pump): string => [
    `⛽ Fuel Station: ${p.name}`,
    `📞 Contact: ${p.contact}`,
    `📍 Location: ${p.location}`,
  ].join('\n');

  const handleCopyPump = async (p: Pump) => {
    setMenuPump(null);
    const ok = await copyToClipboard(formatPump(p));
    if (ok) { setShowCopied(true); setTimeout(() => setShowCopied(false), 2200); }
  };
  const handleSharePump = async (p: Pump) => {
    setMenuPump(null);
    await shareOnWhatsApp(formatPump(p));
  };

  const menuItems: ActionMenuItem[] = menuPump
    ? [
        { label: 'Edit Station', icon: 'pencil-outline', onPress: () => openEdit(menuPump) },
        { label: 'Share on WhatsApp', icon: 'logo-whatsapp', color: '#25D366', onPress: () => handleSharePump(menuPump) },
        { label: 'Copy details', icon: 'copy-outline', onPress: () => handleCopyPump(menuPump) },
        { label: 'Delete Station', icon: 'trash-outline', color: colors.error, divider: true, onPress: () => { setDeleteId(menuPump.id); setMenuPump(null); } },
      ]
    : [];

  return (
    <ScreenContainer safeArea padded={false} style={{ backgroundColor: '#F8FAFC' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <ScreenHeader
          title={t('screen.fuel')}
          subtitle="Manage your fuel stations"
          actionLabel="Add Station"
          onAction={openAdd}
        />

        <StatsGrid>
          <StatCard icon="flame" iconBg="#EFF6FF" iconColor="#2563EB" value={String(stats.total)} label="Total Stations" />
          <StatCard icon="location" iconBg="#ECFDF5" iconColor="#10B981" value={String(stats.locations)} label="Locations" />
          <StatCard icon="calendar" iconBg="#FFF7ED" iconColor="#F59E0B" value={String(stats.thisMonth)} label="This Month" />
          <StatCard icon="call" iconBg="#F5F3FF" iconColor="#7C3AED" value={String(stats.withContact)} label="With Contact" />
        </StatsGrid>

        <SearchFilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name, contact or location..."
          filter={filter}
          onFilterChange={setFilter}
          filterOptions={locationOptions}
          filterTitle="Filter by Location"
        />

        {filtered.length === 0 ? (
          <View style={styles.empty}><Ionicons name="flame-outline" size={48} color={colors.muted} /><Text style={styles.emptyText}>{search || filter !== 'All' ? 'No stations match filter' : t('list.pumpsEmpty')}</Text></View>
        ) : (
          <View style={{ paddingHorizontal: spacing.base, gap: 12 }}>
            {filtered.map((item) => (
              <PumpCard key={item.id} item={item} onMenu={() => setMenuPump(item)} onPress={() => openEdit(item)} />
            ))}
          </View>
        )}
      </ScrollView>

      <ActionMenu visible={!!menuPump} onClose={() => setMenuPump(null)} items={menuItems} />

      {showCopied && (
        <View style={styles.toast} pointerEvents="none">
          <Ionicons name="checkmark-circle" size={18} color="#fff" />
          <Text style={styles.toastText}>Copied to clipboard</Text>
        </View>
      )}

      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
          <View style={styles.overlay}><View style={styles.sheet}>
            <View style={styles.sheetHeader}><Text style={styles.sheetTitle}>{editing ? t('list.editPump') : t('list.addPump')}</Text><TouchableOpacity onPress={() => setShowAdd(false)}><Ionicons name="close" size={24} color={colors.textPrimary} /></TouchableOpacity></View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: spacing.base }}>
              <AppInput label={`${t('form.pumpName')} *`} value={name} onChangeText={setName} placeholder={t('form.pumpNamePlaceholder')} error={errors.name} />
              <AppInput label={`${t('form.pumpContact')} *`} value={contact} onChangeText={setContact} placeholder={t('form.supplierContactPlaceholder')} keyboardType="phone-pad" error={errors.contact} />
              <AppInput label={`${t('form.pumpLocation')} *`} value={location} onChangeText={setLocation} placeholder={t('form.locationPlaceholder')} error={errors.location} />
              <AppButton title={editing ? t('list.updatePump') : t('list.savePump')} onPress={handleSave} loading={saving} />
            </ScrollView>
          </View></View>
        </KeyboardAvoidingView>
      </Modal>
      <ConfirmationModal visible={!!deleteId} title={t('list.deletePump')} message={t('list.deletePumpMsg')} confirmText={t('common.delete')} cancelText={t('common.cancel')} icon="trash-outline" iconColor={colors.error} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
      <SuccessModal visible={showSuccess} title={successMsg} onClose={() => setShowSuccess(false)} />
    </ScreenContainer>
  );
}

function PumpCard({ item, onMenu, onPress }: { item: Pump; onMenu: () => void; onPress: () => void }) {
  return (
    <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={cardStyles.topRow}>
        <View style={cardStyles.avatar}><Ionicons name="flame" size={24} color="#D97706" /></View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={cardStyles.name} numberOfLines={1}>{item.name}</Text>
            <TouchableOpacity onPress={onMenu} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ padding: 4 }}>
              <Ionicons name="ellipsis-vertical" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={{ gap: 8, marginTop: 12 }}>
        <View style={cardStyles.infoRow}><Ionicons name="call-outline" size={16} color="#475569" /><Text style={cardStyles.infoText}>{item.contact}</Text></View>
        <View style={cardStyles.infoRow}><Ionicons name="location-outline" size={16} color="#475569" /><Text style={cardStyles.infoText} numberOfLines={1}>{item.location}</Text></View>
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
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '800', color: '#0F172A', flex: 1 },
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
