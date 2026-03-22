import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Difficulty } from '../utils/mathGenerator';
import type { MemeCategory } from '../utils/memeGenerator';
import type { RingtoneKey } from '../utils/alarmSound';

// ── No notifications — purely local store + polling in _layout ──

export interface Alarm {
  id:            string;
  hour:          number;   // 0-23 (24h internally)
  minute:        number;   // 0-59
  label:         string;
  enabled:       boolean;
  difficulty:    Difficulty;
  ringtone:      RingtoneKey;
  memeCategory:  MemeCategory;
  questionCount: number;   // 3-10
}

interface AlarmStore {
  alarms:           Alarm[];
  activeAlarmId:    string | null;
  loaded:           boolean;
  loadAlarms:       () => Promise<void>;
  addAlarm:         (data: Omit<Alarm, 'id' | 'enabled'>) => Promise<void>;
  toggleAlarm:      (id: string) => void;
  deleteAlarm:      (id: string) => void;
  setActiveAlarmId: (id: string | null) => void;
}

const ALARM_KEY = '@wakeupidiot_alarms_v4';

const persist = (alarms: Alarm[]) =>
  AsyncStorage.setItem(ALARM_KEY, JSON.stringify(alarms)).catch(() => {});

/** Fill missing fields for backwards-compat */
const normalise = (a: Partial<Alarm>): Alarm => ({
  questionCount: 3,
  memeCategory:  'mixed'   as MemeCategory,
  difficulty:    'medium'  as Difficulty,
  ringtone:      'classic' as RingtoneKey,
  ...a,
  id:      a.id      ?? `alarm_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  hour:    a.hour    ?? 7,
  minute:  a.minute  ?? 0,
  label:   a.label   ?? '',
  enabled: a.enabled ?? true,
});

export const useAlarmStore = create<AlarmStore>((set, get) => ({
  alarms:        [],
  activeAlarmId: null,
  loaded:        false,

  loadAlarms: async () => {
    try {
      const raw    = await AsyncStorage.getItem(ALARM_KEY);
      const alarms = raw
        ? (JSON.parse(raw) as Partial<Alarm>[]).map(normalise)
        : [];
      set({ alarms, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  addAlarm: async (data) => {
    const alarm  = normalise({ ...data, enabled: true });
    const alarms = [...get().alarms, alarm];
    set({ alarms });
    await persist(alarms);
  },

  toggleAlarm: (id) => {
    const alarms = get().alarms.map((a) =>
      a.id === id ? { ...a, enabled: !a.enabled } : a
    );
    set({ alarms });
    persist(alarms);
  },

  deleteAlarm: (id) => {
    const alarms = get().alarms.filter((a) => a.id !== id);
    set({ alarms });
    persist(alarms);
  },

  setActiveAlarmId: (id) => set({ activeAlarmId: id }),
}));
