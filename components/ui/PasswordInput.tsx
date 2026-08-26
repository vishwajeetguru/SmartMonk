import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';

type AnimatedColorValue = string;

interface PasswordInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  containerStyle?: ViewStyle;
  editable?: boolean;
}

export function PasswordInput({
  label,
  value,
  onChangeText,
  placeholder = 'Enter your password',
  error,
  containerStyle,
  editable = true,
}: PasswordInputProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const borderColor = useSharedValue<string>(colors.border);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: borderColor.value as AnimatedColorValue,
  }));

  const handleFocus = () => {
    setIsFocused(true);
    borderColor.value = withTiming(colors.primary, { duration: 200 });
  };

  const handleBlur = () => {
    setIsFocused(false);
    borderColor.value = withTiming(error ? colors.error : colors.border, {
      duration: 200,
    });
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Animated.View
        style={[
          styles.inputContainer,
          animatedBorderStyle,
          isFocused && styles.inputFocused,
          error && styles.inputError,
        ]}
      >
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={!isPasswordVisible}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={editable}
          autoCapitalize="none"
        />
        <TouchableOpacity
          onPress={togglePasswordVisibility}
          style={styles.eyeIcon}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </Animated.View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  container: {
    marginBottom: spacing.base,
  },
  label: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    minHeight: 52,
  },
  inputFocused: {
    borderWidth: 1.5,
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  eyeIcon: {
    paddingRight: spacing.md,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
