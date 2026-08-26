import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';

interface ErrorMessageProps {
  message: string;
  visible?: boolean;
}

export function ErrorMessage({ message, visible = true }: ErrorMessageProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  if (!visible || !message) return null;

  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle" size={18} color={colors.error} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.base,
  },
  text: {
    ...typography.bodySmall,
    color: colors.error,
    marginLeft: spacing.sm,
    flex: 1,
  },
});
