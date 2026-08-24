import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const visibleRoutes = state.routes.filter((route) => {
    const opts: any = descriptors[route.key]?.options;
    if (route.name === 'edit-profile') return false;
    return opts?.href !== null;
  });
  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {visibleRoutes.map((route) => {
          const index = state.routes.indexOf(route);
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const label = (options.tabBarLabel as string) || (options.title as string) || route.name;
          const iconName = getIcon(route.name, isFocused);

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <TabItem key={route.key} label={label} icon={iconName} focused={isFocused} onPress={onPress} />
          );
        })}
      </View>
    </View>
  );
}

function getIcon(name: string, focused: boolean): keyof typeof Ionicons.glyphMap {
  const map: Record<string, keyof typeof Ionicons.glyphMap> = {
    home: focused ? 'home' : 'home-outline',
    suppliers: focused ? 'cube' : 'cube-outline',
    pumps: focused ? 'flame' : 'flame-outline',
    trips: focused ? 'navigate' : 'navigate-outline',
    drivers: focused ? 'people' : 'people-outline',
    profile: focused ? 'person-circle' : 'person-circle-outline',
    'edit-profile': focused ? 'person-circle' : 'person-circle-outline',
  };
  return map[name] || 'ellipse-outline';
}

function TabItem({
  label,
  icon,
  focused,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  onPress: () => void;
}) {
  const animatedIcon = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(focused ? 1.15 : 1, { damping: 12, stiffness: 300 }) }],
  }));
  const animatedLabel = useAnimatedStyle(() => ({
    opacity: withTiming(focused ? 1 : 0.7, { duration: 180 }),
    transform: [{ translateY: withTiming(focused ? 0 : 2, { duration: 180 }) }],
  }));

  return (
    <AnimatedTouchable
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.item, focused && styles.itemFocused]}
    >
      <Animated.View style={[styles.iconWrap, focused && styles.iconWrapFocused, animatedIcon]}>
        <Ionicons name={icon} size={22} color={focused ? colors.white : colors.textSecondary} />
      </Animated.View>
      <Animated.Text style={[styles.label, focused && styles.labelFocused, animatedLabel]} numberOfLines={1}>
        {label}
      </Animated.Text>
      {focused && <View style={styles.dot} />}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingBottom: 14,
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4, gap: 4, borderRadius: 16 },
  itemFocused: {},
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconWrapFocused: { backgroundColor: colors.primary },
  label: { ...typography.caption, fontSize: 10, fontWeight: '600', color: colors.textSecondary },
  labelFocused: { color: colors.primary },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary, marginTop: 1 },
});
