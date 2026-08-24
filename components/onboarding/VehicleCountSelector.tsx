import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { VehicleCount, VEHICLE_COUNT_OPTIONS } from '../../types/profile';

interface VehicleCountSelectorProps {
  selected: VehicleCount | null;
  onSelect: (count: VehicleCount) => void;
  error?: string;
}

export function VehicleCountSelector({
  selected,
  onSelect,
  error,
}: VehicleCountSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Number of Vehicles</Text>
      <View style={styles.optionsContainer}>
        {VEHICLE_COUNT_OPTIONS.map((count) => (
          <TouchableOpacity
            key={count}
            style={[
              styles.option,
              selected === count && styles.optionSelected,
            ]}
            onPress={() => onSelect(count)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.optionText,
                selected === count && styles.optionTextSelected,
              ]}
            >
              {count}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.base,
  },
  label: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  option: {
    flex: 1,
    minWidth: 70,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  optionText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
