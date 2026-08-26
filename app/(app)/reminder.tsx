import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { ScreenContainer } from '../../components/layout/ScreenContainer';

export default function ReminderScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { t } = useTranslation();
  return (
    <ScreenContainer safeArea padded={false} style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="notifications-outline" size={28} color={colors.primary} />
        <Text style={styles.headerTitle}>{t('screen.reminder')}</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="alarm" size={48} color={colors.warning} />
        </View>
        <Text style={styles.title}>{t('screen.reminder')}</Text>
        <Text style={styles.subtitle}>{t('reminder.subtitle')}</Text>
        <View style={styles.card}>
          <Ionicons name="time-outline" size={20} color={colors.primary} />
          <Text style={styles.cardText}>{t('reminder.comingSoon')}</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}
const makeStyles = (colors: any) => StyleSheet.create({
  container: { backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { ...typography.headingSmall, color: colors.textPrimary },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.base, gap: spacing.base },
  iconWrap: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.headingMedium, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.backgroundSecondary, borderRadius: radius.lg, padding: spacing.base, borderWidth: 1, borderColor: colors.border, marginTop: spacing.base },
  cardText: { ...typography.bodySmall, color: colors.textSecondary, flex: 1 },
});
