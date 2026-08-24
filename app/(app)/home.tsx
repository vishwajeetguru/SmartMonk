import React, { useCallback } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { formatters } from '../../utils/formatters';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, loadProfile } = useProfile();

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadProfile(user.id);
      }
    }, [user?.id])
  );

  const handleProfilePress = () => {
    router.push('/(app)/profile');
  };

  const displayName = profile?.fullName || user?.name || 'User';
  const initials = formatters.getInitials(displayName);

  return (
    <ScreenContainer safeArea style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>Welcome to SmartMonk</Text>
            <Text style={styles.userName}>{displayName}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={handleProfilePress}
            activeOpacity={0.7}
          >
            {profile?.profileImage ? (
              <Image source={{ uri: profile.profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileAvatar}>
                <Text style={styles.profileInitials}>{initials}</Text>
              </View>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={10} color={colors.white} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <Ionicons name="car" size={40} color={colors.primary} />
          </View>
          <Text style={styles.cardTitle}>Your Transport Workspace</Text>
          <Text style={styles.cardSubtitle}>
            Your transport business management workspace is ready. We're building
            powerful features to help you manage your fleet, track trips, and
            grow your business.
          </Text>
        </View>

        <View style={styles.comingSoonContainer}>
          <View style={styles.comingSoonHeader}>
            <Ionicons name="construct" size={24} color={colors.warning} />
            <Text style={styles.comingSoonTitle}>Coming Soon</Text>
          </View>
          <Text style={styles.comingSoonSubtitle}>
            Transport management features are coming soon.
          </Text>
          <View style={styles.featureList}>
            {[
              'Vehicle Management',
              'Driver Tracking',
              'Trip Records',
              'Fuel & Expenses',
              'Payment Tracking',
              'Monthly Reports',
            ].map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: 110,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  userName: {
    ...typography.headingMedium,
    color: colors.textPrimary,
  },
  profileButton: {
    position: 'relative',
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  profileInitials: {
    ...typography.headingSmall,
    color: colors.white,
    fontWeight: '700',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardIcon: {
    width: 80,
    height: 80,
    borderRadius: radius.xl,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  cardTitle: {
    ...typography.headingSmall,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  cardSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  comingSoonContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  comingSoonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  comingSoonTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  comingSoonSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  featureList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    paddingVertical: spacing.xs,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: spacing.sm,
  },
  featureText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
});
