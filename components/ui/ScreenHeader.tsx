import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel: string;
  onAction: () => void;
  actionIcon?: keyof typeof Ionicons.glyphMap;
}

export function ScreenHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  actionIcon = 'add',
}: ScreenHeaderProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  return (
    <View style={styles.row}>
      <View style={styles.titleWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <TouchableOpacity style={styles.actionBtn} onPress={onAction} activeOpacity={0.85}>
        <Ionicons name={actionIcon} size={20} color="#fff" />
        <Text style={styles.actionText}>{actionLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.base,
    paddingTop: 8,
    paddingBottom: 16,
  },
  titleWrap: { flex: 1, paddingRight: 12 },
  title: { ...typography.headingMedium, color: '#0F172A', fontSize: 28, fontWeight: '800' },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
