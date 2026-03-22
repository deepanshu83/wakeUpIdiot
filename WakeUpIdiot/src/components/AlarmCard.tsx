import React, { useRef } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Alarm, useAlarmStore } from '../store/alarmStore';
import { RINGTONES } from '../utils/alarmSound';

interface Props { alarm: Alarm; }

function formatTime(hour: number, minute: number) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  return {
    display: `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    period,
  };
}

function getNextIn(hour: number, minute: number): string {
  const now   = new Date();
  const alarm = new Date();
  alarm.setHours(hour, minute, 0, 0);
  if (alarm <= now) alarm.setDate(alarm.getDate() + 1);
  const totalMin = Math.round((alarm.getTime() - now.getTime()) / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `in ${m}m`;
  if (m === 0) return `in ${h}h`;
  return `in ${h}h ${m}m`;
}

const DIFF_COLORS: Record<string, string> = {
  easy: '#00cc88', medium: '#ffaa00', hard: '#ff6644', insane: '#ff2244',
};
const DIFF_LABELS: Record<string, string> = {
  easy: '⭐', medium: '⭐⭐', hard: '⭐⭐⭐', insane: '💀',
};

export default function AlarmCard({ alarm }: Props) {
  const { toggleAlarm, deleteAlarm } = useAlarmStore();
  const { display, period } = formatTime(alarm.hour, alarm.minute);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleToggle = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1,    duration: 80, useNativeDriver: true }),
    ]).start();
    toggleAlarm(alarm.id);
  };

  const diffColor = DIFF_COLORS[alarm.difficulty ?? 'medium'];

  return (
    <Animated.View
      style={[
        styles.card,
        !alarm.enabled && styles.cardDisabled,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      {/* Active bar */}
      {alarm.enabled && <View style={styles.activeBar} />}

      <View style={styles.inner}>
        <View style={styles.left}>
          {/* Time */}
          <View style={styles.timeRow}>
            <Text style={[styles.time, !alarm.enabled && styles.dimmed]}>{display}</Text>
            <Text style={[styles.period, !alarm.enabled && styles.dimmed]}> {period}</Text>
          </View>

          {/* Label */}
          <Text style={[styles.label, !alarm.enabled && styles.labelDim]}>
            {alarm.label || 'Alarm'}
          </Text>

          {/* Meta chips */}
          <View style={styles.chipRow}>
            {alarm.enabled && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>{getNextIn(alarm.hour, alarm.minute)}</Text>
              </View>
            )}
            <View style={[styles.chip, { borderColor: diffColor + '66', backgroundColor: diffColor + '18' }]}>
              <Text style={[styles.chipText, { color: diffColor }]}>
                {DIFF_LABELS[alarm.difficulty ?? 'medium']}
              </Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                {RINGTONES[alarm.ringtone ?? 'classic']?.name?.split(' ')[0] ?? '🔔'}
              </Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{alarm.questionCount ?? 3}Q</Text>
            </View>
          </View>
        </View>

        <View style={styles.right}>
          <Switch
            value={alarm.enabled}
            onValueChange={handleToggle}
            trackColor={{ false: '#1e1e1e', true: '#00ffcc33' }}
            thumbColor={alarm.enabled ? '#00ffcc' : '#333'}
            ios_backgroundColor="#1e1e1e"
          />
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => deleteAlarm(alarm.id)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.deleteIcon}>🗑</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0e0e0e',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00ffcc22',
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#00ffcc',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardDisabled: { borderColor: '#1a1a1a', shadowOpacity: 0, elevation: 0 },
  activeBar:    { width: 3, backgroundColor: '#00ffcc' },
  inner: {
    flex: 1,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: { flex: 1, gap: 4 },
  timeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  time:   { fontSize: 42, color: '#fff', fontWeight: 'bold', letterSpacing: -1.5 },
  period: { fontSize: 14, color: '#00ffcc', fontWeight: '700', marginBottom: 6 },
  dimmed: { color: '#2e2e2e' },
  label:   { color: '#666', fontSize: 12 },
  labelDim:{ color: '#252525' },
  chipRow: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  chip: {
    backgroundColor: '#00ffcc14',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#00ffcc28',
  },
  chipText: { color: '#00ffcc', fontSize: 10, fontWeight: '700' },
  right: { alignItems: 'center', gap: 14 },
  deleteBtn: { padding: 4 },
  deleteIcon: { fontSize: 16 },
});
