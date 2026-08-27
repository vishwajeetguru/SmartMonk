import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSubscription } from '../../hooks/useSubscription';
import { spacing } from '../../constants/spacing';

const HOURGLASS = require('../../assets/illustrations/smartmonk_free_trial_hourglass.png');

function breakdown(ms: number) {
  if (ms <= 0) return { d: '00', h: '00', m: '00' };
  const total = Math.floor(ms / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return { d: pad(Math.floor(total / 86400)), h: pad(Math.floor((total % 86400) / 3600)), m: pad(Math.floor((total % 3600) / 60)) };
}

export function TrialBanner() {
  const { status, remainingMs } = useSubscription();
  const router = useRouter();
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const openPaywall = () => router.push('/(app)/paywall');

  if (status === 'active') {
    // Premium UI is handled in HomeScreen (Premium Workspace + Membership card). Keep banner hidden to avoid duplicate.
    return null;
  }

  if (status === 'expired') {
    return (
      <View style={s.row}>
        <Ionicons name="alert-circle" size={20} color="#DC2626" />
        <View style={{ flex: 1 }}>
          <Text style={s.expiredTitle}>Your trial has expired</Text>
          <Text style={s.expiredSub}>Subscribe to keep using SmartMonk</Text>
        </View>
        <TouchableOpacity style={s.upgradeBtn} onPress={openPaywall}><Text style={s.upgradeBtnText}>Upgrade</Text></TouchableOpacity>
      </View>
    );
  }

  const { d, h, m } = breakdown(remainingMs);
  return (
    <LinearGradient colors={['#2563EB', '#1D4ED8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.trial}>
      <View style={s.rowInner}>
        <Image source={HOURGLASS} style={s.hourglass} resizeMode="contain" />

        <View style={s.content}>
          <View style={s.chip}>
            <Ionicons name="flame" size={11} color="#B45309" />
            <Text style={s.chipText}>LIMITED TIME</Text>
          </View>
          <Text style={s.title}>Your Free Trial is Active!</Text>
          <Text style={s.sub}>Explore SmartMonk Premium features risk-free.</Text>
        </View>

        <View style={s.right}>
          <View style={s.cdPanel}>
            <Text style={s.cdLabel}>TRIAL ENDS IN</Text>
            <View style={s.cdRow}>
              <CdValue value={d} label="DAYS" />
              <Text style={s.cdColon}>:</Text>
              <CdValue value={h} label="HRS" />
              <Text style={s.cdColon}>:</Text>
              <CdValue value={m} label="MINS" />
            </View>
          </View>
          <AnimatedUpgradeButton onPress={openPaywall} />
        </View>
      </View>
    </LinearGradient>
  );
}

function CdValue({ value, label }: { value: string; label: string }) {
  return (
    <View style={s.cdValue}>
      <Text style={s.cdNum}>{value}</Text>
      <Text style={s.cdUnit}>{label}</Text>
    </View>
  );
}

function AnimatedUpgradeButton({ onPress }: { onPress: () => void }) {
  const press = useSharedValue(1);
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1.045, { duration: 1600, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: press.value * pulse.value }],
  }));

  return (
    <Animated.View style={style}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        onPressIn={() => (press.value = withSpring(0.95, { damping: 16, stiffness: 300 }))}
        onPressOut={() => (press.value = withSpring(1, { damping: 12, stiffness: 260 }))}
        style={s.upgradeBig}
      >
        <Text style={s.upgradeBigText}>Upgrade Now</Text>
        <Ionicons name="arrow-forward" size={16} color="#1D4ED8" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, marginBottom: spacing.base },
  activeText: { fontSize: 14, fontWeight: '800', color: '#059669' },
  expiredTitle: { fontSize: 14, fontWeight: '800', color: '#DC2626' },
  expiredSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  upgradeBtn: { backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10 },
  upgradeBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  trial: { borderRadius: 18, padding: 12, marginBottom: spacing.base, shadowColor: '#1D4ED8', shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
  rowInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hourglass: { width: 62, height: 64 },
  content: { flex: 1 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: '#FDE68A', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, marginBottom: 6 },
  chipText: { fontSize: 10, fontWeight: '800', color: '#B45309', letterSpacing: 0.5 },
  title: { color: '#fff', fontSize: 16, fontWeight: '800', lineHeight: 20 },
  sub: { color: 'rgba(255,255,255,0.9)', fontSize: 11, marginTop: 4, lineHeight: 15 },
  right: { width: 130 },
  cdPanel: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 6, alignItems: 'center' },
  cdLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  cdRow: { flexDirection: 'row', alignItems: 'flex-start' },
  cdValue: { alignItems: 'center', minWidth: 34 },
  cdNum: { color: '#fff', fontSize: 20, fontWeight: '800' },
  cdUnit: { color: 'rgba(255,255,255,0.7)', fontSize: 8, fontWeight: '700', letterSpacing: 0.5, marginTop: 1 },
  cdColon: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 2, marginHorizontal: 1 },
  upgradeBig: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fff', paddingVertical: 10, borderRadius: 10, marginTop: 8 },
  upgradeBigText: { color: '#1D4ED8', fontWeight: '800', fontSize: 13 },
});
