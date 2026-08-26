import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

export interface ActionMenuItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  divider?: boolean;
  onPress: () => void;
}

interface ActionMenuProps {
  visible: boolean;
  onClose: () => void;
  items: ActionMenuItem[];
}

export function ActionMenu({ visible, onClose, items }: ActionMenuProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheet}>
          {items.map((item, idx) => (
            <React.Fragment key={item.label + idx}>
              {item.divider ? <View style={styles.divider} /> : null}
              <TouchableOpacity style={styles.item} onPress={item.onPress} activeOpacity={0.7}>
                <Ionicons name={item.icon} size={20} color={item.color || colors.textPrimary} />
                <Text style={[styles.itemText, item.color ? { color: item.color } : null]}>{item.label}</Text>
              </TouchableOpacity>
            </React.Fragment>
          ))}
          <TouchableOpacity style={styles.cancel} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.32)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.base, paddingBottom: 32 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  itemText: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.borderLight },
  cancel: { marginTop: 12, backgroundColor: colors.backgroundSecondary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelText: { ...typography.body, color: colors.textPrimary, fontWeight: '700' },
});
