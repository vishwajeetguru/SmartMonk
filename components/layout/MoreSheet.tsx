import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay, runOnJS } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';

export interface MoreItem {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  route: string;
}

const MORE_ITEMS: MoreItem[] = [
  { key: 'suppliers', label: 'Suppliers', icon: 'cube', color: colors.primary, bg: colors.primarySurface, route: '/(app)/suppliers' },
  { key: 'pumps', label: 'Fuel', icon: 'flame', color: colors.warning, bg: '#FEF3C7', route: '/(app)/pumps' },
  { key: 'drivers', label: 'Drivers', icon: 'people', color: colors.primary, bg: colors.primarySurface, route: '/(app)/drivers' },
  { key: 'payments', label: 'Payments', icon: 'card', color: colors.success, bg: colors.successLight, route: '/(app)/payments' },
  { key: 'reports', label: 'Reports', icon: 'bar-chart', color: colors.primary, bg: colors.primarySurface, route: '/(app)/reports' },
  { key: 'profile', label: 'Profile', icon: 'person-circle', color: colors.primary, bg: colors.primarySurface, route: '/(app)/profile' },
  { key: 'settings', label: 'Settings', icon: 'settings', color: colors.textSecondary, bg: colors.backgroundSecondary, route: '/(app)/settings' },
];

function AnimatedItem({ item, idx, onPress }: { item: MoreItem; idx: number; onPress: () => void }) {
  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(24);
  const pressScale = useSharedValue(1);

  React.useEffect(() => {
    const delay = idx * 35 + 80;
    const timer = setTimeout(() => {
      translateY.value = withSpring(0, { damping: 20, stiffness: 220 });
      scale.value = withSpring(1, { damping: 16, stiffness: 220 });
      opacity.value = withTiming(1, { duration: 220 });
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  return (
    <Animated.View style={[styles.itemWrapper, animatedStyle]}>
      <TouchableOpacity
        style={styles.item}
        onPress={onPress}
        onPressIn={() => {
          pressScale.value = withSpring(0.92, { damping: 12, stiffness: 300 });
        }}
        onPressOut={() => {
          pressScale.value = withSpring(1, { damping: 14, stiffness: 250 });
        }}
        activeOpacity={0.85}
      >
        <Animated.View style={[styles.iconCircle, { backgroundColor: item.bg }, pressStyle]}>
          <Ionicons name={item.icon} size={24} color={item.color} />
        </Animated.View>
        <Text style={styles.itemLabel}>{item.label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function MoreSheet({ visible, onClose, onNavigate }: { visible: boolean; onClose: () => void; onNavigate: (route: string) => void }) {
  const translateY = useSharedValue(400);
  const backdropOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, {
        damping: 24,
        stiffness: 260,
        mass: 1,
        overshootClamping: false,
      });
    } else {
      translateY.value = withTiming(420, { duration: 220 });
      backdropOpacity.value = withTiming(0, { duration: 180 });
      const timer = setTimeout(() => {
        runOnJS(onClose)();
      }, 230);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        </Animated.View>
        <Animated.View style={[styles.sheet, sheetStyle]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>More</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.grid}>
            {MORE_ITEMS.map((item, idx) => (
              <AnimatedItem
                key={item.key}
                item={item}
                idx={idx}
                onPress={() => {
                  onClose();
                  setTimeout(() => onNavigate(item.route), 240);
                }}
              />
            ))}
          </View>
          <Text style={styles.hint}>Tap to open</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.sm,
    paddingBottom: 34,
    paddingHorizontal: spacing.base,
    maxHeight: '70%',
  },
  handle: { width: 40, height: 5, borderRadius: 2.5, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.base },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.base, paddingHorizontal: spacing.xs },
  title: { ...typography.headingSmall, color: colors.textPrimary },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  itemWrapper: { width: '23.5%' },
  item: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.sm },
  iconCircle: { width: 58, height: 58, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderLight },
  itemLabel: { ...typography.caption, fontWeight: '600', color: colors.textPrimary, textAlign: 'center', fontSize: 11, lineHeight: 14 },
  hint: { ...typography.caption, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.base, fontSize: 11 },
});
