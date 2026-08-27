import React, { useCallback, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../../theme/ThemeContext';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { AppHeader } from '../../components/ui/AppHeader';
import { tripApi } from '../../services/api/trips';
import { expenseApi } from '../../services/api/expenses';
import { Trip } from '../../types/trip';
import { Expense } from '../../types/expense';

type Period = 'month' | 'last' | 'year' | 'all';
const PERIODS: { id: Period; label: string }[] = [
  { id: 'month', label: 'This Month' },
  { id: 'last', label: 'Last Month' },
  { id: 'year', label: 'This Year' },
  { id: 'all', label: 'All' },
];

function inPeriod(dateStr: string, period: Period): boolean {
  if (period === 'all') return true;
  const d = new Date(dateStr);
  const now = new Date();
  if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  if (period === 'last') { const pm = new Date(now.getFullYear(), now.getMonth() - 1, 1); return d.getMonth() === pm.getMonth() && d.getFullYear() === pm.getFullYear(); }
  if (period === 'year') return d.getFullYear() === now.getFullYear();
  return true;
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(4, (value / max) * 100) : 0;
  return (
    <View style={barStyles.row}>
      <Text style={barStyles.label} numberOfLines={1}>{label}</Text>
      <View style={barStyles.track}><View style={[barStyles.fill, { width: `${pct}%`, backgroundColor: color }]} /></View>
      <Text style={barStyles.value}>{value >= 1000 ? `₹${(value / 1000).toFixed(0)}k` : `₹${value.toLocaleString('en-IN')}`}</Text>
    </View>
  );
}

export default function ReportsScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [period, setPeriod] = useState<Period>('month');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const load = useCallback(async () => {
    try {
      const [t, e] = await Promise.all([tripApi.getAll(), expenseApi.getAll()]);
      setTrips(t); setExpenses(e);
    } catch {}
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filteredTrips = useMemo(() => trips.filter((t) => inPeriod(t.date, period)), [trips, period]);
  const filteredExpenses = useMemo(() => expenses.filter((e) => inPeriod(e.date, period)), [expenses, period]);

  const pnl = useMemo(() => {
    const revenue = filteredTrips.reduce((s, t) => s + (Number(t.totalValue) || 0), 0);
    const tripExp = filteredTrips.reduce((s, t) => s + (Number(t.totalExpense) || 0), 0);
    const addExp = filteredExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const totalExpense = tripExp + addExp;
    const profit = filteredTrips.reduce((s, t) => s + (Number(t.profit) || 0), 0) - addExp;
    const outstanding = trips.filter((t) => t.paymentStatus !== 'Paid').reduce((s, t) => s + (Number(t.totalValue) || 0), 0);
    const outstandingCount = trips.filter((t) => t.paymentStatus !== 'Paid').length;
    return { revenue, totalExpense, profit, outstanding, outstandingCount };
  }, [filteredTrips, filteredExpenses, trips]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpenses.forEach((e) => map.set(e.category, (map.get(e.category) || 0) + (Number(e.amount) || 0)));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [filteredExpenses]);

  const byVehicle = useMemo(() => {
    const map = new Map<string, number>();
    filteredTrips.forEach((t) => { const k = t.truckNumber || t.vehicleNumber || 'Unknown'; map.set(k, (map.get(k) || 0) + (Number(t.profit) || 0)); });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [filteredTrips]);

  const bySupplier = useMemo(() => {
    const map = new Map<string, number>();
    filteredTrips.forEach((t) => { const k = t.supplierName || 'Unknown'; map.set(k, (map.get(k) || 0) + (Number(t.profit) || 0)); });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [filteredTrips]);

  const byClient = useMemo(() => {
    const map = new Map<string, number>();
    filteredTrips.forEach((t) => { const k = t.clientName || 'Unknown'; map.set(k, (map.get(k) || 0) + (Number(t.profit) || 0)); });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [filteredTrips]);

  const generateReportText = () => {
    const lines = [
      `SmartMonk Report - ${period}`,
      `Revenue: ₹${pnl.revenue.toLocaleString('en-IN')}`,
      `Expenses: ₹${pnl.totalExpense.toLocaleString('en-IN')}`,
      `Profit: ₹${pnl.profit.toLocaleString('en-IN')}`,
      `Outstanding: ₹${pnl.outstanding.toLocaleString('en-IN')} (${pnl.outstandingCount} trips)`,
      '',
      'By Vehicle:', ...byVehicle.map(([k, v]) => `  ${k}: ₹${v.toLocaleString('en-IN')}`),
      '',
      'By Supplier:', ...bySupplier.map(([k, v]) => `  ${k}: ₹${v.toLocaleString('en-IN')}`),
      '',
      'By Client:', ...byClient.map(([k, v]) => `  ${k}: ₹${v.toLocaleString('en-IN')}`),
    ];
    return lines.join('\n');
  };

  const generateCsv = () => {
    const rows = [
      ['Type', 'Category/Name', 'Amount'],
      ['Revenue', 'Trips Revenue', String(pnl.revenue)],
      ['Expense', 'Trip Expenses + Additional', String(pnl.totalExpense)],
      ['Profit', 'Net', String(pnl.profit)],
      ['Outstanding', 'Pending Payments', String(pnl.outstanding)],
      [],
      ['Profit by Vehicle', '', ''],
      ...byVehicle.map(([k, v]) => [k, String(v)]),
      [],
      ['Profit by Supplier', '', ''],
      ...bySupplier.map(([k, v]) => [k, String(v)]),
      [],
      ['Profit by Client', '', ''],
      ...byClient.map(([k, v]) => [k, String(v)]),
    ];
    return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  };

  const exportCsv = async () => {
    try {
      const csv = generateCsv();
      const file = new File(Paths.cache, `report_${Date.now()}.csv`);
      file.create({ overwrite: true });
      file.write(csv);
      const uri = file.uri;
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'text/csv' });
      else Alert.alert('CSV ready', uri);
    } catch (e: any) { Alert.alert('Error', e?.message || 'Failed'); }
  };

  const exportPdf = async () => {
    try {
      const html = `
        <html><head><style>
          body { font-family: Helvetica; padding: 24px; color: #0F172A; }
          h1 { color: #2563EB; } h2 { margin-top: 24px; } table { width:100%; border-collapse: collapse; margin-top:8px; } th,td { text-align:left; padding:8px; border:1px solid #E2E8F0; } th { background:#F8FAFC; }
        </style></head><body>
          <h1>SmartMonk Report</h1>
          <p>Period: ${period} | Generated ${new Date().toLocaleString('en-GB')}</p>
          <table><tr><th>Metric</th><th>Amount</th></tr>
            <tr><td>Revenue</td><td>₹${pnl.revenue.toLocaleString('en-IN')}</td></tr>
            <tr><td>Total Expenses</td><td>₹${pnl.totalExpense.toLocaleString('en-IN')}</td></tr>
            <tr><td>Profit</td><td>₹${pnl.profit.toLocaleString('en-IN')}</td></tr>
            <tr><td>Outstanding</td><td>₹${pnl.outstanding.toLocaleString('en-IN')} (${pnl.outstandingCount} trips)</td></tr>
          </table>
          <h2>Profit by Vehicle</h2>
          <table><tr><th>Vehicle</th><th>Profit</th></tr>${byVehicle.map(([k, v]) => `<tr><td>${k}</td><td>₹${v.toLocaleString('en-IN')}</td></tr>`).join('')}</table>
          <h2>Profit by Supplier</h2>
          <table><tr><th>Supplier</th><th>Profit</th></tr>${bySupplier.map(([k, v]) => `<tr><td>${k}</td><td>₹${v.toLocaleString('en-IN')}</td></tr>`).join('')}</table>
          <h2>Profit by Client</h2>
          <table><tr><th>Client</th><th>Profit</th></tr>${byClient.map(([k, v]) => `<tr><td>${k}</td><td>₹${v.toLocaleString('en-IN')}</td></tr>`).join('')}</table>
        </body></html>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
      else Alert.alert('PDF ready', uri);
    } catch (e: any) { Alert.alert('Error', e?.message || 'Failed'); }
  };

  const shareWhatsApp = () => {
    const text = generateReportText();
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`).catch(() => Alert.alert('Error', 'Cannot open WhatsApp'));
  };

  const maxVehicle = Math.max(...byVehicle.map(([, v]) => Math.abs(v)), 1);
  const maxCat = Math.max(...byCategory.map(([, v]) => v), 1);

  return (
    <ScreenContainer safeArea padded={false} style={{ backgroundColor: '#F8FAFC' }}>
      <AppHeader title="Reports" icon="bar-chart-outline" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.base, paddingBottom: 100, gap: 16 }}>
        {/* Period */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {PERIODS.map((p) => (
            <TouchableOpacity key={p.id} onPress={() => setPeriod(p.id)} style={[styles.chip, period === p.id && styles.chipActive]}>
              <Text style={[styles.chipText, period === p.id && styles.chipTextActive]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* P&L */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Profit & Loss</Text>
          <View style={styles.pnlGrid}>
            <View style={styles.pnlItem}><Text style={styles.pnlLabel}>Revenue</Text><Text style={[styles.pnlValue, { color: '#2563EB' }]}>₹{pnl.revenue.toLocaleString('en-IN')}</Text></View>
            <View style={styles.pnlItem}><Text style={styles.pnlLabel}>Expenses</Text><Text style={[styles.pnlValue, { color: '#DC2626' }]}>₹{pnl.totalExpense.toLocaleString('en-IN')}</Text></View>
            <View style={styles.pnlItem}><Text style={styles.pnlLabel}>Profit</Text><Text style={[styles.pnlValue, { color: pnl.profit >= 0 ? '#059669' : '#DC2626' }]}>₹{pnl.profit.toLocaleString('en-IN')}</Text></View>
          </View>
          <View style={styles.outstanding}>
            <Ionicons name="time-outline" size={18} color="#D97706" />
            <Text style={styles.outText}>Outstanding: ₹{pnl.outstanding.toLocaleString('en-IN')} ({pnl.outstandingCount} trips)</Text>
          </View>
        </View>

        {/* Category */}
        {byCategory.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Expenses by Category</Text>
            {byCategory.map(([k, v]) => (
              <Bar key={k} label={k} value={v} max={maxCat} color={k === 'Fuel' ? '#2563EB' : k === 'Repair' ? '#DC2626' : k === 'Toll' ? '#7C3AED' : k === 'Bhatta' ? '#059669' : '#64748B'} />
            ))}
          </View>
        )}

        {/* By Vehicle */}
        {byVehicle.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Profit per Vehicle</Text>
            {byVehicle.map(([k, v]) => <Bar key={k} label={k} value={Math.abs(v)} max={maxVehicle} color={v >= 0 ? '#0F172A' : '#EF4444'} />)}
          </View>
        )}

        {/* By Supplier */}
        {bySupplier.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Profit per Supplier</Text>
            {bySupplier.map(([k, v]) => <Bar key={k} label={k} value={Math.abs(v)} max={Math.max(...bySupplier.map(([, x]) => Math.abs(x)), 1)} color="#2563EB" />)}
          </View>
        )}

        {/* By Client */}
        {byClient.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Profit per Client</Text>
            {byClient.map(([k, v]) => <Bar key={k} label={k} value={Math.abs(v)} max={Math.max(...byClient.map(([, x]) => Math.abs(x)), 1)} color="#7C3AED" />)}
          </View>
        )}

        {/* Export */}
        <View style={styles.exportRow}>
          <TouchableOpacity style={styles.exportBtn} onPress={exportCsv}><Ionicons name="document-text-outline" size={18} color={colors.primary} /><Text style={styles.exportText}>CSV</Text></TouchableOpacity>
          <TouchableOpacity style={styles.exportBtn} onPress={exportPdf}><Ionicons name="print-outline" size={18} color={colors.primary} /><Text style={styles.exportText}>PDF</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.exportBtn, { backgroundColor: '#25D366', borderColor: '#25D366' }]} onPress={shareWhatsApp}><Ionicons name="logo-whatsapp" size={18} color="#fff" /><Text style={[styles.exportText, { color: '#fff' }]}>WhatsApp</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const barStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  label: { width: 80, fontSize: 12, color: '#475569', fontWeight: '600' },
  track: { flex: 1, height: 10, borderRadius: 5, backgroundColor: '#F1F5F9', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
  value: { width: 80, fontSize: 12, fontWeight: '700', color: '#0F172A', textAlign: 'right' },
});

const makeStyles = (colors: any) => StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 14 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  pnlGrid: { flexDirection: 'row', gap: 10 },
  pnlItem: { flex: 1, alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: 12, padding: 10 },
  pnlLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  pnlValue: { fontSize: 16, fontWeight: '800', marginTop: 4 },
  outstanding: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, backgroundColor: '#FFF7ED', borderRadius: 10, padding: 10 },
  outText: { fontSize: 13, color: '#92400E', fontWeight: '600' },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff' },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: '#fff' },
  exportRow: { flexDirection: 'row', gap: 10 },
  exportBtn: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff' },
  exportText: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
});
