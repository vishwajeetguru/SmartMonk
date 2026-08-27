import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Vibration, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { useTheme } from '../../theme/ThemeContext';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

const ALARM_SOUND = require('../../assets/sounds/alarm.wav');
const SNOOZE_OPTIONS: { minutes: number; icon: keyof typeof Ionicons.glyphMap }[] = [
  { minutes: 5, icon: 'moon-outline' },
  { minutes: 10, icon: 'time-outline' },
  { minutes: 15, icon: 'sunny-outline' },
];
const VIBRATION_PATTERN = [0, 500, 300, 500, 300, 500];

interface AlarmModalProps {
  visible: boolean;
  title: string;
  body: string;
  enabled: boolean;
  onDismiss: () => void;
  onSnooze: (minutes: number) => void;
  onToggleEnabled: (enabled: boolean) => void;
}

export function AlarmModal({ visible, title, body, enabled, onDismiss, onSnooze, onToggleEnabled }: AlarmModalProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const player = useAudioPlayer(ALARM_SOUND);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!player) return;
    player.loop = true;
    if (visible && enabled) {
      player.seekTo(0).then(() => player.play()).catch(() => {});
      Vibration.vibrate(VIBRATION_PATTERN, true);
    } else {
      player.pause();
      Vibration.cancel();
    }
  }, [visible, enabled, player]);

  useEffect(() => {
    return () => {
      Vibration.cancel();
    };
  }, []);

  const handleDismiss = () => {
    Vibration.cancel();
    player?.pause();
    onDismiss();
  };

  const handleSnooze = (minutes: number) => {
    Vibration.cancel();
    player?.pause();
    onSnooze(minutes);
  };

  const handleToggle = (v: boolean) => {
    if (!v) {
      Vibration.cancel();
      player?.pause();
    }
    onToggleEnabled(v);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleDismiss} statusBarTranslucent>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleDismiss} />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.iconWrap}>
            <View style={styles.iconGlow} />
            <View style={styles.iconCircle}>
              <Ionicons name="alarm" size={44} color="#fff" />
            </View>
          </View>

          <Text style={styles.title}>{title || 'Reminder'}</Text>
          {body ? <Text style={styles.subtitle}>{body}</Text> : null}

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Reminder</Text>
              <Text style={styles.toggleDesc}>You will be notified at the scheduled time.</Text>
            </View>
            <Switch value={enabled} onValueChange={handleToggle} trackColor={{ false: '#CBD5E1', true: '#8B5CF6' }} thumbColor="#fff" />
          </View>

          <TouchableOpacity style={styles.dismiss} onPress={handleDismiss} activeOpacity={0.85}>
            <Text style={styles.dismissText}>OK, Got it</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.snoozeHeader} activeOpacity={0.7} disabled>
            <Ionicons name="calendar-outline" size={18} color="#7C3AED" />
            <Text style={styles.snoozeLabel}>Snooze for</Text>
          </TouchableOpacity>

          <View style={styles.snoozeRow}>
            {SNOOZE_OPTIONS.map((opt) => (
              <TouchableOpacity key={opt.minutes} style={styles.snoozeBtn} onPress={() => handleSnooze(opt.minutes)} activeOpacity={0.8}>
                <Ionicons name={opt.icon} size={18} color="#7C3AED" />
                <Text style={styles.snoozeText}>{opt.minutes} min</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const PURPLE = '#8B5CF6';
const PURPLE_SOFT = '#EDE9FE';
const TEXT_MUTED = '#64748B';

const makeStyles = (colors: any) => StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.62)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: 32 },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: '#E2E8F0', marginBottom: spacing.base },
  iconWrap: { alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm, marginBottom: spacing.md, height: 100 },
  iconGlow: { position: 'absolute', width: 110, height: 110, borderRadius: 55, backgroundColor: PURPLE_SOFT, opacity: 0.9 },
  iconCircle: { width: 92, height: 92, borderRadius: 46, backgroundColor: PURPLE, alignItems: 'center', justifyContent: 'center', shadowColor: PURPLE, shadowOpacity: 0.35, shadowRadius: 18, elevation: 10 },
  title: { ...typography.headingMedium, color: '#0F172A', textAlign: 'center', fontSize: 22, fontWeight: '800' },
  subtitle: { ...typography.bodySmall, color: TEXT_MUTED, textAlign: 'center', marginTop: 6, fontSize: 14 },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: spacing.base },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.base },
  toggleLabel: { fontSize: 15, fontWeight: '700', color: PURPLE },
  toggleDesc: { fontSize: 12, color: TEXT_MUTED, marginTop: 2 },
  dismiss: { width: '100%', backgroundColor: PURPLE, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: spacing.base },
  dismissText: { ...typography.button, color: '#fff', fontSize: 16 },
  snoozeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center', marginBottom: spacing.sm },
  snoozeLabel: { fontSize: 14, fontWeight: '700', color: PURPLE },
  snoozeRow: { flexDirection: 'row', gap: 10, width: '100%' },
  snoozeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: PURPLE, backgroundColor: '#fff' },
  snoozeText: { fontSize: 14, fontWeight: '600', color: PURPLE },
});
