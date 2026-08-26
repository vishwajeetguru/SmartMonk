import React, { useCallback, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, KeyboardAvoidingView, Platform, ScrollView, Linking, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { DatePicker } from '../../components/ui/DatePicker';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { SuccessModal } from '../../components/ui/SuccessModal';
import { SearchFilterBar, FilterOption } from '../../components/ui/SearchFilterBar';
import { tripApi } from '../../services/api/trips';
import { supplierApi } from '../../services/api/suppliers';
import { Trip, PAYMENT_STATUSES, PaymentStatus, TRIP_STATUSES, TripStatus } from '../../types/trip';
import { Supplier } from '../../types/supplier';
import { useProfile } from '../../hooks/useProfile';

type FilterType = 'All' | TripStatus;

const TRIP_FILTER_OPTIONS: FilterOption[] = TRIP_STATUSES.map((s) => ({
  label: s,
  value: s,
  dotColor: statusColor(s),
}));

export default function TripsScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { t } = useTranslation();
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
  const [tripStatus, setTripStatus] = useState<TripStatus>('Pending');

  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [showTruckPicker, setShowTruckPicker] = useState(false);
  const [showMaterialPicker, setShowMaterialPicker] = useState(false);
  const [showSupplierPicker, setShowSupplierPicker] = useState(false);
  const [showPaymentPicker, setShowPaymentPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  // New UI state
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('All');
  const [menuTrip, setMenuTrip] = useState<Trip | null>(null);
  const [showCopied, setShowCopied] = useState(false);

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

  // Stats
  const stats = useMemo(() => {
    const total = list.length;
    const pending = list.filter((i) => (i.status || 'Pending') === 'Pending').length;
    const completed = list.filter((i) => i.status === 'Completed').length;
    const totalProfit = list.reduce((s, i) => s + (Number(i.profit) || 0), 0);
    return { total, pending, completed, totalProfit };
  }, [list]);

  const filtered = useMemo(() => {
    let r = list;
    if (filter !== 'All') r = r.filter((i) => (i.status || 'Pending') === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((i) =>
        [i.truckNumber, i.vehicleNumber, i.material, i.supplierName, i.clientName, i.location].some((v) =>
          (v || '').toLowerCase().includes(q)
        )
      );
    }
    // sort by date desc
    return [...r].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [list, filter, search]);

  const grouped = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const groups: { title: string; data: Trip[] }[] = [];
    const map = new Map<string, Trip[]>();
    filtered.forEach((t) => {
      let key = t.date || '';
      let label = formatGroupLabel(key, today, y);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(t);
    });
    // Ensure Today/Yesterday order first
    const order = new Map<string, number>();
    // sort keys by date desc
    const sortedLabels = Array.from(map.keys()).sort((a, b) => {
      if (a === 'Today') return -1;
      if (b === 'Today') return 1;
      if (a === 'Yesterday') return -1;
      if (b === 'Yesterday') return 1;
      return 0;
    });
    sortedLabels.forEach((k) => groups.push({ title: k, data: map.get(k)! }));
    return groups;
  }, [filtered]);

  const openAdd = () => {
    setEditing(null);
    const singleTruck = vehicles.length === 1 ? vehicles[0].number : '';
    setTruckNumber(singleTruck);
    setDate(new Date().toISOString().slice(0, 10));
    setMaterial(''); setMaterialPrice(''); setSupplierName(''); setClientName(''); setTripsCount(1); setLocation(''); setTotalValue('0'); setProfit('0'); setTotalExpense('0'); setPaymentStatus('Pending'); setTripStatus('Pending');
    setErrors({}); setShowTruckPicker(false); setShowMaterialPicker(false); setShowSupplierPicker(false); setShowPaymentPicker(false); setShowStatusPicker(false); setShowAdd(true);
  };
  const openEdit = (item: Trip) => {
    setMenuTrip(null);
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
    setTripStatus((item.status as TripStatus) || 'Pending');
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
        status: tripStatus,
        vehicleNumber: truckNumber.trim(),
        amount: totalValue.trim() || '0',
      };
      if (editing) {
        await tripApi.update(editing.id, data);
        setSuccessMsg(t('list.tripUpdated'));
      } else {
        await tripApi.add(data);
        setSuccessMsg(t('list.tripAdded'));
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
    setDeleteId(null); setMenuTrip(null); load();
  };

  const formatTripDetails = (item: Trip): string => {
    const lines = [
      `🚚 Trip: ${item.material || 'Trip'} • ${item.truckNumber || item.vehicleNumber || '-'}`,
      `📍 Route: ${item.location || `${item.supplierName || ''} → ${item.clientName || ''}`.trim()}`,
      `👤 Client: ${item.clientName || '-'}`,
      `🏭 Supplier: ${item.supplierName || '-'}`,
      `📅 Date: ${formatDate(item.date)} • Status: ${item.status || item.paymentStatus || 'Pending'}`,
      `🚛 Vehicle: ${item.truckNumber || item.vehicleNumber || '-'}`,
      `💰 Revenue: ₹${formatMoney(item.totalValue)} | Expense: ₹${formatMoney(item.totalExpense)} | Profit: ₹${formatMoney(item.profit)}`,
      `🔢 Trips: ${item.tripsCount || 1} • Payment: ${item.paymentStatus || 'Pending'}`,
    ];
    return lines.join('\n');
  };

  const handleCopy = async (item: Trip) => {
    const text = formatTripDetails(item);
    try {
      await Clipboard.setStringAsync(text);
      setMenuTrip(null);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2200);
    } catch {
      Alert.alert('Error', 'Failed to copy');
    }
  };

  const handleShareWhatsApp = async (item: Trip) => {
    const text = formatTripDetails(item);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    setMenuTrip(null);
    try {
      const can = await Linking.canOpenURL(url);
      if (can) await Linking.openURL(url);
      else Alert.alert('WhatsApp not available');
    } catch {
      Alert.alert('Error', 'Failed to share on WhatsApp');
    }
  };

  const renderTruckField = () => {
    if (vehicles.length === 0) {
      return (
        <View>
          <Text style={styles.label}>{`${t('form.truck')} *`}</Text>
          <View style={[styles.picker, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={styles.pickerPlaceholder}>{t('form.noVehicles')}</Text>
            <Ionicons name="car-outline" size={18} color={colors.textTertiary} />
          </View>
          {errors.truckNumber ? <Text style={styles.errorText}>{errors.truckNumber}</Text> : null}
        </View>
      );
    }
    if (vehicles.length === 1) {
      return (
        <View>
          <Text style={styles.label}>{`${t('form.truck')} *`}</Text>
          <View style={styles.singleTruck}>
            <Ionicons name="car-sport" size={20} color={colors.primary} />
            <Text style={styles.singleTruckText}>{vehicles[0].number}</Text>
            <View style={styles.singleBadge}><Text style={styles.singleBadgeText}>{t('form.onlyOneVehicle')}</Text></View>
          </View>
        </View>
      );
    }
    return (
      <View>
        <Text style={styles.label}>{`${t('form.truck')} *`}</Text>
        <TouchableOpacity style={[styles.picker, errors.truckNumber && { borderColor: colors.error }]} onPress={() => setShowTruckPicker((v) => !v)} activeOpacity={0.7}>
          <Text style={truckNumber ? styles.pickerText : styles.pickerPlaceholder}>{truckNumber || `${t('form.truckPlaceholder')} (${vehicles.length})`}</Text>
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
    <ScreenContainer safeArea padded={false} style={{ backgroundColor: '#F8FAFC' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Trips</Text>
            <Text style={styles.headerSub}>Manage all your transport trips</Text>
          </View>
          <TouchableOpacity style={styles.newTripBtn} onPress={openAdd} activeOpacity={0.85}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.newTripText}>New Trip</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Grid 2x2 */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="bus" size={22} color="#2563EB" />
            </View>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Trips</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="time-outline" size={22} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="checkmark-circle" size={22} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#F5F3FF' }]}>
              <Text style={{ color: '#7C3AED', fontWeight: '800', fontSize: 18 }}>₹</Text>
            </View>
            <Text style={styles.statValue}>{formatK(stats.totalProfit)}</Text>
            <Text style={styles.statLabel}>Total Profit</Text>
          </View>
        </View>

        {/* Search + Filter */}
        <SearchFilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by vehicle, driver, customer or location..."
          filter={filter}
          onFilterChange={(v) => setFilter(v as FilterType)}
          filterOptions={TRIP_FILTER_OPTIONS}
          filterTitle="Filter Trips"
        />

        {/* Trip List Grouped */}
        {filtered.length === 0 ? (
          <View style={styles.empty}><Ionicons name="navigate-outline" size={48} color={colors.muted} /><Text style={styles.emptyText}>{search || filter !== 'All' ? 'No trips match filter' : t('list.tripsEmpty')}</Text></View>
        ) : (
          grouped.map((group) => (
            <View key={group.title} style={{ marginBottom: 16 }}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupTitle}>{group.title}</Text>
                <Text style={styles.groupCount}>{group.data.length} Trip{group.data.length > 1 ? 's' : ''}</Text>
              </View>
              <View style={{ gap: 12 }}>
                {group.data.map((item) => (
                  <TripCard key={item.id} item={item} colors={colors} styles={styles} onMenu={() => setMenuTrip(item)} onPress={() => openEdit(item)} />
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Actions Menu */}
      <Modal visible={!!menuTrip} transparent animationType="fade" onRequestClose={() => setMenuTrip(null)}>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setMenuTrip(null)}>
          <View style={styles.menuSheet}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { if (menuTrip) openEdit(menuTrip); }}>
              <Ionicons name="pencil-outline" size={20} color={colors.textPrimary} />
              <Text style={styles.menuItemText}>Edit Trip</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { if (menuTrip) handleShareWhatsApp(menuTrip); }}>
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
              <Text style={styles.menuItemText}>Share on WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { if (menuTrip) handleCopy(menuTrip); }}>
              <Ionicons name="copy-outline" size={20} color={colors.textPrimary} />
              <Text style={styles.menuItemText}>Copy details</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => { if (menuTrip) setDeleteId(menuTrip.id); }}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
              <Text style={[styles.menuItemText, { color: colors.error }]}>Delete Trip</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuCancel} onPress={() => setMenuTrip(null)}>
              <Text style={styles.menuCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Copied Toast */}
      {showCopied && (
        <View style={styles.toast} pointerEvents="none">
          <Ionicons name="checkmark-circle" size={18} color="#fff" />
          <Text style={styles.toastText}>Copied to clipboard</Text>
        </View>
      )}

      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
          <View style={styles.overlay}><View style={styles.sheet}>
            <View style={styles.sheetHeader}><Text style={styles.sheetTitle}>{editing ? t('list.editTrip') : t('list.addTrip')}</Text><TouchableOpacity onPress={() => setShowAdd(false)}><Ionicons name="close" size={24} color={colors.textPrimary} /></TouchableOpacity></View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: spacing.base }}>
              {renderTruckField()}
              <DatePicker
                label={`${t('form.tripDate')} *`}
                value={date}
                onChange={setDate}
                placeholder={t('form.tripDate')}
                error={errors.date}
                minYear={new Date().getFullYear() - 5}
                maxYear={new Date().getFullYear() + 5}
                displayFormat="MM_DD_YYYY"
                inline
              />

              <Text style={styles.label}>{`${t('form.material')} *`}</Text>
              <TouchableOpacity style={[styles.picker, errors.material && { borderColor: colors.error }]} onPress={() => setShowMaterialPicker((v) => !v)} activeOpacity={0.7}>
                <Text style={material ? styles.pickerText : styles.pickerPlaceholder}>{material || (materials.length ? t('form.materialPlaceholder') : t('form.noMaterials'))}</Text><Ionicons name={showMaterialPicker ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              {showMaterialPicker && (
                <View style={styles.inlineDropdown}>
                  <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                    {materials.length === 0 ? <Text style={{ ...typography.bodySmall, color: colors.textSecondary, paddingVertical: 8 }}>{t('form.noMaterials')}</Text> : materials.map((m) => (
                      <TouchableOpacity key={m} style={styles.option} onPress={() => { setMaterial(m); setShowMaterialPicker(false); }}><Text style={styles.optionText}>{m}</Text>{material === m && <Ionicons name="checkmark" size={18} color={colors.primary} />}</TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
              {errors.material ? <Text style={styles.errorText}>{errors.material}</Text> : null}

              <AppInput label={t('form.materialPrice')} value={materialPrice} onChangeText={(val) => setMaterialPrice(val.replace(/[^0-9.]/g, ''))} placeholder={t('form.materialPricePlaceholder')} keyboardType="numeric" error={errors.materialPrice} leftIcon={<Ionicons name="cash-outline" size={18} color={colors.textSecondary} />} />

              <Text style={styles.label}>{`${t('form.supplierName')} *`}</Text>
              <TouchableOpacity style={[styles.picker, errors.supplierName && { borderColor: colors.error }]} onPress={() => setShowSupplierPicker((v) => !v)} activeOpacity={0.7}>
                <Text style={supplierName ? styles.pickerText : styles.pickerPlaceholder}>{supplierName || (suppliers.length ? t('form.supplierNamePlaceholder') : t('form.noSuppliers'))}</Text><Ionicons name={showSupplierPicker ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              {showSupplierPicker && (
                <View style={styles.inlineDropdown}>
                  <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                    {suppliers.length === 0 ? <Text style={{ ...typography.bodySmall, color: colors.textSecondary, paddingVertical: 8 }}>{t('form.noSuppliers')}</Text> : suppliers.map((s) => (
                      <TouchableOpacity key={s.id} style={styles.option} onPress={() => { setSupplierName(s.name); setShowSupplierPicker(false); }}><View><Text style={styles.optionText}>{s.name}</Text>{s.material ? <Text style={{ ...typography.caption, color: colors.textSecondary }}>{s.material}</Text> : null}</View>{supplierName === s.name && <Ionicons name="checkmark" size={18} color={colors.primary} />}</TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
              {errors.supplierName ? <Text style={styles.errorText}>{errors.supplierName}</Text> : null}

              <AppInput label={`${t('form.clientName')} *`} value={clientName} onChangeText={setClientName} placeholder={t('form.clientNamePlaceholder')} error={errors.clientName} leftIcon={<Ionicons name="person-outline" size={18} color={colors.textSecondary} />} />

              <Text style={styles.label}>{t('form.tripsCount')}</Text>
              <View style={styles.counterRow}>
                <TouchableOpacity style={styles.counterBtn} onPress={() => setTripsCount((c) => Math.max(1, c - 1))}><Ionicons name="remove" size={20} color={colors.primary} /></TouchableOpacity>
                <View style={styles.counterValue}><Text style={styles.counterText}>{tripsCount}</Text></View>
                <TouchableOpacity style={styles.counterBtn} onPress={() => setTripsCount((c) => c + 1)}><Ionicons name="add" size={20} color={colors.white} /></TouchableOpacity>
              </View>

              <AppInput label={t('form.locationRequired')} value={location} onChangeText={setLocation} placeholder={t('form.locationPlaceholder')} error={errors.location} leftIcon={<Ionicons name="location-outline" size={18} color={colors.textSecondary} />} />

              <View style={styles.financialCard}>
                <Text style={styles.financialTitle}>FINANCIAL DETAILS</Text>
                <AppInput label={t('form.totalValue')} value={totalValue} onChangeText={(val) => setTotalValue(val.replace(/[^0-9.]/g, ''))} placeholder="0" keyboardType="numeric" error={errors.totalValue} />
                <AppInput label={t('form.profit')} value={profit} onChangeText={(val) => setProfit(val.replace(/[^0-9.-]/g, ''))} placeholder="0" keyboardType="numeric" error={errors.profit} />
                <AppInput label={t('form.totalExpense')} value={totalExpense} onChangeText={(val) => setTotalExpense(val.replace(/[^0-9.]/g, ''))} placeholder="0" keyboardType="numeric" error={errors.totalExpense} />
              </View>

              <Text style={styles.label}>Trip Status</Text>
              <TouchableOpacity style={styles.picker} onPress={() => setShowStatusPicker((v) => !v)} activeOpacity={0.7}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor(tripStatus) }]} />
                  <Text style={styles.pickerText}>{tripStatus}</Text>
                </View>
                <Ionicons name={showStatusPicker ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              {showStatusPicker && (
                <View style={styles.inlineDropdown}>
                  {TRIP_STATUSES.map((p) => (
                    <TouchableOpacity key={p} style={styles.option} onPress={() => { setTripStatus(p); setShowStatusPicker(false); }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><View style={[styles.statusDot, { backgroundColor: statusColor(p) }]} /><Text style={styles.optionText}>{p}</Text></View>{tripStatus === p && <Ionicons name="checkmark" size={18} color={colors.primary} />}</TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={[styles.label, { marginTop: 12 }]}>{t('form.paymentStatus')}</Text>
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

              <AppButton title={editing ? t('list.updateTrip') : t('list.saveTrip')} onPress={handleSave} loading={saving} style={{ marginTop: 16 }} />
            </ScrollView>
          </View></View>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmationModal visible={!!deleteId} title={t('list.deleteTrip')} message={t('list.deleteTripMsg')} confirmText={t('common.delete')} cancelText={t('common.cancel')} icon="trash-outline" iconColor={colors.error} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
      <SuccessModal visible={showSuccess} title={successMsg} message={t('common.success')} onClose={() => setShowSuccess(false)} />
    </ScreenContainer>
  );
}

function TripCard({ item, colors, styles, onMenu, onPress }: any) {
  const status = (item.status as TripStatus) || 'Pending';
  const isPending = status === 'Pending';
  const isCompleted = status === 'Completed';
  const isActive = status === 'Active';
  const avatarBg = isPending ? '#FFF7ED' : isCompleted ? '#ECFDF5' : isActive ? '#EFF6FF' : '#FEF2F2';
  const iconColor = isPending ? '#F59E0B' : isCompleted ? '#10B981' : isActive ? '#2563EB' : '#EF4444';

  const pillBg = isPending ? '#FFF7ED' : isCompleted ? '#ECFDF5' : isActive ? '#EFF6FF' : '#FEF2F2';
  const pillTextColor = iconColor;
  const truckPill = item.truckNumber || item.vehicleNumber || '—';
  const isRedPill = truckPill === 'RED' || truckPill.length <= 3;
  const truckPillBg = isRedPill ? '#FEF2F2' : '#EFF6FF';
  const truckPillColor = isRedPill ? '#DC2626' : '#2563EB';

  return (
    <TouchableOpacity style={styles.tripCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.tripTopRow}>
        <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
          <Ionicons name="bus" size={24} color={iconColor} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text style={styles.tripMaterial}>{item.material || 'Trip'}</Text>
            <View style={[styles.truckPill, { backgroundColor: truckPillBg, borderColor: truckPillBg }]}>
              <Text style={[styles.truckPillText, { color: truckPillColor }]} numberOfLines={1}>{truckPill}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 }}>
            <Ionicons name="location-sharp" size={14} color={colors.textTertiary} />
            <Text style={styles.tripRoute} numberOfLines={1}>{item.location || `${item.supplierName} → ${item.clientName}`}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 }}>
            <Ionicons name="person-outline" size={14} color={colors.textTertiary} />
            <Text style={styles.tripPerson} numberOfLines={1}>{item.clientName || item.supplierName || '—'}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 }}>
            <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
            <Text style={styles.tripDate}>{formatDate(item.date)}</Text>
            <View style={[styles.statusPill, { backgroundColor: pillBg }]}>
              <View style={[styles.statusDotSmall, { backgroundColor: iconColor }]} />
              <Text style={[styles.statusPillText, { color: pillTextColor }]}>{status}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={onMenu} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.dotsBtn}>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <View style={styles.financeRow}>
        <View style={styles.financeCol}>
          <Text style={styles.financeLabel}>Revenue</Text>
          <Text style={[styles.financeValue, { color: '#2563EB' }]}>₹{formatMoney(item.totalValue)}</Text>
        </View>
        <View style={styles.financeDivider} />
        <View style={styles.financeCol}>
          <Text style={styles.financeLabel}>Expense</Text>
          <Text style={[styles.financeValue, { color: '#DC2626' }]}>₹{formatMoney(item.totalExpense)}</Text>
        </View>
        <View style={styles.financeDivider} />
        <View style={styles.financeCol}>
          <Text style={styles.financeLabel}>Profit</Text>
          <Text style={[styles.financeValue, { color: '#059669' }]}>₹{formatMoney(item.profit)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function formatMoney(v: string | number | undefined) {
  const n = Number(v) || 0;
  return n.toLocaleString('en-IN');
}
function formatK(n: number) {
  if (n >= 1000) return `₹${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}
function formatDate(iso: string) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return iso; }
}
function formatGroupLabel(iso: string, today: string, yesterday: string) {
  if (iso === today) return 'Today';
  if (iso === yesterday) return 'Yesterday';
  if (!iso) return 'Other';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return iso; }
}
function statusColor(s: string) {
  if (s === 'Pending') return '#F59E0B';
  if (s === 'Active') return '#2563EB';
  if (s === 'Completed') return '#10B981';
  if (s === 'Cancelled') return '#EF4444';
  return '#94A3B8';
}

const makeStyles = (colors: any) => StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: spacing.base, paddingTop: 8, paddingBottom: 16 },
  headerTitle: { ...typography.headingMedium, color: '#0F172A', fontSize: 28, fontWeight: '800' },
  headerSub: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4 },
  newTripBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2563EB', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  newTripText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.base, gap: 12, marginBottom: 16 },
  statCard: { width: '47.5%', backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  statIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { ...typography.headingSmall, color: '#0F172A', fontWeight: '800', fontSize: 22 },
  statLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 2, fontSize: 12 },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, marginBottom: 10 },
  groupTitle: { ...typography.bodySmall, color: '#0F172A', fontWeight: '700', fontSize: 14 },
  groupCount: { ...typography.caption, color: colors.textSecondary, fontSize: 12 },
  tripCard: { marginHorizontal: spacing.base, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  tripTopRow: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  tripMaterial: { ...typography.body, fontWeight: '800', color: '#0F172A', fontSize: 16 },
  truckPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  truckPillText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  tripRoute: { ...typography.bodySmall, color: colors.textSecondary, fontSize: 13, flex: 1 },
  tripPerson: { ...typography.bodySmall, color: colors.textSecondary, fontSize: 13 },
  tripDate: { ...typography.caption, color: colors.textSecondary, fontSize: 12 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusDotSmall: { width: 7, height: 7, borderRadius: 3.5 },
  statusPillText: { fontSize: 12, fontWeight: '700' },
  dotsBtn: { padding: 4, marginLeft: 8 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginTop: 12 },
  financeRow: { flexDirection: 'row', marginTop: 12, backgroundColor: '#F8FAFC', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 6, borderWidth: 1, borderColor: '#F1F5F9' },
  financeCol: { flex: 1, alignItems: 'center', gap: 2 },
  financeLabel: { ...typography.caption, color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
  financeValue: { fontSize: 15, fontWeight: '800', marginTop: 2 },
  financeDivider: { width: 1, backgroundColor: '#E2E8F0', marginHorizontal: 6 },
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
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.base, paddingBottom: spacing.xl, maxHeight: '90%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.base },
  sheetTitle: { ...typography.headingSmall, color: colors.textPrimary },
  label: { ...typography.label, color: colors.textPrimary, marginBottom: 6, marginTop: 4 },
  picker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 14, backgroundColor: colors.surface, marginBottom: 4 },
  pickerText: { ...typography.body, color: colors.textPrimary },
  pickerPlaceholder: { ...typography.body, color: colors.textTertiary },
  errorText: { ...typography.caption, color: colors.error, marginBottom: 8 },
  inlineDropdown: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.base, marginTop: -4, maxHeight: 220 },
  singleTruck: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.primarySurface, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 14, marginBottom: 8 },
  singleTruckText: { ...typography.body, fontWeight: '700', color: colors.primary, flex: 1 },
  singleBadge: { backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full },
  singleBadgeText: { ...typography.caption, color: colors.white, fontWeight: '700', fontSize: 10 },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  counterBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  counterValue: { minWidth: 60, paddingVertical: 10, paddingHorizontal: 16, borderRadius: radius.md, backgroundColor: colors.primarySurface, borderWidth: 1, borderColor: colors.primary, alignItems: 'center' },
  counterText: { ...typography.headingSmall, color: colors.primary, textAlign: 'center' },
  financialCard: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.base, marginVertical: spacing.base, backgroundColor: colors.surface },
  financialTitle: { ...typography.labelSmall, color: colors.textSecondary, letterSpacing: 0.8, marginBottom: spacing.sm, fontWeight: '700' },
  option: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  optionText: { ...typography.body, color: colors.textPrimary },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
});
