import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { spacing } from '../../constants/spacing';

interface LoadingIndicatorProps {
  size?: 'small' | 'large';
  color?: string;
  fullScreen?: boolean;
}

export function LoadingIndicator({
  size = 'large',
  color,
  fullScreen = false,
}: LoadingIndicatorProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const resolvedColor = color ?? colors.primary;
  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size={size} color={resolvedColor} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={resolvedColor} />
    </View>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  container: {
    padding: spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
