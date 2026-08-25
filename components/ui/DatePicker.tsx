import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';

interface DatePickerProps {
  label?: string;
  value: string | null; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  minYear?: number;
  maxYear?: number;
  displayFormat?: 'DD_MMM_YYYY' | 'MM_DD_YYYY'; // default DD_MMM_YYYY
  inline?: boolean; // if true, picker expands inline instead of modal (use inside another Modal)
}

export function DatePicker({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  error,
  minYear,
  maxYear,
  displayFormat = 'DD_MMM_YYYY',
  inline = false,
}: DatePickerProps) {
  const now = new Date();
  const defaultMin = minYear ?? now.getFullYear() - 100;
  const defaultMax = maxYear ?? now.getFullYear() - 10;

  const [showModal, setShowModal] = useState(false);
  const [tempYear, setTempYear] = useState(() => {
    if (value) {
      const y = parseInt(value.split('-')[0], 10);
      if (!isNaN(y)) return y;
    }
    return Math.floor((defaultMin + defaultMax) / 2);
  });
  const [tempMonth, setTempMonth] = useState(() => {
    if (value) {
      const m = parseInt(value.split('-')[1], 10);
      if (!isNaN(m)) return m;
    }
    return 6;
  });
  const [tempDay, setTempDay] = useState(() => {
    if (value) {
      const d = parseInt(value.split('-')[2], 10);
      if (!isNaN(d)) return d;
    }
    return 15;
  });

  useEffect(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        if (!isNaN(y)) setTempYear(y);
        if (!isNaN(m)) setTempMonth(m);
        if (!isNaN(d)) setTempDay(d);
      }
    }
  }, [value, showModal]);

  const openPicker = () => setShowModal(true);

  const formatDisplay = (val: string | null) => {
    if (!val) return '';
    const [y, m, d] = val.split('-');
    if (!y || !m || !d) return val;
    if (displayFormat === 'MM_DD_YYYY') {
      return `${m}/${d}/${y}`;
    }
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const idx = parseInt(m, 10) - 1;
    return `${d} ${monthNames[idx] || m} ${y}`;
  };

  const confirm = () => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const daysInMonth = new Date(tempYear, tempMonth, 0).getDate();
    const safeDay = Math.min(tempDay, daysInMonth);
    const newVal = `${tempYear}-${pad(tempMonth)}-${pad(safeDay)}`;
    onChange(newVal);
    setShowModal(false);
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const years = Array.from({ length: defaultMax - defaultMin + 1 }, (_, i) => defaultMax - i);
  const daysInMonth = new Date(tempYear, tempMonth, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const safeDay = Math.min(tempDay, daysInMonth);

  return (
    <View style={{ marginBottom: spacing.base }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        style={[styles.button, error ? styles.buttonError : null]}
        onPress={() => setShowModal((v) => !v)}
        activeOpacity={0.7}
      >
        <View style={styles.buttonLeft}>
          <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.buttonText, !value && styles.placeholder]}>{value ? formatDisplay(value) : placeholder}</Text>
        </View>
        <Ionicons name={showModal ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {inline ? (
        showModal && (
          <View style={styles.inlineContainer}>
            <View style={styles.pickerRow}>
              <View style={styles.pickerCol}>
                <Text style={styles.pickerLabel}>Day</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                  {days.map((d) => (
                    <TouchableOpacity key={d} style={[styles.pickerItem, safeDay === d && styles.pickerItemActive]} onPress={() => setTempDay(d)}>
                      <Text style={[styles.pickerItemText, safeDay === d && styles.pickerItemTextActive]}>{String(d).padStart(2, '0')}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.pickerCol}>
                <Text style={styles.pickerLabel}>Month</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                  {months.map((m, idx) => (
                    <TouchableOpacity key={m} style={[styles.pickerItem, tempMonth === idx + 1 && styles.pickerItemActive]} onPress={() => setTempMonth(idx + 1)}>
                      <Text style={[styles.pickerItemText, tempMonth === idx + 1 && styles.pickerItemTextActive]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.pickerCol}>
                <Text style={styles.pickerLabel}>Year</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                  {years.map((y) => (
                    <TouchableOpacity key={y} style={[styles.pickerItem, tempYear === y && styles.pickerItemActive]} onPress={() => setTempYear(y)}>
                      <Text style={[styles.pickerItemText, tempYear === y && styles.pickerItemTextActive]}>{y}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            <View style={styles.footer}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={confirm}>
                <Text style={styles.confirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        )
      ) : (
        <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
          <View style={styles.overlay}>
            <View style={styles.modalContent}>
              <View style={styles.header}>
                <Text style={styles.title}>Select Date</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Ionicons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <View style={styles.pickerRow}>
                <View style={styles.pickerCol}>
                  <Text style={styles.pickerLabel}>Day</Text>
                  <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                    {days.map((d) => (
                      <TouchableOpacity key={d} style={[styles.pickerItem, safeDay === d && styles.pickerItemActive]} onPress={() => setTempDay(d)}>
                        <Text style={[styles.pickerItemText, safeDay === d && styles.pickerItemTextActive]}>{String(d).padStart(2, '0')}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={styles.pickerCol}>
                  <Text style={styles.pickerLabel}>Month</Text>
                  <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                    {months.map((m, idx) => (
                      <TouchableOpacity key={m} style={[styles.pickerItem, tempMonth === idx + 1 && styles.pickerItemActive]} onPress={() => setTempMonth(idx + 1)}>
                        <Text style={[styles.pickerItemText, tempMonth === idx + 1 && styles.pickerItemTextActive]}>{m}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={styles.pickerCol}>
                  <Text style={styles.pickerLabel}>Year</Text>
                  <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                    {years.map((y) => (
                      <TouchableOpacity key={y} style={[styles.pickerItem, tempYear === y && styles.pickerItemActive]} onPress={() => setTempYear(y)}>
                        <Text style={[styles.pickerItemText, tempYear === y && styles.pickerItemTextActive]}>{y}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.footer}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setShowModal(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmButton} onPress={confirm}>
                  <Text style={styles.confirmText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { ...typography.label, color: colors.textPrimary, marginBottom: spacing.xs },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    minHeight: 52,
  },
  buttonError: { borderColor: colors.error },
  buttonLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  buttonText: { ...typography.body, color: colors.textPrimary, flex: 1 },
  placeholder: { color: colors.textTertiary },
  errorText: { ...typography.caption, color: colors.error, marginTop: spacing.xs },
  inlineContainer: {
    marginTop: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '70%',
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { ...typography.headingSmall, color: colors.textPrimary },
  pickerRow: { flexDirection: 'row', paddingHorizontal: spacing.base, gap: spacing.sm, height: 260 },
  pickerCol: { flex: 1, borderWidth: 1, borderColor: colors.borderLight, borderRadius: radius.md, overflow: 'hidden' },
  pickerLabel: { ...typography.labelSmall, color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.xs, backgroundColor: colors.backgroundSecondary, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  pickerScroll: { flex: 1 },
  pickerItem: { paddingVertical: spacing.sm, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  pickerItemActive: { backgroundColor: colors.primary },
  pickerItemText: { ...typography.bodySmall, color: colors.textPrimary },
  pickerItemTextActive: { color: colors.white, fontWeight: '700' },
  footer: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.base, paddingTop: spacing.base, marginTop: spacing.base, borderTopWidth: 1, borderTopColor: colors.borderLight },
  cancelButton: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center' },
  cancelText: { ...typography.button, color: colors.textPrimary },
  confirmButton: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center' },
  confirmText: { ...typography.button, color: colors.white },
});
