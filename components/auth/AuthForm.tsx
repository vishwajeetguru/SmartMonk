import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

interface AuthFormProps {
  children: React.ReactNode;
  footerText?: string;
  footerLinkText?: string;
  onFooterLinkPress?: () => void;
}

export function AuthForm({
  children,
  footerText,
  footerLinkText,
  onFooterLinkPress,
}: AuthFormProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return (
    <View style={styles.container}>
      <View style={styles.form}>{children}</View>
      {footerText && footerLinkText && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>{footerText} </Text>
          <TouchableOpacity onPress={onFooterLinkPress}>
            <Text style={styles.footerLink}>{footerLinkText}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  footerText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  footerLink: {
    ...typography.link,
    color: colors.primary,
    fontWeight: '600',
  },
});
