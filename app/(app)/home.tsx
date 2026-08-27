import React, { useCallback, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { TrialBanner } from '../../components/subscription/TrialBanner';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { useSubscription } from '../../hooks/useSubscription';
import { tripApi } from '../../services/api/trips';
import { driverApi } from '../../services/api/drivers';
import { formatters } from '../../utils/formatters';

const CROWN = require('../../assets/icons/Crown.png');
const WORKSPACE_ICON = require('../../assets/icons/workspace-icon.png');

function inr(n: number) {
  return '₹' + (n || 0).toLocaleString('en-IN');
}
function clamp(n: number, max: number) {
  return n > max ? `${max}+` : String(n);
}
function formatPremiumDate(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { user } = useAuth();
  const { profile, loadProfile } = useProfile();
  const { premium, subscription } = useSubscription();

  const [activeTrips, setActiveTrips] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [teamCount, setTeamCount] = useState(0);

  // Gentle float for the workspace illustration
  const floatY = useSharedValue(0);
  React.useEffect(() => {
    floatY.value = withRepeat(withTiming(-6, { duration: 2000, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);
  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: floatY.value }] }));

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadProfile(user.id);
        loadStats();
      }
    }, [user?.id])
  );

  const loadStats = async () => {
    try {
      const [trips, drivers] = await Promise.all([tripApi.getAll(), driverApi.getAll()]);
      setActiveTrips(trips.filter((tr) => (tr.status || '') === 'Active').length);
      setTotalExpenses(trips.reduce((s, tr) => s + (Number(tr.totalExpense) || 0), 0));
      setTeamCount(drivers.length);
    } catch {}
  };

  const handleProfilePress = () => router.push('/(app)/profile');
  const go = (route: string) => router.push(route as any);

  const displayName = profile?.fullName || user?.name || 'User';
  const firstName = displayName.split(' ')[0] || displayName;
  const initials = formatters.getInitials(displayName);
  const greeting = (() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Good morning';
    if (h >= 12 && h < 17) return 'Good afternoon';
    if (h >= 17 && h < 21) return 'Good evening';
    return 'Good night';
  })();

  const vehiclesCount = profile?.vehicles?.length || 0;

  const stats = [
    { key: 'vehicles', icon: 'car' as const, color: '#2563EB', bg: '#EFF6FF', value: clamp(vehiclesCount, 99), label: 'Total Vehicles', route: '/(app)/profile' },
    { key: 'trips', icon: 'navigate' as const, color: '#059669', bg: '#ECFDF5', value: clamp(activeTrips, 99), label: 'Active Trips', route: '/(app)/trips' },
    { key: 'expenses', icon: 'wallet' as const, color: '#D97706', bg: '#FFF7ED', value: inr(totalExpenses), label: 'Total Expenses', route: '/(app)/expense' },
    { key: 'team', icon: 'people' as const, color: '#7C3AED', bg: '#F5F3FF', value: clamp(teamCount, 99), label: 'Team Members', route: '/(app)/drivers' },
  ];

  const quickLinks = [
    { label: 'Add Trip', icon: 'paper-plane' as const, color: '#2563EB', bg: '#EFF6FF', route: '/(app)/trips', premium: true },
    { label: 'Add Expense', icon: 'wallet' as const, color: '#10B981', bg: '#ECFDF5', route: '/(app)/expense', premium: true },
    { label: 'Vehicles', icon: 'car' as const, color: '#7C3AED', bg: '#F5F3FF', route: '/(app)/profile', premium: true },
    { label: 'Drivers', icon: 'person' as const, color: '#0891B2', bg: '#CFFAFE', route: '/(app)/drivers', premium: true },
    { label: 'Fuel Logs', icon: 'flame' as const, color: '#EA580C', bg: '#FFEDD5', route: '/(app)/pumps', premium: false },
    { label: 'Documents', icon: 'document-text' as const, color: '#7C3AED', bg: '#EDE9FE', route: '/(app)/documents', premium: false },
    { label: 'Reminders', icon: 'notifications' as const, color: '#DB2777', bg: '#FCE7F3', route: '/(app)/reminder', premium: false },
    { label: 'Reports', icon: 'bar-chart' as const, color: '#2563EB', bg: '#EFF6FF', route: '/(app)/reports', premium: true, premiumPill: true },
  ];

  const activeUntilLabel = formatPremiumDate(subscription?.activeUntil);

  return (
    <ScreenContainer safeArea padded={false} style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{greeting}, {firstName} 👋</Text>
            <Text style={styles.title}>Manage your{'\n'}transport business</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress} activeOpacity={0.7}>
            {profile?.profileImage ? (
              <Image source={{ uri: profile.profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileAvatar}><Text style={styles.profileInitials}>{initials}</Text></View>
            )}
            {premium ? (
              <View style={styles.premiumAvatarBadge}>
                <Image source={CROWN} style={styles.premiumAvatarCrown} resizeMode="contain" />
              </View>
            ) : (
              <View style={styles.editBadge}><Ionicons name="pencil" size={10} color={colors.white} /></View>
            )}
          </TouchableOpacity>
        </View>

        {/* Premium: PREMIUM WORKSPACE pill + subtitle */}
        {premium && (
          <View style={styles.premiumHeader}>
            <View style={styles.premiumPillRow}>
              <View style={styles.premiumPill}>
                <Image source={CROWN} style={styles.premiumPillCrown} resizeMode="contain" />
                <Text style={styles.premiumPillText}>PREMIUM WORKSPACE</Text>
              </View>
              <Text style={styles.sparkleSmall}>✨</Text>
            </View>
            <Text style={styles.premiumSub}>Your business is fully unlocked</Text>
          </View>
        )}

        {/* Premium: Membership card */}
        {premium && (
          <TouchableOpacity style={styles.membershipCard} onPress={() => go('/(app)/paywall')} activeOpacity={0.85}>
            <View style={styles.membershipIconBox}>
              <Image source={CROWN} style={styles.membershipCrown} resizeMode="contain" />
              <Text style={styles.membershipSparkleTL}>✦</Text>
              <Text style={styles.membershipSparkleBR}>✦</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.membershipTitle}>Premium Membership</Text>
              <Text style={styles.membershipSub}>All premium features are active</Text>
              <View style={styles.activeBadge}>
                <View style={styles.activeCheck}><Ionicons name="checkmark" size={10} color="#fff" /></View>
                <Text style={styles.activeBadgeText}>{activeUntilLabel ? `Active until ${activeUntilLabel}` : 'Active • Premium'}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#1E293B" />
          </TouchableOpacity>
        )}

        {/* Trial / expiry countdown banner - hidden when premium (home shows its own) */}
        <TrialBanner />

        {/* Transport Workspace */}
        <View style={styles.workspace}>
          <View style={styles.workspaceHeader}>
            <Animated.View style={[styles.workspaceIllustration, floatStyle]}>
              <Image source={WORKSPACE_ICON} style={styles.workspaceImg} resizeMode="contain" />
            </Animated.View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.workspaceTitle}>Your Transport Workspace</Text>
              <Text style={styles.workspaceSub}>Everything you need to run and grow your transport business — all in one place.</Text>
            </View>
          </View>

          <View style={styles.statGrid}>
            {stats.map((s) => (
              <TouchableOpacity key={s.key} style={styles.statTile} onPress={() => go(s.route)} activeOpacity={0.8}>
                <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
                  <Ionicons name={s.icon} size={22} color={s.color} />
                </View>
                <Text style={styles.statValue} numberOfLines={1}>{s.value}</Text>
                <Text style={styles.statLabel} numberOfLines={1}>{s.label}</Text>
                <View style={[styles.viewBtn, { borderColor: s.color + '22' }]}>
                  <Text style={[styles.viewBtnText, { color: s.color }]}>View</Text>
                  <Ionicons name="chevron-forward" size={12} color={s.color} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Links */}
        <View style={styles.quickSection}>
          <View style={styles.quickHeaderRow}>
            <Text style={styles.quickTitle}>Quick Links</Text>
            {premium && (
              <View style={styles.premiumFeaturesPill}>
                <Ionicons name="star" size={13} color="#B45309" />
                <Text style={styles.premiumFeaturesText}>PREMIUM FEATURES</Text>
              </View>
            )}
          </View>
          <View style={styles.quickGrid}>
            {quickLinks.map((q) => (
              <TouchableOpacity key={q.label} style={styles.quickItem} onPress={() => go(q.route)} activeOpacity={0.8}>
                <View style={styles.quickIconWrap}>
                  <View style={[styles.quickIcon, { backgroundColor: q.bg }]}>
                    <Ionicons name={q.icon} size={24} color={q.color} />
                  </View>
                  {premium && q.premium && (
                    <View style={styles.crownBadge}>
                      <Image source={CROWN} style={styles.crownBadgeIcon} resizeMode="contain" />
                    </View>
                  )}
                </View>
                <Text style={styles.quickLabel} numberOfLines={1}>{q.label}</Text>
                {premium && (q as any).premiumPill && (
                  <View style={styles.quickPremiumPill}>
                    <Ionicons name="star" size={9} color="#B45309" />
                    <Text style={styles.quickPremiumPillText}>PREMIUM</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Premium: Thank you banner */}
        {premium && (
          <View style={styles.thankYouCard}>
            <View style={styles.thankYouMedal}>
              <Image source={CROWN} style={styles.thankYouCrown} resizeMode="contain" />
              <View style={styles.thankYouRibbonLeft} />
              <View style={styles.thankYouRibbonRight} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.thankYouTitle}>Thank you for being Premium!</Text>
              <Text style={styles.thankYouSub}>You&apos;re getting more power to grow your transport business.</Text>
            </View>
            <TouchableOpacity style={styles.thankYouBtn} onPress={() => go('/(app)/paywall')} activeOpacity={0.85}>
              <Text style={styles.thankYouBtnText}>Explore Premium Features</Text>
              <Ionicons name="chevron-forward" size={12} color="#FDE68A" />
            </TouchableOpacity>
            <Text style={styles.thankYouSparkle}>✦</Text>
          </View>
        )}

        {/* Platinum upsell - only when not premium */}
        {!premium && (
          <View style={styles.platinum}>
            <View style={styles.platinumIcon}>
              <Image source={CROWN} style={styles.platinumCrown} resizeMode="contain" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.platinumTitle}>Unlock SmartMonk Platinum</Text>
              <Text style={styles.platinumSub}>Go premium and get unlimited access to all features & priority support.</Text>
            </View>
            <TouchableOpacity style={styles.platinumBtn} onPress={() => go('/(app)/paywall')} activeOpacity={0.85}>
              <Text style={styles.platinumBtnText}>Upgrade Now</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  container: { backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.base, paddingTop: spacing.sm, paddingBottom: 120 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  headerLeft: { flex: 1, paddingRight: 12 },
  greeting: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: 6 },
  title: { ...typography.headingLarge, color: colors.textPrimary, fontSize: 28, fontWeight: '800', lineHeight: 34 },
  profileButton: { position: 'relative' },
  profileAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  profileImage: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: colors.borderLight },
  profileInitials: { ...typography.headingSmall, color: colors.white, fontWeight: '700' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.white },
  premiumAvatarBadge: { position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderRadius: 12, backgroundColor: '#FEF3C7', borderWidth: 2, borderColor: colors.white, alignItems: 'center', justifyContent: 'center', shadowColor: '#92400E', shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
  premiumAvatarCrown: { width: 14, height: 10 },

  premiumHeader: { marginBottom: 14 },
  premiumPillRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  premiumPill: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  premiumPillCrown: { width: 18, height: 13 },
  premiumPillText: { fontSize: 11, fontWeight: '800', color: '#92400E', letterSpacing: 0.9 },
  sparkleSmall: { fontSize: 14, color: '#F59E0B', marginLeft: 2, marginTop: -6 },
  premiumSub: { fontSize: 13, color: '#64748B', marginTop: 6, fontWeight: '500' },

  membershipCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 16, padding: 14, marginBottom: 14 },
  membershipIconBox: { width: 56, height: 56, borderRadius: 14, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' },
  membershipCrown: { width: 28, height: 20 },
  membershipSparkleTL: { position: 'absolute', top: 4, right: 6, fontSize: 8, color: '#FDE68A' },
  membershipSparkleBR: { position: 'absolute', bottom: 6, left: 5, fontSize: 8, color: '#FDE68A' },
  membershipTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  membershipSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, alignSelf: 'flex-start', marginTop: 7 },
  activeCheck: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center' },
  activeBadgeText: { fontSize: 11, fontWeight: '700', color: '#065F46' },

  workspace: { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.base, marginBottom: spacing.lg },
  workspaceHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.base },
  workspaceIllustration: { width: 78, height: 78, borderRadius: radius.lg, backgroundColor: colors.primarySurface, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  workspaceImg: { width: 56, height: 56 },
  workspaceTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  workspaceSub: { fontSize: 13, color: colors.textSecondary, marginTop: 3, lineHeight: 18 },
  statGrid: { flexDirection: 'row', gap: 10 },
  statTile: { flex: 1, backgroundColor: colors.background, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderLight, padding: 8, alignItems: 'center' },
  statIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  statLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 2, textAlign: 'center' },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 8, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: colors.border },
  viewBtnText: { fontSize: 10, fontWeight: '700' },

  quickSection: { marginBottom: 14 },
  quickHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.base },
  quickTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  premiumFeaturesPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  premiumFeaturesText: { fontSize: 10, fontWeight: '800', color: '#92400E', letterSpacing: 0.6 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  quickItem: { width: '25%', alignItems: 'center', marginBottom: spacing.base },
  quickIconWrap: { position: 'relative' },
  quickIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  quickLabel: { fontSize: 11, color: colors.textSecondary, textAlign: 'center', fontWeight: '600' },
  crownBadge: { position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: '#FEF3C7', borderWidth: 1.5, borderColor: '#FDE68A', alignItems: 'center', justifyContent: 'center' },
  crownBadgeIcon: { width: 10, height: 7 },
  quickPremiumPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  quickPremiumPillText: { fontSize: 8, fontWeight: '800', color: '#92400E', letterSpacing: 0.5 },

  thankYouCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0F172A', borderRadius: 14, padding: 12, marginBottom: spacing.lg, overflow: 'hidden', position: 'relative' },
  thankYouMedal: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1E293B', borderWidth: 1.5, borderColor: '#FDE68A', alignItems: 'center', justifyContent: 'center' },
  thankYouCrown: { width: 18, height: 13 },
  thankYouRibbonLeft: { position: 'absolute', bottom: -4, left: 8, width: 10, height: 10, backgroundColor: '#D97706', transform: [{ rotate: '45deg' }], opacity: 0.9 },
  thankYouRibbonRight: { position: 'absolute', bottom: -4, right: 8, width: 10, height: 10, backgroundColor: '#D97706', transform: [{ rotate: '45deg' }], opacity: 0.9 },
  thankYouTitle: { fontSize: 13, fontWeight: '800', color: '#fff' },
  thankYouSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2, lineHeight: 14 },
  thankYouBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#B45309', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, marginLeft: 6 },
  thankYouBtnText: { fontSize: 10, fontWeight: '800', color: '#FDE68A' },
  thankYouSparkle: { position: 'absolute', top: 8, right: 110, fontSize: 10, color: '#FDE68A' },

  platinum: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.backgroundSecondary, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.base },
  platinumIcon: { width: 40, alignItems: 'center', justifyContent: 'center' },
  platinumCrown: { width: 36, height: 30 },
  platinumTitle: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  platinumSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 16 },
  platinumBtn: { backgroundColor: '#7C3AED', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  platinumBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
});
