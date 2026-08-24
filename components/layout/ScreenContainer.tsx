import React from 'react';
import { View, StyleSheet, ScrollView, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
  safeArea?: boolean;
  scrollable?: boolean;
  padded?: boolean;
}

export function ScreenContainer({
  children,
  style,
  backgroundColor = colors.background,
  safeArea = true,
  scrollable = false,
  padded = true,
}: ScreenContainerProps) {
  const content = scrollable ? (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.scrollContent, padded && styles.padded]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, padded && styles.padded, style]}>
      {children}
    </View>
  );

  if (safeArea) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor }, style]}
        edges={['top', 'left', 'right']}
      >
        {content}
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: 24,
  },
});
