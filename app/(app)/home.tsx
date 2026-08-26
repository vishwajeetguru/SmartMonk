import React, { useCallback } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { formatters } from '../../utils/formatters';

export default function HomeScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { t } = useTranslation();
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
  const firstName = displayName.split(' ')[0] || displayName;
  const initials = formatters.getInitials(displayName);
  const greeting = (() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Good morning';
    if (h >= 12 && h < 17) return 'Good afternoon';
    if (h >= 17 && h < 21) return 'Good evening';
    return 'Good night';
  })();

  return (
    <ScreenContainer safeArea padded={false} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>
              {greeting}, {firstName} 👋
            </Text>
            <Text style={styles.userName}>{t('home.subtitle')}</Text>
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
          <Text style={styles.cardTitle}>{t('home.workspaceTitle')}</Text>
          <Text style={styles.cardSubtitle}>
            {t('home.workspaceBody')}
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
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
    backgroundColor: colors.surface,
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
