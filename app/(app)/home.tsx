import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { AppButton } from '../../components/ui/AppButton';
import { useAuth } from '../../hooks/useAuth';

export default function HomeScreen() {
  const { user, logout } = useAuth();

  return (
    <ScreenContainer safeArea style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>Welcome to SmartMonk</Text>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
          </View>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>SM</Text>
            </View>
          </View>
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

        <AppButton
          title="Sign Out"
          onPress={logout}
          variant="outline"
          size="medium"
          style={styles.signOutButton}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
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
  logoContainer: {
    marginLeft: spacing.base,
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    ...typography.headingSmall,
    color: colors.white,
    fontWeight: '700',
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
  signOutButton: {
    marginTop: 'auto',
  },
});
