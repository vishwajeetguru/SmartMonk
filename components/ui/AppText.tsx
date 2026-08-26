import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { typography, TypographyKey } from '../../constants/typography';

interface AppTextProps extends TextProps {
  variant?: TypographyKey;
  color?: string;
  align?: 'left' | 'center' | 'right';
  children: React.ReactNode;
}

export function AppText({
  variant = 'body',
  color,
  align = 'left',
  style,
  children,
  ...props
}: AppTextProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const textStyles = [
    styles.base,
    typography[variant],
    { color: color || colors.textPrimary },
    { textAlign: align },
    style,
  ];

  return (
    <Text style={textStyles} {...props}>
      {children}
    </Text>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  base: {},
});
