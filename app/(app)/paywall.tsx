import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { AppHeader } from '../../components/ui/AppHeader';
import { Plan, PlanId } from '../../types/subscription';
import { subscriptionApi } from '../../services/api/subscription';
import { useSubscription } from '../../hooks/useSubscription';

const PLANS: Plan[] = [
  { id: 'monthly', label: '1 Month', days: 30, price: 99 },
  { id: 'yearly', label: '1 Year', days: 365, price: 1000 },
];

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'infinite', label: 'Unlimited Access' },
  { icon: 'flash', label: 'Priority Support' },
  { icon: 'shield-checkmark', label: 'Advanced Security' },
  { icon: 'cloud', label: 'Regular Updates' },
];

const TRUST: { icon: keyof typeof Ionicons.glyphMap; title: string; sub: string }[] = [
  { icon: 'shield-checkmark-outline', title: '100% Secure', sub: 'Your data is safe' },
  { icon: 'person-circle-outline', title: 'Trusted by Thousands', sub: 'Across India' },
  { icon: 'pricetag-outline', title: 'No Hidden Charges', sub: 'What you see is what you pay' },
];

const payButtonStyles = StyleSheet.create({
  pressWrap: { borderRadius: 18 },
  payBtn: { borderRadius: 18, overflow: 'hidden', shadowColor: '#8B5CF6', shadowOpacity: 0.32, shadowRadius: 16, elevation: 8 },
  payBtnHighlight: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.35)' },
  sheen: { position: 'absolute', top: -20, bottom: -20, width: 70, backgroundColor: 'rgba(255,255,255,0.55)' },
  payBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 18 },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  payBtnSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
});

export default function PaywallScreen() {
  const { isDark } = useTheme();
  const { styles, palette } = makeStyles(isDark);
  const router = useRouter();
  const { status, subscription, refresh } = useSubscription();

  const [planId, setPlanId] = useState<PlanId>('monthly');
  const [processing, setProcessing] = useState(false);
  const [activated, setActivated] = useState(false);

  // Hero crown gentle float
  const floatY = useSharedValue(0);
  useEffect(() => {
    floatY.value = withRepeat(withTiming(-9, { duration: 2200, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);
  const crownFloatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: floatY.value }] }));


  const handleSelect = (id: PlanId) => {
    setPlanId(id);
    setActivated(false);
  };

  const trialDays = useMemo(() => {
    if (subscription && subscription.status === 'trial') {
      const start = new Date(subscription.trialStartedAt).getTime();
      const end = new Date(subscription.trialEndsAt).getTime();
      const d = Math.round((end - start) / 86400000);
      if (d > 0) return d;
    }
    return 30;
  }, [subscription]);

  const startPayment = async () => {
    setProcessing(true);
    try {
      const order = await subscriptionApi.createOrder(planId);
      const contract: any = require('cashfree-pg-api-contract');
      const sdk: any = require('react-native-cashfree-pg-sdk');

      const session = new contract.CFSession(
        order.paymentSessionId,
        order.orderId,
        contract.CFEnvironment.SANDBOX
      );

      sdk.CFPaymentGatewayService.setCallback({
        onVerify: async () => {
          try {
            await subscriptionApi.verify(order.orderId);
            await refresh();
            setProcessing(false);
            setActivated(true);
            setTimeout(() => router.back(), 1600);
          } catch (e: any) {
            setProcessing(false);
            Alert.alert('Verification', e?.message || 'Could not confirm payment');
          }
        },
        onError: (err: any) => {
          setProcessing(false);
          Alert.alert('Payment', err?.getMessage?.() || err?.message || 'Payment failed');
        },
      });

      sdk.CFPaymentGatewayService.doWebPayment(session);
    } catch (e: any) {
      setProcessing(false);
      const msg = e?.message || 'Failed to start payment';
      const nativeMissing = /NativeModule|cashfree|Expo Go/i.test(msg);
      Alert.alert(
        'Payment',
        nativeMissing
          ? 'Cashfree requires a development build. Run: npx expo run:android (or :ios). It does not work in Expo Go.'
          : msg
      );
    }
  };

  const plan = PLANS.find((p) => p.id === planId) || PLANS[0];

  return (
    <ScreenContainer safeArea padded={false} style={styles.container}>
      <AppHeader title={isDark ? 'Subscribe' : 'Upgrade Plan'} onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Animated.View style={[styles.crownWrap, crownFloatStyle]}>
            <Image source={require('../../assets/icons/Crown.png')} style={styles.crownImage} resizeMode="contain" />
            <Ionicons name="sparkles" size={14} color="#A855F7" style={styles.spark1} />
            <Ionicons name="sparkles" size={10} color="#C026D3" style={styles.spark2} />
            <Ionicons name="sparkles" size={12} color="#8B5CF6" style={styles.spark3} />
          </Animated.View>
          <Text style={styles.heroTitle}>SmartMonk <Text style={styles.heroTitleAccent}>Platinum</Text></Text>
          <Text style={styles.heroSub}>Unlock the complete premium experience</Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          {FEATURES.map((f, i) => (
            <React.Fragment key={f.label}>
              {i > 0 && <View style={styles.featureDivider} />}
              <View style={styles.feature}>
                <View style={styles.featureIcon}>
                  <Ionicons name={f.icon} size={20} color={palette.purple} />
                </View>
                <Text style={styles.featureLabel}>{f.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* Trial banner */}
        {status === 'trial' ? (
          <View style={styles.trialBanner}>
            <View style={styles.trialIcon}>
              <Ionicons name="calendar-outline" size={20} color={palette.purple} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.trialTitle}>
                Your <Text style={{ color: palette.purple, fontWeight: '800' }}>{trialDays}-day free trial</Text> is active
              </Text>
              <Text style={styles.trialSub}>You won't be charged until the trial ends.</Text>
            </View>
          </View>
        ) : null}

        {/* Plan cards */}
        {PLANS.map((p) => {
          const active = planId === p.id;
          const save = p.id === 'yearly';
          const most = p.id === 'monthly';
          return (
            <TouchableOpacity
              key={p.id}
              style={[styles.planCard, active && styles.planCardActive]}
              onPress={() => handleSelect(p.id)}
              activeOpacity={0.85}
            >
              <View style={[styles.radio, active && styles.radioActive]}>
                {active && <View style={styles.radioDot} />}
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.planLabel}>{p.label}</Text>
                  {most && <View style={styles.popularBadge}><Text style={styles.popularText}>MOST POPULAR</Text></View>}
                  {save && <View style={styles.saveBadge}><Text style={styles.saveText}>SAVE 16%</Text></View>}
                </View>
                <Text style={styles.planBilling}>Billed {p.id === 'monthly' ? 'monthly' : 'yearly'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.planPrice}>₹{p.price}</Text>
                <Text style={styles.planPeriod}>/{p.id === 'monthly' ? 'month' : 'year'}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Payment Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Payment Summary</Text>
            <Text style={styles.summaryAmount}>₹{plan.price} <Text style={styles.summaryCurrency}>INR</Text></Text>
          </View>
          <View style={styles.summarySecure}>
            <View style={styles.secureIcon}>
              <Ionicons name="shield-checkmark" size={18} color={palette.green} />
            </View>
            <Text style={styles.secureText}>Secure checkout via Cashfree{'\n'}UPI, cards, netbanking supported</Text>
          </View>

          <PremiumPayButton
            onPress={startPayment}
            disabled={processing || activated}
            gradientFrom={palette.gradientFrom}
            gradientTo={palette.gradientTo}
            label={activated ? 'Activated ✓' : isDark ? 'Continue to Secure Payment' : 'Pay Securely with Cashfree'}
            sub="Pay with Cashfree (UPI / Cards)"
          />
        </View>

        {/* Trust */}
        <View style={styles.trust}>
          {TRUST.map((t, i) => (
            <React.Fragment key={t.title}>
              {i > 0 && <View style={styles.trustDivider} />}
              <View style={styles.trustItem}>
                <View style={styles.trustIcon}>
                  <Ionicons name={t.icon} size={18} color={palette.purple} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.trustTitle}>{t.title}</Text>
                  <Text style={styles.trustSub}>{t.sub}</Text>
                </View>
              </View>
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function makeStyles(isDark: boolean) {
  const palette = isDark
    ? {
        bg: '#0B0B14',
        card: '#151522',
        cardBorder: '#26263B',
        cardBorderActive: '#8B5CF6',
        cardActiveBg: '#1B1626',
        text: '#FFFFFF',
        textSecondary: '#9CA3AF',
        textMuted: '#6B7280',
        purple: '#A78BFA',
        purpleDark: '#8B5CF6',
        purpleSoft: 'rgba(139,92,246,0.14)',
        green: '#34D399',
        gradientFrom: '#7C3AED',
        gradientTo: '#C026D3',
        featureBg: 'rgba(139,92,246,0.14)',
        trialBg: 'rgba(139,92,246,0.10)',
        trialBorder: 'rgba(139,92,246,0.25)',
        divider: '#27273B',
        trustBg: '#151522',
      }
    : {
        bg: '#FFFFFF',
        card: '#FFFFFF',
        cardBorder: '#EAEAF0',
        cardBorderActive: '#8B5CF6',
        cardActiveBg: '#F7F5FF',
        text: '#0F172A',
        textSecondary: '#64748B',
        textMuted: '#94A3B8',
        purple: '#7C3AED',
        purpleDark: '#6D28D9',
        purpleSoft: '#F5F3FF',
        green: '#10B981',
        gradientFrom: '#7C3AED',
        gradientTo: '#A855F7',
        featureBg: '#F5F0FF',
        trialBg: '#F5F3FF',
        trialBorder: '#EDE9FE',
        divider: '#F1F5F9',
        trustBg: '#FFFFFF',
      };

  const styles = StyleSheet.create({
    container: { backgroundColor: palette.bg },
    scroll: { padding: spacing.base, paddingBottom: 60 },
    hero: { alignItems: 'center', marginBottom: spacing.base },
    crownWrap: { position: 'relative', width: 132, height: 96, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
    crownImage: { width: 116, height: 84 },
    spark1: { position: 'absolute', top: 0, right: 18 },
    spark2: { position: 'absolute', top: 26, left: 6 },
    spark3: { position: 'absolute', top: 42, right: 4 },
    heroTitle: { ...typography.headingLarge, color: palette.text, textAlign: 'center', fontSize: 26, fontWeight: '800' },
    heroTitleAccent: { color: palette.purpleDark },
    heroSub: { ...typography.bodySmall, color: palette.textSecondary, textAlign: 'center', marginTop: 6 },
    features: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: spacing.lg, marginHorizontal: spacing.xs },
    feature: { flex: 1, alignItems: 'center', gap: 8 },
    featureDivider: { width: 1, height: 48, backgroundColor: palette.divider, alignSelf: 'center', marginTop: 6 },
    featureIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: palette.featureBg, alignItems: 'center', justifyContent: 'center' },
    featureLabel: { fontSize: 11, color: palette.textSecondary, textAlign: 'center', lineHeight: 14 },
    trialBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: palette.trialBg, borderWidth: 1, borderColor: palette.trialBorder, borderRadius: radius.lg, padding: spacing.base, marginBottom: spacing.base },
    trialIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: palette.purpleSoft, alignItems: 'center', justifyContent: 'center' },
    trialTitle: { fontSize: 14, color: palette.text, fontWeight: '700' },
    trialSub: { fontSize: 12, color: palette.textSecondary, marginTop: 2 },
    planCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.base, borderRadius: radius.lg, borderWidth: 1.5, borderColor: palette.cardBorder, backgroundColor: palette.card, marginBottom: 10 },
    planCardActive: { borderColor: palette.cardBorderActive, backgroundColor: palette.cardActiveBg },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: palette.textMuted, alignItems: 'center', justifyContent: 'center' },
    radioActive: { borderColor: palette.purpleDark },
    radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: palette.purpleDark },
    planLabel: { fontSize: 15, fontWeight: '800', color: palette.text },
    planBilling: { fontSize: 13, color: palette.textSecondary, marginTop: 2 },
    popularBadge: { backgroundColor: '#7C3AED', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    popularText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.4 },
    saveBadge: { backgroundColor: 'rgba(16,185,129,0.16)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    saveText: { fontSize: 9, fontWeight: '800', color: palette.green, letterSpacing: 0.3 },
    planPrice: { fontSize: 20, fontWeight: '800', color: palette.text },
    planPeriod: { fontSize: 12, color: palette.textSecondary },
    summary: { backgroundColor: palette.card, borderWidth: 1, borderColor: palette.cardBorder, borderRadius: radius.xl, padding: spacing.base, marginTop: spacing.sm },
    summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.base },
    summaryTitle: { fontSize: 16, fontWeight: '800', color: palette.text },
    summaryAmount: { fontSize: 18, fontWeight: '800', color: palette.text },
    summaryCurrency: { fontSize: 12, color: palette.textSecondary, fontWeight: '500' },
    summarySecure: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.base },
    secureIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(16,185,129,0.14)', alignItems: 'center', justifyContent: 'center' },
    secureText: { fontSize: 13, color: palette.textSecondary, lineHeight: 18 },
    trust: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xl, paddingVertical: spacing.base },
    trustItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
    trustDivider: { width: 1, height: 40, backgroundColor: palette.divider, alignSelf: 'center', marginHorizontal: 2 },
    trustIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: palette.trustBg, borderWidth: 1, borderColor: palette.cardBorder, alignItems: 'center', justifyContent: 'center' },
    trustTitle: { fontSize: 11, color: palette.text, fontWeight: '700' },
    trustSub: { fontSize: 9, color: palette.textSecondary, marginTop: 1 },
  });

  return { styles, palette };
}

// Animated premium gradient pay button with shimmer + press scale.
function PremiumPayButton({
  onPress,
  disabled,
  gradientFrom,
  gradientTo,
  label,
  sub,
}: {
  onPress: () => void;
  disabled?: boolean;
  gradientFrom: string;
  gradientTo: string;
  label: string;
  sub: string;
}) {
  const scale = useSharedValue(1);
  const sheen = useSharedValue(-1);

  useEffect(() => {
    // Repeating sheen sweep for a premium feel.
    sheen.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.ease) }), -1, false);
  }, []);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const sheenStyle = useAnimatedStyle(() => {
    const x = interpolate(sheen.value, [-1, 1], [-160, 420]);
    return { opacity: interpolate(sheen.value, [-1, 1], [0.35, 0.0]), transform: [{ translateX: x }, { rotate: '18deg' }] };
  });

  return (
    <Animated.View style={[payButtonStyles.pressWrap, pressStyle]}>
      <LinearGradient
        colors={[gradientFrom, gradientTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={payButtonStyles.payBtn}
      >
        {/* top highlight + moving sheen */}
        <View pointerEvents="none" style={payButtonStyles.payBtnHighlight} />
        <Animated.View pointerEvents="none" style={[payButtonStyles.sheen, sheenStyle]} />

        <TouchableOpacity
          onPress={onPress}
          disabled={disabled}
          activeOpacity={0.9}
          onPressIn={() => (scale.value = withSpring(0.97, { damping: 18, stiffness: 300 }))}
          onPressOut={() => (scale.value = withSpring(1, { damping: 14, stiffness: 260 }))}
          style={payButtonStyles.payBtnInner}
        >
          <Ionicons name="lock-closed" size={22} color="#fff" />
          <View>
            <Text style={payButtonStyles.payBtnText}>{label}</Text>
            <Text style={payButtonStyles.payBtnSub}>{sub}</Text>
          </View>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
}

