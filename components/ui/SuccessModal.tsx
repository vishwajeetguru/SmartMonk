import React, { useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay, withTiming } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';

interface SuccessModalProps {
  visible: boolean;
  title: string;
  message?: string;
  onClose: () => void;
}

export function SuccessModal({ visible, title, message, onClose }: SuccessModalProps) {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
      opacity.value = withDelay(100, withTiming(1, { duration: 250 }));
    } else {
      scale.value = 0.5;
      opacity.value = 0;
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, animatedStyle]}>
          <View style={styles.iconWrap}>
            <Ionicons name="checkmark" size={48} color={colors.white} />
          </View>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <TouchableOpacity style={styles.button} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Done</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  card: { width: '100%', maxWidth: 340, backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center' },
  iconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.base },
  title: { ...typography.headingSmall, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.xs },
  message: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
  button: { backgroundColor: colors.primary, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: radius.md, width: '100%', alignItems: 'center' },
  buttonText: { ...typography.button, color: colors.white },
});
