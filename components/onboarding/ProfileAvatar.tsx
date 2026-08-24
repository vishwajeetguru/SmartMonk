import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { formatters } from '../../utils/formatters';

interface ProfileAvatarProps {
  imageUri: string | null;
  name: string;
  onImageSelected: (uri: string) => void;
  size?: number;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function ProfileAvatar({
  imageUri,
  name,
  onImageSelected,
  size = 120,
}: ProfileAvatarProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to upload a photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onImageSelected(result.assets[0].uri);
    }
  };

  const initials = formatters.getInitials(name);

  return (
    <AnimatedTouchable
      style={[styles.container, animatedStyle, { width: size, height: size }]}
      onPress={pickImage}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
    >
      {imageUri ? (
        <View style={[styles.imageContainer, { width: size, height: size }]}>
          <Text style={styles.imagePlaceholder}>Image</Text>
        </View>
      ) : (
        <View
          style={[
            styles.placeholder,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          {initials ? (
            <Text
              style={[
                styles.initials,
                { fontSize: size * 0.35 },
              ]}
            >
              {initials}
            </Text>
          ) : (
            <Ionicons name="person" size={size * 0.4} color={colors.white} />
          )}
        </View>
      )}
      <View style={styles.cameraIcon}>
        <Ionicons name="camera" size={20} color={colors.white} />
      </View>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  imageContainer: {
    borderRadius: radius.full,
    overflow: 'hidden',
    backgroundColor: colors.primarySurface,
  },
  imagePlaceholder: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 120,
  },
  placeholder: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    ...typography.headingLarge,
    color: colors.white,
    fontWeight: '700',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
});
