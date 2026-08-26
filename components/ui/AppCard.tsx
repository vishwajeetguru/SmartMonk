import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { shadows } from '../../constants/shadows';

interface AppCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: keyof typeof spacing;
}

export function AppCard({
  children,
  style,
  variant = 'default',
  padding = 'base',
}: AppCardProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const cardStyles = [
    styles.base,
    styles[variant],
    { padding: spacing[padding] },
    variant === 'elevated' && shadows.medium,
    style,
  ];

  return <View style={cardStyles}>{children}</View>;
}

const makeStyles = (colors: any) => StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
  },
  default: {
    backgroundColor: colors.surface,
  },
  elevated: {
    backgroundColor: colors.surface,
    ...shadows.medium,
  },
  outlined: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
