import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';

// ─── Ringtone registry ────────────────────────────────────────────────────────
// All sounds are bundled locally — no internet needed!

export type RingtoneCategory = 'loud' | 'gentle' | 'funny' | 'normal';

export interface Ringtone {
  key:      string;
  name:     string;
  emoji:    string;
  category: RingtoneCategory;
  sound:    number; // Metro require() asset ID
}

export const RINGTONES: Record<string, Ringtone> = {
  // ── LOUD ────────────────────────────────────────────────────
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
  // ── GENTLE ──────────────────────────────────────────────────
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
  // ── FUNNY ───────────────────────────────────────────────────
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
  // ── NORMAL ──────────────────────────────────────────────────
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
let alarmPlayer:   AudioPlayer | null = null;
let previewPlayer: AudioPlayer | null = null;
let previewTimer:  ReturnType<typeof setTimeout> | null = null;

function safeStop(player: AudioPlayer | null) {
  if (!player) return;
  try { player.pause(); }   catch {}
  try { player.remove(); }  catch {}
}

// ─── Alarm playback ───────────────────────────────────────────────────────────
export async function startAlarmSound(ringtone: RingtoneKey = 'alarm_classic'): Promise<void> {
  safeStop(alarmPlayer);
  alarmPlayer = null;

  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    });
  } catch {}

  const tone    = RINGTONES[ringtone] ?? RINGTONES.alarm_classic;
  alarmPlayer   = createAudioPlayer(tone.sound);
  alarmPlayer.loop = true;
  alarmPlayer.play();
}

export async function stopAlarmSound(): Promise<void> {
  safeStop(alarmPlayer);
  alarmPlayer = null;
  try {
    await setAudioModeAsync({ playsInSilentMode: false, shouldPlayInBackground: false });
  } catch {}
}

// ─── Preview playback ─────────────────────────────────────────────────────────
export async function previewRingtone(ringtone: RingtoneKey): Promise<void> {
  if (previewTimer) { clearTimeout(previewTimer); previewTimer = null; }
  safeStop(previewPlayer);
  previewPlayer = null;

  const tone    = RINGTONES[ringtone] ?? RINGTONES.alarm_classic;
  previewPlayer = createAudioPlayer(tone.sound);
  previewPlayer.loop = false;
  previewPlayer.play();

  // Auto-stop after 4 s
  previewTimer = setTimeout(stopPreview, 4000);
}

export async function stopPreview(): Promise<void> {
  if (previewTimer) { clearTimeout(previewTimer); previewTimer = null; }
  safeStop(previewPlayer);
  previewPlayer = null;
}
