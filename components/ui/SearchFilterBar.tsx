import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

export interface FilterOption {
  label: string;
  value: string;
  dotColor?: string;
}

interface SearchFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filter: string;
  onFilterChange: (value: string) => void;
  filterOptions: FilterOption[];
  filterTitle?: string;
  allLabel?: string;
}

export function SearchFilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filter,
  onFilterChange,
  filterOptions,
  filterTitle = 'Filter',
  allLabel = 'All',
}: SearchFilterBarProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [showSheet, setShowSheet] = useState(false);

  const options: FilterOption[] = [
    { label: allLabel, value: allLabel },
    ...filterOptions,
  ];

  const activeOption = filter !== allLabel
    ? filterOptions.find((o) => o.value === filter)
    : undefined;

  return (
    <>
      <View style={styles.row}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={colors.textTertiary} />
          <TextInput
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.textTertiary}
            style={styles.searchInput}
            value={search}
            onChangeText={onSearchChange}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => onSearchChange('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowSheet(true)} activeOpacity={0.7}>
          <Ionicons name="filter-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.filterBtnText}>Filter</Text>
        </TouchableOpacity>
      </View>

      {activeOption && (
        <View style={styles.activeRow}>
          <View style={styles.activeChip}>
            {activeOption.dotColor ? (
              <View style={[styles.dot, { backgroundColor: activeOption.dotColor }]} />
            ) : null}
            <Text style={styles.activeChipText}>{activeOption.label}</Text>
            <TouchableOpacity onPress={() => onFilterChange(allLabel)} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal visible={showSheet} transparent animationType="fade" onRequestClose={() => setShowSheet(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowSheet(false)}>
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.title}>{filterTitle}</Text>
              <TouchableOpacity onPress={() => setShowSheet(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.list}>
              {options.map((opt) => {
                const active = filter === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => {
                      onFilterChange(opt.value);
                      setShowSheet(false);
                    }}
                    style={[styles.option, active && styles.optionActive]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionLeft}>
                      {opt.dotColor ? (
                        <View style={[styles.dot, { backgroundColor: opt.dotColor }]} />
                      ) : null}
                      <Text style={[styles.optionText, active && styles.optionTextActive]}>{opt.label}</Text>
                    </View>
                    {active && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  row: { flexDirection: 'row', paddingHorizontal: spacing.base, gap: 12, marginBottom: 16, alignItems: 'center' },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, paddingHorizontal: 14, height: 48 },
  searchInput: { flex: 1, ...typography.bodySmall, color: colors.textPrimary, paddingVertical: 0 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, paddingHorizontal: 16, height: 48 },
  filterBtnText: { ...typography.bodySmall, color: colors.textSecondary, fontWeight: '600' },
  activeRow: { paddingHorizontal: spacing.base, marginBottom: 16 },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  activeChipText: { ...typography.bodySmall, color: '#1D4ED8', fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.32)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.base, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.base },
  title: { ...typography.headingSmall, color: colors.textPrimary },
  list: { gap: 4, marginTop: 4 },
  option: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 10 },
  optionActive: { backgroundColor: colors.primarySurface },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  optionText: { ...typography.body, color: colors.textPrimary },
  optionTextActive: { color: colors.primary, fontWeight: '700' },
});
