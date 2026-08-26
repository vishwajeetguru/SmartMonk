import React, { useCallback, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, KeyboardAvoidingView, Platform, Image, Alert, Linking } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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
import { SearchFilterBar, FilterOption } from '../../components/ui/SearchFilterBar';
import { driverApi } from '../../services/api/drivers';
import { Driver, BLOOD_GROUPS, DriverStatus } from '../../types/driver';
import { useProfile } from '../../hooks/useProfile';
import { validation } from '../../utils/validation';

const DRIVER_STATUSES: DriverStatus[] = ['Active', 'On Trip', 'Inactive'];

const DRIVER_FILTER_OPTIONS: FilterOption[] = DRIVER_STATUSES.map((s) => ({
  label: s,
  value: s,
  dotColor: s === 'Active' ? '#10B981' : s === 'On Trip' ? '#F59E0B' : '#EF4444',
}));

export default function DriversScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { t } = useTranslation();
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
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<DriverStatus>('Active');
  const [saving, setSaving] = useState(false);
  const [showBlood, setShowBlood] = useState(false);
  const [showVehicle, setShowVehicle] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [viewDriver, setViewDriver] = useState<Driver | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | DriverStatus>('All');
  const [menuDriver, setMenuDriver] = useState<Driver | null>(null);
  const [showCopied, setShowCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      setList(await driverApi.getAll());
    } catch (e) {
      console.error(e);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      load();
      loadProfile('');
    }, [load])
  );

  const stats = useMemo(() => {
    const total = list.length;
    const active = list.filter((d) => (d.status || 'Active') === 'Active').length;
    const onTrip = list.filter((d) => d.status === 'On Trip').length;
    const inactive = list.filter((d) => d.status === 'Inactive').length;
    return { total, active, onTrip, inactive };
  }, [list]);

  const filtered = useMemo(() => {
    let r = list;
    if (filterStatus !== 'All') r = r.filter((d) => (d.status || 'Active') === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((d) =>
        [d.fullName, d.contact, d.licence, d.aadhar, d.assignedVehicle].some((v) => (v || '').toLowerCase().includes(q))
      );
    }
    return r;
  }, [list, search, filterStatus]);

  const openAdd = () => {
    setEditing(null); setFullName(''); setContact(''); setBloodGroup(''); setAadhar(''); setLicence(''); setAddress(''); setSalary(''); setAssignedVehicle(''); setPhotoUrl(null); setStatus('Active'); setErrors({}); setShowBlood(false); setShowVehicle(false); setShowStatus(false); setShowAdd(true);
  };
  const openEdit = (item: Driver) => {
    setMenuDriver(null); setViewDriver(null);
    setEditing(item); setFullName(item.fullName); setContact(item.contact); setBloodGroup(item.bloodGroup || ''); setAadhar(item.aadhar || ''); setLicence(item.licence); setAddress(item.address || ''); setSalary(item.salary || ''); setAssignedVehicle(item.assignedVehicle || ''); setPhotoUrl(item.photoUrl || null); setStatus(item.status || 'Active'); setErrors({}); setShowAdd(true);
  };

  const capturePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to capture photo');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
      if (!result.canceled && result.assets[0]) setPhotoUrl(result.assets[0].uri);
    } catch (e) {
      Alert.alert('Error', 'Failed to capture photo');
    }
  };
  const pickFromGallery = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') { Alert.alert('Permission needed', 'Gallery permission required'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
      if (!result.canceled && result.assets[0]) setPhotoUrl(result.assets[0].uri);
    } catch { Alert.alert('Error', 'Failed to pick image'); }
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
    if (!validate()) return;
    setSaving(true);
    try {
      let finalPhotoUrl = photoUrl;
      if (photoUrl && photoUrl.startsWith('file://')) {
        try { finalPhotoUrl = await driverApi.uploadPhoto(photoUrl); } catch (e) { console.warn('Photo upload failed', e); }
      }
      if (editing) {
        await driverApi.update(editing.id, { fullName, contact, bloodGroup: bloodGroup as any, aadhar, licence, address, salary, assignedVehicle, photoUrl: finalPhotoUrl, status } as any);
        if (photoUrl && photoUrl.startsWith('file://') && finalPhotoUrl === photoUrl) {
          try { await driverApi.uploadDriverPhoto(editing.id, photoUrl); } catch {}
        }
        setSuccessMsg('Driver updated successfully');
      } else {
        const created = await driverApi.add({ fullName, contact, bloodGroup: bloodGroup as any, aadhar, licence, address, salary, assignedVehicle, photoUrl: finalPhotoUrl, status } as any);
        if (photoUrl && photoUrl.startsWith('file://') && !finalPhotoUrl?.startsWith('http')) {
          try { await driverApi.uploadDriverPhoto(created.id, photoUrl); } catch {}
        }
        setSuccessMsg('Driver added successfully');
      }
      setShowAdd(false); setShowSuccess(true); load();
    } catch (e: any) {
      setErrors({ fullName: e?.message || 'Failed' });
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async () => {
    if (!deleteId) return;
    try { await driverApi.remove(deleteId); } catch {}
    setDeleteId(null); setMenuDriver(null); load();
  };

  const formatDriverDetails = (item: Driver): string => {
    const lines = [
      `👤 Driver: ${item.fullName}`,
      `📞 Contact: ${item.contact}`,
      `🩸 Blood: ${item.bloodGroup || '-'}`,
      `🪪 Licence: ${item.licence}`,
      `🆔 Aadhar: ${item.aadhar || '-'}`,
      `🚛 Vehicle: ${item.assignedVehicle || 'Not assigned'}`,
      `📍 Address: ${item.address || '-'}`,
      `💰 Salary: ₹${item.salary ? Number(item.salary).toLocaleString('en-IN') : '-'}`,
      `📌 Status: ${item.status || 'Active'}`,
      `📅 Assigned: ${formatAssigned(item.createdAt)}`,
    ];
    return lines.join('\n');
  };

  const handleCopyDriver = async (item: Driver) => {
    const text = formatDriverDetails(item);
    try {
      await Clipboard.setStringAsync(text);
      setMenuDriver(null);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2200);
    } catch {
      Alert.alert('Error', 'Failed to copy');
    }
  };

  const handleShareWhatsAppDriver = async (item: Driver) => {
    const text = formatDriverDetails(item);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    setMenuDriver(null);
    try {
      const can = await Linking.canOpenURL(url);
      if (can) await Linking.openURL(url);
      else Alert.alert('WhatsApp not available');
    } catch {
      Alert.alert('Error', 'Failed to share on WhatsApp');
    }
  };
  const vehicles = profile?.vehicles || [];

  return (
    <ScreenContainer safeArea padded={false} style={{ backgroundColor: '#F8FAFC' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.headerTitle}>Drivers</Text>
            <Text style={styles.headerSub}>Manage your drivers and their details</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.85}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addBtnText}>Add Driver</Text>
          </TouchableOpacity>
        </View>

        {/* Stats 4 cards */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' }]}>
            <View style={[styles.statIconWrap, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="people-outline" size={20} color="#2563EB" />
            </View>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Drivers</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#ECFDF5', borderColor: '#D1FAE5' }]}>
            <View style={[styles.statIconWrap, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{stats.active}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FFF7ED', borderColor: '#FFEDD5' }]}>
            <View style={[styles.statIconWrap, { backgroundColor: '#FFEDD5' }]}>
              <Ionicons name="time-outline" size={20} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{stats.onTrip}</Text>
            <Text style={styles.statLabel}>On Trip</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' }]}>
            <View style={[styles.statIconWrap, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
            </View>
            <Text style={styles.statValue}>{stats.inactive}</Text>
            <Text style={styles.statLabel}>Inactive</Text>
          </View>
        </View>

        {/* Search + Filter */}
        <SearchFilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name, phone, license..."
          filter={filterStatus}
          onFilterChange={(v) => setFilterStatus(v as 'All' | DriverStatus)}
          filterOptions={DRIVER_FILTER_OPTIONS}
          filterTitle="Filter Drivers"
        />

        {filtered.length === 0 ? (
          <View style={styles.empty}><Ionicons name="people-outline" size={48} color={colors.muted} /><Text style={styles.emptyText}>{search || filterStatus !== 'All' ? 'No drivers match filter' : t('list.driversEmpty')}</Text></View>
        ) : (
          <View style={{ paddingHorizontal: spacing.base, gap: 14 }}>
            {filtered.map((item) => (
              <DriverCard key={item.id} item={item} onMenu={() => setMenuDriver(item)} onPress={() => setViewDriver(item)} onEdit={() => openEdit(item)} onDelete={() => setDeleteId(item.id)} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Menu */}
      <Modal visible={!!menuDriver} transparent animationType="fade" onRequestClose={() => setMenuDriver(null)}>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setMenuDriver(null)}>
          <View style={styles.menuSheet}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { if (menuDriver) openEdit(menuDriver); }}>
              <Ionicons name="pencil-outline" size={20} color={colors.textPrimary} />
              <Text style={styles.menuItemText}>Edit Driver</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { if (menuDriver) handleShareWhatsAppDriver(menuDriver); }}>
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
              <Text style={styles.menuItemText}>Share on WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { if (menuDriver) handleCopyDriver(menuDriver); }}>
              <Ionicons name="copy-outline" size={20} color={colors.textPrimary} />
              <Text style={styles.menuItemText}>Copy details</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => { if (menuDriver) setDeleteId(menuDriver.id); setMenuDriver(null); }}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
              <Text style={[styles.menuItemText, { color: colors.error }]}>Delete Driver</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuCancel} onPress={() => setMenuDriver(null)}>
              <Text style={styles.menuCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {showCopied && (
        <View style={styles.toast} pointerEvents="none">
          <Ionicons name="checkmark-circle" size={18} color="#fff" />
          <Text style={styles.toastText}>Copied to clipboard</Text>
        </View>
      )}

      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
          <View style={styles.overlay}><View style={[styles.sheet, { maxHeight: '90%' }]}>
            <View style={styles.sheetHeader}><Text style={styles.sheetTitle}>{editing ? t('list.editDriver') : t('list.addDriver')}</Text><TouchableOpacity onPress={() => setShowAdd(false)}><Ionicons name="close" size={24} color={colors.textPrimary} /></TouchableOpacity></View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: spacing.base }}>
              <View style={styles.photoSection}>
                <Text style={styles.label}>Driver Photo</Text>
                <View style={styles.photoPreviewWrap}>
                  {photoUrl ? <Image source={{ uri: photoUrl }} style={styles.photoPreview} /> : <View style={styles.photoPlaceholder}><Ionicons name="person" size={36} color={colors.muted} /><Text style={styles.photoPlaceholderText}>No photo</Text></View>}
                </View>
                <View style={styles.photoActions}>
                  <TouchableOpacity style={styles.photoBtn} onPress={capturePhoto} activeOpacity={0.7}><Ionicons name="camera" size={18} color={colors.white} /><Text style={styles.photoBtnText}>Capture</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.photoBtn, styles.photoBtnSecondary]} onPress={pickFromGallery} activeOpacity={0.7}><Ionicons name="images-outline" size={18} color={colors.primary} /><Text style={[styles.photoBtnText, { color: colors.primary }]}>Gallery</Text></TouchableOpacity>
                  {photoUrl ? <TouchableOpacity style={styles.photoRemove} onPress={() => setPhotoUrl(null)}><Ionicons name="trash-outline" size={18} color={colors.error} /></TouchableOpacity> : null}
                </View>
              </View>

              <AppInput label={`${t('form.driverName')} *`} value={fullName} onChangeText={setFullName} placeholder={t('form.fullNamePlaceholder')} error={errors.fullName} />
              <AppInput label={`${t('form.driverContact')} *`} value={contact} onChangeText={setContact} placeholder={t('form.supplierContactPlaceholder')} keyboardType="phone-pad" error={errors.contact} />
              <Text style={styles.label}>Status</Text>
              <TouchableOpacity style={styles.picker} onPress={() => setShowStatus((v) => !v)} activeOpacity={0.7}><Text style={status ? styles.pickerText : styles.pickerPlaceholder}>{status}</Text><Ionicons name={showStatus ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} /></TouchableOpacity>
              {showStatus && (
                <View style={styles.inlineDropdown}>
                  {DRIVER_STATUSES.map((s) => (
                    <TouchableOpacity key={s} style={styles.option} onPress={() => { setStatus(s); setShowStatus(false); }}><Text style={styles.optionText}>{s}</Text>{status === s && <Ionicons name="checkmark" size={18} color={colors.primary} />}</TouchableOpacity>
                  ))}
                </View>
              )}
              <Text style={styles.label}>{t('form.bloodGroup')}</Text>
              <TouchableOpacity style={styles.picker} onPress={() => setShowBlood((v) => !v)} activeOpacity={0.7}><Text style={bloodGroup ? styles.pickerText : styles.pickerPlaceholder}>{bloodGroup || t('form.bloodGroupPlaceholder')}</Text><Ionicons name={showBlood ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} /></TouchableOpacity>
              {showBlood && (
                <View style={styles.inlineDropdown}>
                  <View style={styles.inlineHeader}>
                    <Text style={styles.inlineTitle}>{t('form.bloodGroup')} • 8</Text>
                    <TouchableOpacity onPress={() => setShowBlood(false)}><Ionicons name="close" size={18} color={colors.textSecondary} /></TouchableOpacity>
                  </View>
                  <View style={styles.bloodGrid}>
                    {(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const).map((b) => (
                      <TouchableOpacity key={b} style={[styles.bloodChip, bloodGroup === b && styles.bloodChipActive]} onPress={() => { setBloodGroup(b); setShowBlood(false); }} activeOpacity={0.7}>
                        <Text style={[styles.bloodChipText, bloodGroup === b && styles.bloodChipTextActive]}>{b}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity style={styles.clearRow} onPress={() => { setBloodGroup(''); setShowBlood(false); }}>
                    <Ionicons name="close-circle-outline" size={18} color={colors.textSecondary} />
                    <Text style={styles.clearText}>{t('common.clear')}</Text>
                  </TouchableOpacity>
                </View>
              )}
              <AppInput label={t('form.aadhar')} value={aadhar} onChangeText={setAadhar} placeholder={t('form.aadharPlaceholder')} keyboardType="numeric" error={errors.aadhar} />
              <AppInput label={`${t('form.licence')} *`} value={licence} onChangeText={setLicence} placeholder={t('form.licencePlaceholder')} error={errors.licence} autoCapitalize="characters" />
              <AppInput label={t('form.address')} value={address} onChangeText={setAddress} placeholder={t('form.address')} />
              <AppInput label={t('form.salary')} value={salary} onChangeText={setSalary} placeholder={t('form.salaryPlaceholder')} keyboardType="numeric" />
              <Text style={styles.label}>{t('form.assignVehicle')}</Text>
              <TouchableOpacity style={styles.picker} onPress={() => setShowVehicle((v) => !v)} activeOpacity={0.7}><Text style={assignedVehicle ? styles.pickerText : styles.pickerPlaceholder}>{assignedVehicle || (vehicles.length ? t('form.assignVehiclePlaceholder') : t('form.noVehiclesProfile'))}</Text><Ionicons name={showVehicle ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} /></TouchableOpacity>
              {showVehicle && (
                <View style={styles.inlineDropdown}>
                  <View style={styles.inlineHeader}>
                    <Text style={styles.inlineTitle}>{t('form.assignVehicle')} — {vehicles.length}</Text>
                    <TouchableOpacity onPress={() => setShowVehicle(false)}><Ionicons name="close" size={18} color={colors.textSecondary} /></TouchableOpacity>
                  </View>
                  <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                    <TouchableOpacity style={styles.option} onPress={() => { setAssignedVehicle(''); setShowVehicle(false); }}><Text style={styles.optionText}>{t('common.none')}</Text>{!assignedVehicle && <Ionicons name="checkmark" size={18} color={colors.primary} />}</TouchableOpacity>
                    {vehicles.length === 0 ? (
                      <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                        <Ionicons name="car-outline" size={28} color={colors.muted} />
                        <Text style={{ ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center', marginTop: 6 }}>{t('form.noVehiclesProfile')}</Text>
                      </View>
                    ) : (
                      vehicles.map((v) => (
                        <TouchableOpacity key={v.id} style={styles.option} onPress={() => { setAssignedVehicle(v.number); setShowVehicle(false); }}><Text style={styles.optionText}>{v.number}</Text>{assignedVehicle === v.number && <Ionicons name="checkmark" size={18} color={colors.primary} />}</TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                </View>
              )}
              <View style={{ height: 12 }} />
              <AppButton title={editing ? t('list.updateDriver') : t('list.saveDriver')} onPress={handleSave} loading={saving} />
            </ScrollView>
          </View></View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={!!viewDriver} transparent animationType="fade" onRequestClose={() => setViewDriver(null)}>
        <View style={styles.overlayCenter}>
          <View style={[styles.smallSheet, { width: '90%', maxWidth: 380 }]}>
            <View style={{ alignItems: 'center', marginBottom: spacing.base }}>
              {viewDriver?.photoUrl ? <Image source={{ uri: viewDriver.photoUrl }} style={{ width: 72, height: 72, borderRadius: 36, marginBottom: spacing.sm }} /> : <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm }}><Text style={{ ...typography.headingMedium, color: colors.white }}>{viewDriver ? viewDriver.fullName[0]?.toUpperCase() : ''}</Text></View>}
              <Text style={{ ...typography.headingSmall, color: colors.textPrimary }}>{viewDriver?.fullName}</Text>
              <Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>{viewDriver?.contact} {viewDriver?.bloodGroup ? `• ${viewDriver?.bloodGroup}` : ''}</Text>
            </View>
            <View style={{ gap: 10, marginBottom: spacing.base }}>
              <View style={styles.detailRow}><Ionicons name="card-outline" size={18} color={colors.primary} /><Text style={styles.detailLabel}>{t('form.licence')}:</Text><Text style={styles.detailValue}>{viewDriver?.licence}</Text></View>
              {viewDriver?.aadhar ? <View style={styles.detailRow}><Ionicons name="finger-print-outline" size={18} color={colors.primary} /><Text style={styles.detailLabel}>{t('form.aadhar')}:</Text><Text style={styles.detailValue}>{viewDriver?.aadhar}</Text></View> : null}
              <View style={styles.detailRow}><Ionicons name="car-outline" size={18} color={colors.primary} /><Text style={styles.detailLabel}>{t('form.assignVehicle')}:</Text><Text style={styles.detailValue}>{viewDriver?.assignedVehicle || t('common.none')}</Text></View>
              {viewDriver?.address ? <View style={styles.detailRow}><Ionicons name="location-outline" size={18} color={colors.primary} /><Text style={styles.detailLabel}>{t('form.address')}:</Text><Text style={styles.detailValue}>{viewDriver?.address}</Text></View> : null}
              {viewDriver?.salary ? <View style={styles.detailRow}><Ionicons name="cash-outline" size={18} color={colors.primary} /><Text style={styles.detailLabel}>{t('form.salary')}:</Text><Text style={styles.detailValue}>₹{viewDriver?.salary}</Text></View> : null}
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={[styles.detailBtn, { backgroundColor: colors.primary, flex: 1 }]} onPress={() => { if (viewDriver) { const d = viewDriver; setViewDriver(null); setTimeout(() => openEdit(d), 300); } }}>
                <Ionicons name="pencil-outline" size={18} color={colors.white} /><Text style={{ color: colors.white, fontWeight: '600' }}>{t('common.edit')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.detailBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flex: 1 }]} onPress={() => setViewDriver(null)}>
                <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{t('common.close')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmationModal visible={!!deleteId} title={t('list.deleteDriver')} message={t('list.deleteDriverMsg')} confirmText={t('common.delete')} cancelText={t('common.cancel')} icon="trash-outline" iconColor={colors.error} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
      <SuccessModal visible={showSuccess} title={successMsg} onClose={() => setShowSuccess(false)} />
    </ScreenContainer>
  );
}

function DriverCard({ item, onMenu, onPress, onEdit, onDelete }: { item: Driver; onMenu: () => void; onPress: () => void; onEdit: () => void; onDelete: () => void }) {
  const status = (item.status || 'Active') as DriverStatus;
  const isActive = status === 'Active';
  const isOnTrip = status === 'On Trip';
  const statusBg = isActive ? '#ECFDF5' : isOnTrip ? '#FFF7ED' : '#FEF2F2';
  const statusColor = isActive ? '#059669' : isOnTrip ? '#D97706' : '#DC2626';
  const dotColor = statusColor;
  const assigned = formatAssigned(item.createdAt);

  return (
    <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={cardStyles.topRow}>
        <View style={cardStyles.avatarWrap}>
          {item.photoUrl ? (
            <Image source={{ uri: item.photoUrl }} style={cardStyles.avatar} />
          ) : (
            <View style={[cardStyles.avatar, cardStyles.avatarPlaceholder]}><Text style={cardStyles.avatarText}>{item.fullName[0]?.toUpperCase()}</Text></View>
          )}
          <View style={[cardStyles.activeDot, { backgroundColor: isActive || isOnTrip ? '#10B981' : '#94A3B8', borderColor: '#fff' }]} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={cardStyles.name} numberOfLines={1}>{item.fullName}</Text>
            <TouchableOpacity onPress={onMenu} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ padding: 4 }}>
              <Ionicons name="ellipsis-vertical" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>
          <View style={[cardStyles.statusPill, { backgroundColor: statusBg }]}>
            <View style={[cardStyles.statusDot, { backgroundColor: dotColor }]} />
            <Text style={[cardStyles.statusText, { color: statusColor }]}>{status}</Text>
          </View>
        </View>
      </View>

      <View style={{ gap: 8, marginTop: 10 }}>
        <View style={cardStyles.infoRow}>
          <View style={cardStyles.infoItem}><Ionicons name="call-outline" size={16} color="#475569" /><Text style={cardStyles.infoText}>{item.contact}</Text></View>
          <Text style={cardStyles.sep}>|</Text>
          <View style={cardStyles.infoItem}><Ionicons name="card-outline" size={16} color="#475569" /><Text style={cardStyles.infoText}>{item.licence}</Text></View>
          <Text style={cardStyles.sep}>|</Text>
          <View style={cardStyles.infoItem}><Ionicons name="car-outline" size={16} color="#475569" /><Text style={cardStyles.infoText} numberOfLines={1}>Truck ({item.assignedVehicle ? extractTruckShort(item.assignedVehicle) : '—'})</Text></View>
        </View>
        <View style={cardStyles.infoRow}>
          <View style={cardStyles.infoItem}><Ionicons name="location-outline" size={16} color="#475569" /><Text style={cardStyles.infoText}>Lic: {item.aadhar || item.licence}</Text></View>
          <Text style={cardStyles.sep}>|</Text>
          <View style={cardStyles.infoItem}><Text style={cardStyles.infoText}>Vehicle: {item.assignedVehicle || 'RED'}</Text></View>
        </View>
        {item.salary ? (
          <View style={cardStyles.infoRow}>
            <View style={cardStyles.infoItem}><Ionicons name="cash-outline" size={16} color="#475569" /><Text style={cardStyles.infoText}>Salary: ₹{Number(item.salary).toLocaleString('en-IN')}</Text></View>
          </View>
        ) : null}
      </View>

      <View style={cardStyles.footer}>
        <View style={cardStyles.footerLeft}>
          <Ionicons name="calendar-outline" size={18} color="#2563EB" />
          <Text style={cardStyles.footerText}>Assigned since {assigned}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity onPress={onEdit} style={cardStyles.circleBtn}><Ionicons name="pencil" size={16} color="#2563EB" /></TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={[cardStyles.circleBtn, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}><Ionicons name="trash" size={16} color="#EF4444" /></TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function extractTruckShort(v: string) {
  // MH12 -> extract last part
  const parts = v.split(' ');
  return parts[parts.length - 1].replace(/[^A-Za-z0-9]/g, '').slice(-4) || v.slice(-4);
}
function formatAssigned(iso: string) {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso.slice(0, 10);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

const cardStyles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 4 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start' },
  avatarWrap: { width: 64, height: 64, borderRadius: 32, position: 'relative' },
  avatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: '#BAE6FD' },
  avatarPlaceholder: { backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#2563EB' },
  activeDot: { position: 'absolute', right: 0, bottom: 2, width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  name: { fontSize: 18, fontWeight: '800', color: '#0F172A', flex: 1 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontSize: 12, fontWeight: '700' },
  infoRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  infoText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  sep: { color: '#CBD5E1', fontSize: 12 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F1F5F9', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, marginTop: 12 },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  footerText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  circleBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
});

const makeStyles = (colors: any) => StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: spacing.base, paddingTop: 8, paddingBottom: 16 },
  headerTitle: { ...typography.headingMedium, color: '#0F172A', fontSize: 28, fontWeight: '800' },
  headerSub: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2563EB', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  statsGrid: { flexDirection: 'row', paddingHorizontal: spacing.base, gap: 10, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 16, padding: 12, borderWidth: 1, alignItems: 'flex-start' },
  statIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  statLabel: { fontSize: 11, color: '#64748B', marginTop: 2, fontWeight: '600' },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 12, padding: spacing.xl, marginTop: 20 },
  emptyText: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center' },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.32)', justifyContent: 'flex-end' },
  menuSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.base, paddingBottom: 32 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  menuItemText: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  menuDivider: { height: 1, backgroundColor: colors.borderLight },
  menuCancel: { marginTop: 12, backgroundColor: colors.backgroundSecondary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  menuCancelText: { ...typography.body, color: colors.textPrimary, fontWeight: '700' },
  toast: {
    position: 'absolute',
    bottom: 100,
    left: spacing.base,
    right: spacing.base,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  toastText: { ...typography.bodySmall, color: '#fff', fontWeight: '700' },
  kav: { flex: 1 },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  overlayCenter: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.xl },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.base, paddingBottom: spacing.xl },
  smallSheet: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.base },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.base },
  sheetTitle: { ...typography.headingSmall, color: colors.textPrimary },
  label: { ...typography.label, color: colors.textPrimary, marginBottom: 6, marginTop: 4 },
  picker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 14, backgroundColor: colors.surface, marginBottom: 12 },
  pickerText: { ...typography.body, color: colors.textPrimary },
  pickerPlaceholder: { ...typography.body, color: colors.textTertiary },
  option: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  optionText: { ...typography.body, color: colors.textPrimary },
  inlineDropdown: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.base, marginTop: -4 },
  inlineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm, paddingBottom: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  inlineTitle: { ...typography.labelSmall, color: colors.textSecondary, fontWeight: '600' },
  bloodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 8 },
  bloodChip: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 72, paddingVertical: 12, paddingHorizontal: 14, borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface, justifyContent: 'center' },
  bloodChipActive: { backgroundColor: colors.error, borderColor: colors.error },
  bloodChipText: { ...typography.bodySmall, fontWeight: '700', color: colors.textPrimary },
  bloodChipTextActive: { color: colors.white },
  clearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, marginTop: 8, borderTopWidth: 1, borderTopColor: colors.borderLight },
  clearText: { ...typography.bodySmall, color: colors.textSecondary, fontWeight: '600' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  detailLabel: { ...typography.bodySmall, color: colors.textSecondary, minWidth: 70, fontWeight: '600' },
  detailValue: { ...typography.bodySmall, color: colors.textPrimary, flex: 1 },
  detailBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: radius.md },
  photoSection: { marginBottom: spacing.base, padding: spacing.base, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.backgroundSecondary },
  photoPreviewWrap: { alignItems: 'center', marginBottom: spacing.sm },
  photoPreview: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: colors.primary },
  photoPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', gap: 4 },
  photoPlaceholderText: { ...typography.caption, color: colors.textTertiary },
  photoActions: { flexDirection: 'row', gap: 10, justifyContent: 'center', alignItems: 'center' },
  photoBtn: { flexDirection: 'row', gap: 6, paddingVertical: 10, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center' },
  photoBtnSecondary: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.primary },
  photoBtnText: { ...typography.bodySmall, fontWeight: '600', color: colors.white },
  photoRemove: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.errorLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.error },
});
