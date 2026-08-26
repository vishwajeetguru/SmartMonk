import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';

interface TruckIllustrationProps {
  size?: number;
}

export function TruckIllustration({ size = 200 }: TruckIllustrationProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const translateX = useSharedValue(0);

  React.useEffect(() => {
    translateX.value = withRepeat(
      withTiming(10, {
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={styles.roadContainer}>
        <View style={styles.road} />
        <View style={styles.roadLineContainer}>
          {[...Array(5)].map((_, i) => (
            <View key={i} style={styles.roadLine} />
          ))}
        </View>
      </View>
      <Animated.View style={[styles.truckContainer, animatedStyle]}>
        <Ionicons name="car" size={size * 0.4} color={colors.primary} />
      </Animated.View>
      <View style={styles.cloudsContainer}>
        <View style={[styles.cloud, styles.cloud1]} />
        <View style={[styles.cloud, styles.cloud2]} />
      </View>
    </View>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  roadContainer: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    height: 20,
  },
  road: {
    width: '100%',
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
  },
  roadLineContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 4,
  },
  roadLine: {
    width: 20,
    height: 2,
    backgroundColor: colors.mutedLight,
    borderRadius: 1,
  },
  truckContainer: {
    position: 'absolute',
    bottom: 28,
  },
  cloudsContainer: {
    position: 'absolute',
    top: 20,
    width: '100%',
  },
  cloud: {
    position: 'absolute',
    backgroundColor: colors.primarySurface,
    borderRadius: 20,
  },
  cloud1: {
    width: 40,
    height: 20,
    left: 20,
  },
  cloud2: {
    width: 30,
    height: 15,
    right: 30,
    top: 10,
  },
});
