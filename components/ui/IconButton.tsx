import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
  variant?: 'filled' | 'outlined' | 'ghost';
  color?: string;
  style?: ViewStyle;
  disabled?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function IconButton({
  icon,
  onPress,
  size = 'medium',
  variant = 'ghost',
  color,
  style,
  disabled = false,
}: IconButtonProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const resolvedColor = color ?? colors.primary;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const iconSize = size === 'small' ? 20 : size === 'medium' ? 24 : 28;
  const containerSize = size === 'small' ? 36 : size === 'medium' ? 44 : 52;

  return (
    <AnimatedTouchable
      style={[
        styles.base,
        styles[variant],
        {
          width: containerSize,
          height: containerSize,
          borderRadius: containerSize / 2,
        },
        variant === 'filled' && { backgroundColor: resolvedColor },
        animatedStyle,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Ionicons
        name={icon}
        size={iconSize}
        color={variant === 'filled' ? colors.white : resolvedColor}
      />
    </AnimatedTouchable>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  filled: {
    backgroundColor: colors.primary,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
});
