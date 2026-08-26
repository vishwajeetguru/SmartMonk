import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { LANGUAGES } from '../../i18n/translations';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';

export default function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const { t, lang, setLang } = useTranslation();
  const { user } = useAuth();
  const styles = makeStyles(colors);

  return (
    <ScreenContainer safeArea padded={false} style={{ backgroundColor: colors.background }}>
      <View style={styles.header}>
        <Ionicons name="settings-outline" size={28} color={colors.primary} />
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="contrast" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>{t('settings.appearance')}</Text>
          </View>
          <View style={styles.optionsRow}>
            {[
              { m: 'light' as const, icon: 'sunny' as const, label: t('settings.light') },
              { m: 'dark' as const, icon: 'moon' as const, label: t('settings.dark') },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.m}
                onPress={() => setMode(opt.m)}
                style={[styles.optionCard, mode === opt.m && styles.optionActive]}
                activeOpacity={0.7}
              >
                <View style={[styles.optionIcon, mode === opt.m && styles.optionIconActive]}>
                  <Ionicons name={opt.icon} size={22} color={mode === opt.m ? colors.white : colors.textSecondary} />
                </View>
                <Text style={[styles.optionLabel, mode === opt.m && styles.optionLabelActive]}>{opt.label}</Text>
                {mode === opt.m && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="language" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>{t('settings.language')}</Text>
          </View>
          <View style={styles.list}>
            {LANGUAGES.map((l) => (
              <TouchableOpacity key={l.code} onPress={() => setLang(l.code as any)} style={[styles.listItem, lang === l.code && styles.listItemActive]}>
                <View style={styles.listLeft}>
                  <View style={[styles.langCircle, lang === l.code && styles.langCircleActive]}>
                    <Text style={[styles.langInitial, lang === l.code && styles.langInitialActive]}>{l.code.toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={[styles.listTitle, lang === l.code && styles.listTitleActive]}>{l.native}</Text>
                    <Text style={styles.listSub}>{l.label}</Text>
                  </View>
                </View>
                {lang === l.code ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : <View style={styles.radio} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-circle-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.cardTitle}>{t('settings.account')}</Text>
          </View>
          <Text style={styles.signedHint}>{t('settings.signedInAs')} {user?.email ?? ''}</Text>
          <Text style={styles.version}>{t('settings.version')}</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const makeStyles = (colors: any) =>
  StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
    headerTitle: { ...typography.headingSmall, color: colors.textPrimary },
    scroll: { padding: spacing.base, paddingBottom: 100, gap: spacing.base },
    card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.base, borderWidth: 1, borderColor: colors.border },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.base },
    cardTitle: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
    optionsRow: { flexDirection: 'row', gap: spacing.sm },
    optionCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.base, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.background },
    optionActive: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
    optionIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
    optionIconActive: { backgroundColor: colors.primary },
    optionLabel: { ...typography.body, fontWeight: '600', color: colors.textPrimary, flex: 1 },
    optionLabelActive: { color: colors.primary },
    list: { gap: spacing.xs },
    listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: 'transparent' },
    listItemActive: { backgroundColor: colors.primarySurface, borderColor: colors.primary },
    listLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    langCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.backgroundSecondary, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
    langCircleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    langInitial: { ...typography.bodySmall, fontWeight: '700', color: colors.textSecondary },
    langInitialActive: { color: colors.white },
    listTitle: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
    listTitleActive: { color: colors.primary },
    listSub: { ...typography.caption, color: colors.textSecondary },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border },
    signedHint: { ...typography.bodySmall, color: colors.textSecondary },
    version: { ...typography.caption, color: colors.textTertiary, marginTop: spacing.xs },
  });
