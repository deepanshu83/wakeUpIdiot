import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';

// ─── Ringtone registry ────────────────────────────────────────────────────────
// All sounds are bundled locally (assets/sounds/*.wav) — no internet needed!

export type RingtoneCategory = 'loud' | 'gentle' | 'funny' | 'normal';

export interface Ringtone {
  key:      string;
  name:     string;
  emoji:    string;
  category: RingtoneCategory;
  sound:    number; // Metro require() returns a number (asset ID)
}

export const RINGTONES: Record<string, Ringtone> = {

  // ── LOUD ──────────────────────────────────────────────────
  alarm_classic: {
    key: 'alarm_classic', name: 'Classic Alarm',  emoji: '🔔',
    category: 'loud',
    sound: require('../../assets/sounds/alarm_classic.wav'),
  },
  alarm_digital: {
    key: 'alarm_digital', name: 'Digital Beep',   emoji: '📱',
    category: 'loud',
    sound: require('../../assets/sounds/alarm_digital.wav'),
  },
  alarm_urgent: {
    key: 'alarm_urgent',  name: 'Urgent Alert',   emoji: '🚨',
    category: 'loud',
    sound: require('../../assets/sounds/alarm_urgent.wav'),
  },
  alarm_deep: {
    key: 'alarm_deep',    name: 'Deep Buzz',       emoji: '💣',
    category: 'loud',
    sound: require('../../assets/sounds/alarm_deep.wav'),
  },

  // ── GENTLE ────────────────────────────────────────────────
  gentle_soft: {
    key: 'gentle_soft',   name: 'Soft Tone',       emoji: '🌙',
    category: 'gentle',
    sound: require('../../assets/sounds/gentle_soft.wav'),
  },
  gentle_chime: {
    key: 'gentle_chime',  name: 'Wind Chime',      emoji: '🎐',
    category: 'gentle',
    sound: require('../../assets/sounds/gentle_chime.wav'),
  },
  gentle_wave: {
    key: 'gentle_wave',   name: 'Calm Wave',       emoji: '🌊',
    category: 'gentle',
    sound: require('../../assets/sounds/gentle_wave.wav'),
  },

  // ── FUNNY ─────────────────────────────────────────────────
  funny_squeak: {
    key: 'funny_squeak',  name: 'Mouse Squeak!',   emoji: '🐭',
    category: 'funny',
    sound: require('../../assets/sounds/funny_squeak.wav'),
  },
  funny_low: {
    key: 'funny_low',     name: 'Dumb Buzz 😂',    emoji: '🤡',
    category: 'funny',
    sound: require('../../assets/sounds/funny_low.wav'),
  },
  funny_bounce: {
    key: 'funny_bounce',  name: 'Boing!',          emoji: '🎪',
    category: 'funny',
    sound: require('../../assets/sounds/funny_bounce.wav'),
  },

  // ── NORMAL ────────────────────────────────────────────────
  normal_bell: {
    key: 'normal_bell',   name: 'Classic Bell',    emoji: '🔕',
    category: 'normal',
    sound: require('../../assets/sounds/normal_bell.wav'),
  },
  normal_notify: {
    key: 'normal_notify', name: 'Notify Beep',     emoji: '📳',
    category: 'normal',
    sound: require('../../assets/sounds/normal_notify.wav'),
  },
  normal_tone: {
    key: 'normal_tone',   name: 'Simple Tone',     emoji: '🎵',
    category: 'normal',
    sound: require('../../assets/sounds/normal_tone.wav'),
  },
};

export type RingtoneKey = keyof typeof RINGTONES;
export const RINGTONE_LIST = Object.values(RINGTONES);

export const RINGTONE_CATEGORIES: { key: RingtoneCategory; label: string; emoji: string }[] = [
  { key: 'loud',   label: 'Loud',   emoji: '🔊' },
  { key: 'gentle', label: 'Gentle', emoji: '🌙' },
  { key: 'funny',  label: 'Funny',  emoji: '😂' },
  { key: 'normal', label: 'Normal', emoji: '🔔' },
];

// ─── Playback state ───────────────────────────────────────────────────────────
let alarmSound:   Audio.Sound | null = null;
let previewSound: Audio.Sound | null = null;
let previewTimer: ReturnType<typeof setTimeout> | null = null;

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function safeUnload(sound: Audio.Sound | null) {
  if (!sound) return;
  try { await sound.stopAsync(); }   catch {}
  try { await sound.unloadAsync(); } catch {}
}

async function setAlarmMode() {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS:         false,
      playsInSilentModeIOS:       true,
      interruptionModeIOS:        InterruptionModeIOS.DoNotMix,
      staysActiveInBackground:    true,
      interruptionModeAndroid:    InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid:          false,
      playThroughEarpieceAndroid: false,
    });
  } catch {}
}

async function resetMode() {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS:         false,
      playsInSilentModeIOS:       false,
      interruptionModeIOS:        InterruptionModeIOS.MixWithOthers,
      staysActiveInBackground:    false,
      interruptionModeAndroid:    InterruptionModeAndroid.DuckOthers,
      shouldDuckAndroid:          true,
      playThroughEarpieceAndroid: false,
    });
  } catch {}
}

// ─── Alarm playback ───────────────────────────────────────────────────────────
export async function startAlarmSound(ringtone: RingtoneKey = 'alarm_classic'): Promise<void> {
  await safeUnload(alarmSound);
  alarmSound = null;
  await setAlarmMode();

  const tone    = RINGTONES[ringtone] ?? RINGTONES.alarm_classic;
  const { sound } = await Audio.Sound.createAsync(
    tone.sound,
    { shouldPlay: true, isLooping: true, volume: 1.0 }
  );
  alarmSound = sound;
}

export async function stopAlarmSound(): Promise<void> {
  await safeUnload(alarmSound);
  alarmSound = null;
  await resetMode();
}

// ─── Preview playback ─────────────────────────────────────────────────────────
export async function previewRingtone(ringtone: RingtoneKey): Promise<void> {
  if (previewTimer) { clearTimeout(previewTimer); previewTimer = null; }
  await safeUnload(previewSound);
  previewSound = null;

  const tone    = RINGTONES[ringtone] ?? RINGTONES.alarm_classic;
  const { sound } = await Audio.Sound.createAsync(
    tone.sound,
    { shouldPlay: true, isLooping: false, volume: 1.0 }
  );
  previewSound = sound;

  // Auto-stop after 4 s
  previewTimer = setTimeout(stopPreview, 4000);
}

export async function stopPreview(): Promise<void> {
  if (previewTimer) { clearTimeout(previewTimer); previewTimer = null; }
  await safeUnload(previewSound);
  previewSound = null;
}
