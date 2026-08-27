import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

interface AppHeaderProps {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onBack?: () => void;
  right?: React.ReactNode;
  titleStyle?: 'center' | 'left';
}

export function AppHeader({ title, icon, onBack, right, titleStyle = 'center' }: AppHeaderProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const styles = makeStyles(colors);

  const handleBack = () => {
    if (onBack) return onBack();
    if (router.canGoBack()) router.back();
    else router.replace('/(app)/home');
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.side} onPress={handleBack} hitSlop={10}>
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.center}>
        {icon ? <Ionicons name={icon} size={22} color={colors.primary} style={styles.icon} /> : null}
        <Text style={[styles.title, titleStyle === 'left' && styles.titleLeft]} numberOfLines={1}>{title}</Text>
      </View>

      <View style={styles.side}>{right ?? null}</View>
    </View>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  side: { width: 44, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  icon: {},
  title: { ...typography.headingSmall, color: colors.textPrimary, textAlign: 'center' },
  titleLeft: { textAlign: 'left', flex: 1 },
});
