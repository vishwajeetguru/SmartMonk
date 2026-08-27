import React, { useCallback, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, KeyboardAvoidingView, Platform, ScrollView, Image, Alert, Linking } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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
import { expenseApi } from '../../services/api/expenses';
import { tripApi } from '../../services/api/trips';
import { Expense, EXPENSE_CATEGORIES, ExpenseCategory } from '../../types/expense';
import { Trip } from '../../types/trip';
import { useProfile } from '../../hooks/useProfile';

const CATEGORY_FILTERS: FilterOption[] = EXPENSE_CATEGORIES.map((c) => ({
  label: c,
  value: c,
  dotColor: c === 'Fuel' ? '#2563EB' : c === 'Repair' ? '#DC2626' : c === 'Toll' ? '#7C3AED' : c === 'Bhatta' ? '#059669' : '#64748B',
}));

function categoryMeta(cat: ExpenseCategory) {
  switch (cat) {
    case 'Fuel': return { icon: 'flame' as const, color: '#2563EB', bg: '#EFF6FF' };
    case 'Repair': return { icon: 'construct' as const, color: '#DC2626', bg: '#FEF2F2' };
    case 'Toll': return { icon: 'car-sport' as const, color: '#7C3AED', bg: '#F5F3FF' };
    case 'Bhatta': return { icon: 'people' as const, color: '#059669', bg: '#ECFDF5' };
    default: return { icon: 'cube' as const, color: '#64748B', bg: '#F1F5F9' };
  }
}

export default function ExpenseScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { profile, loadProfile } = useProfile();

  const [list, setList] = useState<Expense[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [category, setCategory] = useState<ExpenseCategory>('Fuel');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [tripId, setTripId] = useState('');
  const [odometer, setOdometer] = useState('');
  const [liters, setLiters] = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCategory, setShowCategory] = useState(false);
  const [showVehicle, setShowVehicle] = useState(false);
  const [showTrip, setShowTrip] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [menuExpense, setMenuExpense] = useState<Expense | null>(null);
  const [showCopied, setShowCopied] = useState(false);

  const vehicles = profile?.vehicles || [];

  const load = useCallback(async () => {
    try {
      const [expenses, tripList] = await Promise.all([expenseApi.getAll(), tripApi.getAll()]);
      setList(expenses);
      setTrips(tripList);
    } catch (e) { console.error(e); }
  }, []);

  useFocusEffect(useCallback(() => { load(); loadProfile(''); }, [load]));

  const filtered = useMemo(() => {
    let r = list;
    if (filter !== 'All') r = r.filter((e) => e.category === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((e) => [e.category, e.vehicleNumber, e.notes, e.tripId].some((v) => (v || '').toLowerCase().includes(q)));
    }
    return [...r].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [list, filter, search]);

  const grouped = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const map = new Map<string, Expense[]>();
    filtered.forEach((e) => {
      const k = e.date || '';
      const label = k === today ? 'Today' : k === y ? 'Yesterday' : k ? new Date(k).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Other';
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(e);
    });
    const order = ['Today', 'Yesterday'];
    const sorted = Array.from(map.keys()).sort((a, b) => { const ai = order.indexOf(a); const bi = order.indexOf(b); if (ai !== -1 || bi !== -1) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi); return 0; });
    return sorted.map((k) => ({ title: k, data: map.get(k)! }));
  }, [filtered]);

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    const m = now.getMonth(); const y = now.getFullYear();
    const thisMonth = list.filter((e) => { const d = new Date(e.date); return d.getMonth() === m && d.getFullYear() === y; });
    const monthTotal = thisMonth.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const fuelTotal = list.filter((e) => e.category === 'Fuel').reduce((s, e) => s + (Number(e.amount) || 0), 0);
    let kmSum = 0; let fuelAmt = 0;
    // global km/l using odometer segments
    const fuelByVehicle = new Map<string, Expense[]>();
    list.filter((e) => e.category === 'Fuel' && e.odometer && e.liters).forEach((e) => {
      const k = e.vehicleNumber || '_all';
      if (!fuelByVehicle.has(k)) fuelByVehicle.set(k, []);
      fuelByVehicle.get(k)!.push(e);
    });
    fuelByVehicle.forEach((arr) => {
      const sorted = [...arr].sort((a, b) => Number(a.odometer) - Number(b.odometer));
      for (let i = 1; i < sorted.length; i++) {
        const dist = Number(sorted[i].odometer) - Number(sorted[i - 1].odometer);
        const liters = Number(sorted[i].liters) || 0;
        if (dist > 0 && liters > 0) { kmSum += dist; fuelAmt += Number(sorted[i].amount) || 0; }
      }
    });
    const avgKmL = kmSum > 0 && fuelAmt > 0 ? (kmSum / (list.filter((e) => e.category === 'Fuel' && e.liters).reduce((s, e) => s + (Number(e.liters) || 0), 0) || 1)) : 0;
    const costPerKm = kmSum > 0 ? fuelAmt / kmSum : 0;
    return { monthTotal, fuelTotal, avgKmL, costPerKm };
  }, [list]);

  // Per-truck analytics
  const perTruck = useMemo(() => {
    const map = new Map<string, { vehicle: string; fuelCost: number; distance: number; avgKmL: number; costPerKm: number; trips: number }>();
    const fuelByVehicle = new Map<string, Expense[]>();
    list.filter((e) => e.category === 'Fuel' && e.odometer && e.liters).forEach((e) => {
      const k = e.vehicleNumber || 'Unknown';
      if (!fuelByVehicle.has(k)) fuelByVehicle.set(k, []);
      fuelByVehicle.get(k)!.push(e);
    });
    // init all vehicles
    const allVehicles = new Set<string>([...vehicles.map((v) => v.number), ...list.filter((e) => e.vehicleNumber).map((e) => e.vehicleNumber!)]);
    allVehicles.forEach((vn) => {
      if (!map.has(vn)) map.set(vn, { vehicle: vn, fuelCost: 0, distance: 0, avgKmL: 0, costPerKm: 0, trips: 0 });
    });
    fuelByVehicle.forEach((arr, vn) => {
      const sorted = [...arr].sort((a, b) => Number(a.odometer) - Number(b.odometer));
      let dist = 0; let cost = 0; let liters = 0;
      for (let i = 0; i < sorted.length; i++) cost += Number(sorted[i].amount) || 0;
      for (let i = 1; i < sorted.length; i++) {
        const d = Number(sorted[i].odometer) - Number(sorted[i - 1].odometer);
        const l = Number(sorted[i].liters) || 0;
        if (d > 0 && l > 0) { dist += d; liters += l; }
      }
      const entry = map.get(vn)!;
      entry.fuelCost = cost;
      entry.distance = dist;
      entry.avgKmL = dist > 0 && liters > 0 ? dist / liters : 0;
      entry.costPerKm = dist > 0 ? cost / dist : 0;
    });
    // add non-fuel expense cost to fuelCost? No, keep fuelCost separate; total cost includes all categories per vehicle
    list.forEach((e) => {
      if (e.vehicleNumber && e.category !== 'Fuel') {
        const ent = map.get(e.vehicleNumber);
        if (ent) ent.fuelCost += Number(e.amount) || 0;
      }
    });
    // trip counts
    trips.forEach((tr) => {
      const vn = tr.truckNumber || tr.vehicleNumber;
      if (vn && map.has(vn)) map.get(vn)!.trips += 1;
    });
    return Array.from(map.values()).filter((v) => v.vehicle !== 'Unknown' || v.fuelCost > 0 || v.trips > 0);
  }, [list, vehicles, trips]);

  const openAdd = () => {
    setEditing(null); setCategory('Fuel'); setAmount(''); setDate(new Date().toISOString().slice(0, 10)); setVehicleNumber(vehicles[0]?.number || ''); setTripId(''); setOdometer(''); setLiters(''); setReceiptUrl(null); setNotes(''); setErrors({}); setShowAdd(true);
  };
  const openEdit = (item: Expense) => {
    setMenuExpense(null); setEditing(item); setCategory(item.category); setAmount(item.amount); setDate(item.date); setVehicleNumber(item.vehicleNumber || ''); setTripId(item.tripId || ''); setOdometer(item.odometer || ''); setLiters(item.liters || ''); setReceiptUrl(item.receiptUrl || null); setNotes(item.notes || ''); setErrors({}); setShowAdd(true);
  };

  const validate = (): boolean => {
    const err: Record<string, string> = {};
    if (!category) err.category = 'Select category';
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) err.amount = 'Enter valid amount';
    if (!date) err.date = 'Date required';
    if (category === 'Fuel' && liters && isNaN(Number(liters))) err.liters = 'Invalid liters';
    if (category === 'Fuel' && odometer && isNaN(Number(odometer))) err.odometer = 'Invalid odometer';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const captureReceipt = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (perm.status !== 'granted') return;
      const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7 });
      if (!res.canceled && res.assets[0]) setReceiptUrl(res.assets[0].uri);
    } catch {}
  };
  const pickReceipt = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') return;
      const res = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.7 });
      if (!res.canceled && res.assets[0]) setReceiptUrl(res.assets[0].uri);
    } catch {}
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      let finalReceipt = receiptUrl;
      if (receiptUrl && receiptUrl.startsWith('file://')) {
        try { finalReceipt = await expenseApi.uploadReceipt(receiptUrl); } catch {}
      }
      const data: any = { category, amount, date, vehicleNumber: vehicleNumber || null, tripId: tripId || null, odometer: odometer || null, liters: liters || null, receiptUrl: finalReceipt, notes: notes || null };
      if (editing) { await expenseApi.update(editing.id, data); setSuccessMsg('Expense updated'); } else { await expenseApi.add(data); setSuccessMsg('Expense added'); }
      setShowAdd(false); setShowSuccess(true); load();
    } catch (e: any) { setErrors({ amount: e?.message || 'Failed' }); } finally { setSaving(false); }
  };

  const handleDelete = async () => { if (!deleteId) return; try { await expenseApi.remove(deleteId); } catch {} setDeleteId(null); setMenuExpense(null); load(); };

  const formatExpense = (e: Expense) => `Expense: ${e.category} - ₹${e.amount}\nDate: ${e.date}\nVehicle: ${e.vehicleNumber || '-'}${e.odometer ? `\nOdo: ${e.odometer} km` : ''}${e.liters ? ` • ${e.liters}L` : ''}\nNotes: ${e.notes || '-'}`;
  const handleCopy = async (e: Expense) => { await Clipboard.setStringAsync(formatExpense(e)); setMenuExpense(null); setShowCopied(true); setTimeout(() => setShowCopied(false), 2000); };
  const handleShare = async (e: Expense) => { const url = `https://wa.me/?text=${encodeURIComponent(formatExpense(e))}`; setMenuExpense(null); Linking.openURL(url).catch(() => {}); };

  const menuItems: ActionMenuItem[] = menuExpense ? [
    { label: 'Edit Expense', icon: 'pencil-outline', onPress: () => openEdit(menuExpense) },
    { label: 'Share on WhatsApp', icon: 'logo-whatsapp', color: '#25D366', onPress: () => handleShare(menuExpense) },
    { label: 'Copy details', icon: 'copy-outline', onPress: () => handleCopy(menuExpense) },
    { label: 'Delete Expense', icon: 'trash-outline', color: colors.error, divider: true, onPress: () => { setDeleteId(menuExpense.id); setMenuExpense(null); } },
  ] : [];

  return (
    <ScreenContainer safeArea padded={false} style={{ backgroundColor: '#F8FAFC' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <ScreenHeader title="Expenses" subtitle="Track fuel, repair, toll & bhatta" actionLabel="Add Expense" onAction={openAdd} onBack={() => (router.canGoBack() ? router.back() : router.replace('/(app)/home'))} />

        <StatsGrid>
          <StatCard icon="calendar" iconBg="#EFF6FF" iconColor="#2563EB" value={`₹${stats.monthTotal.toLocaleString('en-IN')}`} label="This Month" />
          <StatCard icon="flame" iconBg="#FFF7ED" iconColor="#F59E0B" value={`₹${stats.fuelTotal.toLocaleString('en-IN')}`} label="Fuel" />
          <StatCard icon="speedometer" iconBg="#ECFDF5" iconColor="#059669" value={stats.avgKmL ? `${stats.avgKmL.toFixed(1)} km/l` : '-'} label="Avg Mileage" />
          <StatCard icon="cash" iconBg="#F5F3FF" iconColor="#7C3AED" value={stats.costPerKm ? `₹${stats.costPerKm.toFixed(1)}` : '-'} label="Cost / km" />
        </StatsGrid>

        <SearchFilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Search by category, vehicle, notes..." filter={filter} onFilterChange={setFilter} filterOptions={CATEGORY_FILTERS} filterTitle="Filter by Category" />

        {/* Per-truck analytics */}
        {perTruck.length > 0 && (
          <View style={styles.analytics}>
            <Text style={styles.analyticsTitle}>Per-Truck Analytics</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {perTruck.map((row) => (
                <View key={row.vehicle} style={styles.truckCard}>
                  <Text style={styles.truckName}>{row.vehicle}</Text>
                  <View style={styles.miniRow}><Text style={styles.miniLabel}>Fuel</Text><Text style={styles.miniValue}>₹{row.fuelCost.toLocaleString('en-IN')}</Text></View>
                  <View style={styles.miniRow}><Text style={styles.miniLabel}>Distance</Text><Text style={styles.miniValue}>{row.distance ? `${row.distance.toLocaleString('en-IN')} km` : '-'}</Text></View>
                  <View style={styles.miniRow}><Text style={styles.miniLabel}>Avg</Text><Text style={[styles.miniValue, { color: colors.primary }]}>{row.avgKmL ? `${row.avgKmL.toFixed(1)} km/l` : '-'}</Text></View>
                  <View style={styles.miniRow}><Text style={styles.miniLabel}>Cost/km</Text><Text style={styles.miniValue}>{row.costPerKm ? `₹${row.costPerKm.toFixed(2)}` : '-'}</Text></View>
                  <Text style={styles.miniTrips}>{row.trips} trip(s)</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {filtered.length === 0 ? (
          <View style={styles.empty}><Ionicons name="wallet-outline" size={48} color={colors.muted} /><Text style={styles.emptyText}>No expenses yet</Text></View>
        ) : (
          grouped.map((g) => (
            <View key={g.title} style={{ marginBottom: 16 }}>
              <View style={styles.groupHeader}><Text style={styles.groupTitle}>{g.title}</Text><Text style={styles.groupCount}>{g.data.length}</Text></View>
              <View style={{ gap: 10 }}>
                {g.data.map((item) => (
                  <ExpenseCard key={item.id} item={item} trips={trips} onMenu={() => setMenuExpense(item)} onPress={() => openEdit(item)} />
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <ActionMenu visible={!!menuExpense} onClose={() => setMenuExpense(null)} items={menuItems} />
      {showCopied && <View style={styles.toast} pointerEvents="none"><Ionicons name="checkmark-circle" size={18} color="#fff" /><Text style={styles.toastText}>Copied</Text></View>}

      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
          <View style={styles.overlay}><View style={styles.sheet}>
            <View style={styles.sheetHeader}><Text style={styles.sheetTitle}>{editing ? 'Edit Expense' : 'Add Expense'}</Text><TouchableOpacity onPress={() => setShowAdd(false)}><Ionicons name="close" size={24} color={colors.textPrimary} /></TouchableOpacity></View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: spacing.base }}>
              <Text style={styles.label}>Category *</Text>
              <View style={styles.chipRow}>
                {EXPENSE_CATEGORIES.map((c) => (
                  <TouchableOpacity key={c} style={[styles.chip, category === c && styles.chipActive]} onPress={() => setCategory(c)} activeOpacity={0.8}>
                    <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}

              <AppInput label="Amount (₹) *" value={amount} onChangeText={setAmount} placeholder="2500" keyboardType="numeric" error={errors.amount} leftIcon={<Ionicons name="cash-outline" size={18} color={colors.textSecondary} />} />
              <DatePicker label="Date *" value={date} onChange={setDate} error={errors.date} inline />

              <Text style={styles.label}>Vehicle</Text>
              <TouchableOpacity style={styles.picker} onPress={() => setShowVehicle((v) => !v)} activeOpacity={0.7}>
                <Text style={vehicleNumber ? styles.pickerText : styles.pickerPlaceholder}>{vehicleNumber || (vehicles.length ? 'Select vehicle' : 'No vehicles')}</Text>
                <Ionicons name={showVehicle ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              {showVehicle && (
                <View style={styles.inlineDropdown}>
                  <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled>
                    <TouchableOpacity style={styles.option} onPress={() => { setVehicleNumber(''); setShowVehicle(false); }}><Text style={styles.optionText}>None</Text></TouchableOpacity>
                    {vehicles.map((v) => (
                      <TouchableOpacity key={v.id} style={styles.option} onPress={() => { setVehicleNumber(v.number); setShowVehicle(false); }}><Text style={styles.optionText}>{v.number}</Text>{vehicleNumber === v.number && <Ionicons name="checkmark" size={18} color={colors.primary} />}</TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <Text style={styles.label}>Link to Trip (optional)</Text>
              <TouchableOpacity style={styles.picker} onPress={() => setShowTrip((v) => !v)} activeOpacity={0.7}>
                <Text style={tripId ? styles.pickerText : styles.pickerPlaceholder} numberOfLines={1}>{tripId ? trips.find((t) => t.id === tripId)?.material + ' - ' + trips.find((t) => t.id === tripId)?.date : 'None'}</Text>
                <Ionicons name={showTrip ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              {showTrip && (
                <View style={styles.inlineDropdown}>
                  <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled>
                    <TouchableOpacity style={styles.option} onPress={() => { setTripId(''); setShowTrip(false); }}><Text style={styles.optionText}>None</Text></TouchableOpacity>
                    {trips.slice(0, 20).map((tr) => (
                      <TouchableOpacity key={tr.id} style={styles.option} onPress={() => { setTripId(tr.id); setShowTrip(false); }}><View><Text style={styles.optionText}>{tr.material} • {tr.truckNumber}</Text><Text style={styles.optionSub}>{tr.date} • {tr.clientName}</Text></View>{tripId === tr.id && <Ionicons name="checkmark" size={18} color={colors.primary} />}</TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {category === 'Fuel' && (
                <View style={styles.fuelBox}>
                  <Text style={styles.fuelTitle}>Fuel Details</Text>
                  <AppInput label="Odometer (km)" value={odometer} onChangeText={setOdometer} placeholder="125000" keyboardType="numeric" leftIcon={<Ionicons name="speedometer-outline" size={18} color={colors.textSecondary} />} />
                  <AppInput label="Liters" value={liters} onChangeText={setLiters} placeholder="45" keyboardType="numeric" leftIcon={<Ionicons name="water-outline" size={18} color={colors.textSecondary} />} />
                </View>
              )}

              <View style={styles.receiptBox}>
                <Text style={styles.label}>Receipt Photo</Text>
                {receiptUrl ? <Image source={{ uri: receiptUrl }} style={styles.receiptImg} /> : <View style={styles.receiptPlaceholder}><Ionicons name="image-outline" size={36} color={colors.muted} /><Text style={styles.receiptHint}>No receipt</Text></View>}
                <View style={styles.receiptRow}>
                  <TouchableOpacity style={styles.receiptBtn} onPress={captureReceipt}><Ionicons name="camera" size={18} color={colors.white} /><Text style={styles.receiptBtnText}>Camera</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.receiptBtn, styles.receiptBtnSec]} onPress={pickReceipt}><Ionicons name="images-outline" size={18} color={colors.primary} /><Text style={[styles.receiptBtnText, { color: colors.primary }]}>Gallery</Text></TouchableOpacity>
                  {receiptUrl ? <TouchableOpacity style={styles.receiptRemove} onPress={() => setReceiptUrl(null)}><Ionicons name="trash-outline" size={18} color={colors.error} /></TouchableOpacity> : null}
                </View>
              </View>

              <AppInput label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional" multiline />

              <AppButton title={editing ? 'Update' : 'Save Expense'} onPress={handleSave} loading={saving} />
            </ScrollView>
          </View></View>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmationModal visible={!!deleteId} title="Delete Expense" message="Delete this expense?" confirmText="Delete" cancelText="Cancel" icon="trash-outline" iconColor={colors.error} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
      <SuccessModal visible={showSuccess} title={successMsg} onClose={() => setShowSuccess(false)} />
    </ScreenContainer>
  );
}

function ExpenseCard({ item, trips, onMenu, onPress }: { item: Expense; trips: Trip[]; onMenu: () => void; onPress: () => void }) {
  const meta = categoryMeta(item.category);
  const trip = item.tripId ? trips.find((t) => t.id === item.tripId) : null;
  return (
    <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={cardStyles.topRow}>
        <View style={[cardStyles.avatar, { backgroundColor: meta.bg }]}><Ionicons name={meta.icon} size={22} color={meta.color} /></View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={cardStyles.catPill}>{item.category}</Text>
            {item.vehicleNumber ? <View style={cardStyles.vehPill}><Text style={cardStyles.vehText}>{item.vehicleNumber}</Text></View> : null}
          </View>
          <Text style={cardStyles.amount}>₹{Number(item.amount).toLocaleString('en-IN')}</Text>
          <Text style={cardStyles.date}>{new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}{item.liters ? ` • ${item.liters}L` : ''}{item.odometer ? ` • ${item.odometer}km` : ''}</Text>
          {trip ? <Text style={cardStyles.link} numberOfLines={1}>↗ {trip.material} • {trip.truckNumber}</Text> : null}
          {item.notes ? <Text style={cardStyles.notes} numberOfLines={1}>{item.notes}</Text> : null}
        </View>
        <View style={{ alignItems: 'center', gap: 8 }}>
          {item.receiptUrl ? <Image source={{ uri: item.receiptUrl }} style={cardStyles.thumb} /> : null}
          <TouchableOpacity onPress={onMenu} hitSlop={10} style={{ padding: 4 }}><Ionicons name="ellipsis-vertical" size={18} color="#64748B" /></TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  catPill: { fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
  vehPill: { backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  vehText: { fontSize: 11, fontWeight: '700', color: '#1D4ED8' },
  amount: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginTop: 6 },
  date: { fontSize: 12, color: '#64748B', marginTop: 2 },
  link: { fontSize: 12, color: '#2563EB', marginTop: 4, fontWeight: '600' },
  notes: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  thumb: { width: 36, height: 36, borderRadius: 8 },
});

const makeStyles = (colors: any) => StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingTop: 8, paddingBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  analytics: { marginHorizontal: spacing.base, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: spacing.base, marginBottom: spacing.base },
  analyticsTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  truckCard: { backgroundColor: colors.backgroundSecondary, borderRadius: 12, padding: 12, minWidth: 140 },
  truckName: { fontSize: 13, fontWeight: '800', color: colors.textPrimary },
  miniRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  miniLabel: { fontSize: 11, color: colors.textSecondary },
  miniValue: { fontSize: 12, fontWeight: '700', color: colors.textPrimary },
  miniTrips: { fontSize: 10, color: colors.textTertiary, marginTop: 4 },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, marginBottom: 8 },
  groupTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  groupCount: { fontSize: 12, color: colors.textSecondary },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 12, padding: spacing.xl, marginTop: 20 },
  emptyText: { ...typography.bodySmall, color: colors.textSecondary },
  label: { ...typography.label, color: colors.textPrimary, marginBottom: 6, marginTop: 4 },
  errorText: { ...typography.caption, color: colors.error, marginBottom: 8 },
  picker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 14, backgroundColor: colors.surface, marginBottom: 4 },
  pickerText: { ...typography.body, color: colors.textPrimary },
  pickerPlaceholder: { ...typography.body, color: colors.textTertiary },
  inlineDropdown: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.base, marginTop: -4 },
  option: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  optionText: { ...typography.body, color: colors.textPrimary },
  optionSub: { ...typography.caption, color: colors.textSecondary },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff' },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: '#fff' },
  fuelBox: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.base, marginVertical: spacing.base, backgroundColor: colors.backgroundSecondary },
  fuelTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5, color: colors.textSecondary, marginBottom: 8 },
  receiptBox: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: spacing.base, marginVertical: spacing.base },
  receiptImg: { width: '100%', height: 160, borderRadius: 10, marginBottom: 10 },
  receiptPlaceholder: { alignItems: 'center', justifyContent: 'center', gap: 6, padding: 20, backgroundColor: colors.backgroundSecondary, borderRadius: 10 },
  receiptHint: { fontSize: 12, color: colors.textTertiary },
  receiptRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', alignItems: 'center' },
  receiptBtn: { flexDirection: 'row', gap: 6, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center' },
  receiptBtnSec: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.primary },
  receiptBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  receiptRemove: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.errorLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.error },
  toast: { position: 'absolute', bottom: 100, left: spacing.base, right: spacing.base, backgroundColor: '#0F172A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, elevation: 8 },
  toastText: { color: '#fff', fontWeight: '700' },
  kav: { flex: 1 },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.base, paddingBottom: spacing.xl, maxHeight: '90%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.base },
  sheetTitle: { ...typography.headingSmall, color: colors.textPrimary },
});
