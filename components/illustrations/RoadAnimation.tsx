import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';

interface RoadAnimationProps {
  width?: number;
}

export function RoadAnimation({ width = 300 }: RoadAnimationProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const translateX = useSharedValue(0);

  React.useEffect(() => {
    translateX.value = withRepeat(
      withTiming(-50, {
        duration: 1500,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={[styles.container, { width }]}>
      <View style={styles.road} />
      <Animated.View style={[styles.linesContainer, animatedStyle]}>
        {[...Array(10)].map((_, i) => (
          <View key={i} style={styles.line} />
        ))}
      </Animated.View>
    </View>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  container: {
    height: 30,
    justifyContent: 'center',
  },
  road: {
    position: 'absolute',
    width: '100%',
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  linesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '120%',
  },
  line: {
    width: 30,
    height: 3,
    backgroundColor: colors.muted,
    borderRadius: 1.5,
  },
});
