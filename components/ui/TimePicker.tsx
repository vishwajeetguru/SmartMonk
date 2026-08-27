import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';

interface TimePickerProps {
  label?: string;
  value: string; // HH:mm (24h)
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export function TimePicker({ label, value, onChange, placeholder = 'Select time', error }: TimePickerProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = makeStyles(colors);

  const [open, setOpen] = useState(false);

  function parse(val: string | undefined) {
    if (!val) return { h12: 9, min: 0, ampm: 'AM' as 'AM' | 'PM' };
    const [h, m] = val.split(':').map(Number);
    const hh = isNaN(h) ? 9 : h;
    const mm = isNaN(m) ? 0 : m;
    const ampm: 'AM' | 'PM' = hh >= 12 ? 'PM' : 'AM';
    const h12 = hh % 12 === 0 ? 12 : hh % 12;
    return { h12, min: mm, ampm };
  }

  const [hour12, setHour12] = useState(() => parse(value).h12);
  const [minute, setMinute] = useState(() => parse(value).min);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>(() => parse(value).ampm);

  useEffect(() => {
    if (open && value) {
      const p = parse(value);
      setHour12(p.h12);
      setMinute(p.min);
      setAmpm(p.ampm);
    }
  }, [open, value]);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const formatDisplay = (val: string) => {
    if (!val) return '';
    const [h, m] = val.split(':');
    const hh = parseInt(h, 10);
    const mm = parseInt(m, 10);
    if (isNaN(hh) || isNaN(mm)) return val;
    const ampm = hh >= 12 ? 'PM' : 'AM';
    const h12 = hh % 12 === 0 ? 12 : hh % 12;
    return `${String(h12).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${ampm}`;
  };

  const confirm = () => {
    let h = hour12 % 12;
    if (ampm === 'PM') h += 12;
    const newVal = `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    onChange(newVal);
    setOpen(false);
  };

  return (
    <View style={{ marginBottom: spacing.base }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity style={[styles.button, error ? styles.buttonError : null]} onPress={() => setOpen((v) => !v)} activeOpacity={0.7}>
        <View style={styles.buttonLeft}>
          <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.buttonText, !value && styles.placeholder]}>{value ? formatDisplay(value) : placeholder}</Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {open && (
        <View style={styles.inlineContainer}>
          <View style={styles.pickerRow}>
            <View style={styles.pickerCol}>
              <Text style={styles.pickerLabel}>Hour</Text>
              <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                {hours.map((h) => (
                  <TouchableOpacity key={h} style={[styles.pickerItem, hour12 === h && styles.pickerItemActive]} onPress={() => setHour12(h)}>
                    <Text style={[styles.pickerItemText, hour12 === h && styles.pickerItemTextActive]}>{String(h).padStart(2, '0')}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <Text style={styles.colon}>:</Text>
            <View style={styles.pickerCol}>
              <Text style={styles.pickerLabel}>Minute</Text>
              <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                {minutes.map((m) => (
                  <TouchableOpacity key={m} style={[styles.pickerItem, minute === m && styles.pickerItemActive]} onPress={() => setMinute(m)}>
                    <Text style={[styles.pickerItemText, minute === m && styles.pickerItemTextActive]}>{String(m).padStart(2, '0')}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.ampmRow}>
            {(['AM', 'PM'] as const).map((ap) => (
              <TouchableOpacity key={ap} style={[styles.ampmBtn, ampm === ap && styles.ampmBtnActive]} onPress={() => setAmpm(ap)} activeOpacity={0.8}>
                <Text style={[styles.ampmText, ampm === ap && styles.ampmTextActive]}>{ap}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setOpen(false)}>
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={confirm}>
              <Text style={styles.confirmText}>{t('common.confirm')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
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
    backgroundColor: colors.surface,
    minHeight: 52,
  },
  buttonError: { borderColor: colors.error },
  buttonLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  buttonText: { ...typography.body, color: colors.textPrimary, flex: 1 },
  placeholder: { color: colors.textTertiary },
  errorText: { ...typography.caption, color: colors.error, marginTop: spacing.xs },
  inlineContainer: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  pickerRow: { flexDirection: 'row', paddingHorizontal: spacing.base, gap: spacing.sm, height: 220, alignItems: 'center' },
  pickerCol: { flex: 1, borderWidth: 1, borderColor: colors.borderLight, borderRadius: radius.md, overflow: 'hidden' },
  colon: { ...typography.headingSmall, color: colors.textPrimary },
  pickerLabel: { ...typography.labelSmall, color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.xs, backgroundColor: colors.backgroundSecondary, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  pickerScroll: { flex: 1 },
  pickerItem: { paddingVertical: spacing.sm, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  pickerItemActive: { backgroundColor: colors.primary },
  pickerItemText: { ...typography.bodySmall, color: colors.textPrimary },
  pickerItemTextActive: { color: colors.white, fontWeight: '700' },
  ampmRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, justifyContent: 'center' },
  ampmBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.surface },
  ampmBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  ampmText: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  ampmTextActive: { color: colors.white },
  footer: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.base, paddingTop: spacing.base, marginTop: spacing.base, borderTopWidth: 1, borderTopColor: colors.borderLight },
  cancelButton: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center' },
  cancelText: { ...typography.button, color: colors.textPrimary },
  confirmButton: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center' },
  confirmText: { ...typography.button, color: colors.white },
});
