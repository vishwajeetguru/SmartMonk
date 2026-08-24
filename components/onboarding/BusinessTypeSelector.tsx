import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { BusinessType, BUSINESS_TYPES } from '../../types/profile';

interface BusinessTypeSelectorProps {
  selected: BusinessType | null;
  onSelect: (type: BusinessType) => void;
  error?: string;
}

const BUSINESS_TYPE_ICONS: Record<BusinessType, keyof typeof Ionicons.glyphMap> = {
  'Truck Owner': 'car',
  'Fleet Owner': 'car-sport',
  'Transport Contractor': 'business',
  Driver: 'person',
  Other: 'ellipsis-horizontal',
};

export function BusinessTypeSelector({
  selected,
  onSelect,
  error,
}: BusinessTypeSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Business Type *</Text>
      <View style={styles.optionsContainer}>
        {BUSINESS_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.option,
              selected === type && styles.optionSelected,
            ]}
            onPress={() => onSelect(type)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconContainer,
                selected === type && styles.iconContainerSelected,
              ]}
            >
              <Ionicons
                name={BUSINESS_TYPE_ICONS[type]}
                size={20}
                color={selected === type ? colors.white : colors.primary}
              />
            </View>
            <Text
              style={[
                styles.optionText,
                selected === type && styles.optionTextSelected,
              ]}
            >
              {type}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    minWidth: '45%',
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySurface,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  iconContainerSelected: {
    backgroundColor: colors.primary,
  },
  optionText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    flex: 1,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
