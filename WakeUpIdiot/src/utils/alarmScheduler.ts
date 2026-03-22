import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ─── Channel setup ────────────────────────────────────────────────────────────
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('alarm-channel', {
        name:              'Alarm',
        description:       'Alarm rings',
        importance:        Notifications.AndroidImportance.MAX,
        vibrationPattern:  [0, 400, 200, 400],
        lightColor:        '#00ffcc',
        sound:             'default',
        enableVibrate:     true,
        bypassDnd:         true,
        showBadge:         false,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (err) {
    console.warn('[alarmScheduler] permission request failed:', err);
    return false;
  }
}

// ─── Schedule ─────────────────────────────────────────────────────────────────
export async function scheduleAlarm(alarm: {
  id:     string;
  hour:   number;
  minute: number;
  label:  string;
}): Promise<string | null> {
  try {
    // Cancel any existing notification for this alarm first
    await cancelAlarmById(alarm.id);

    const now         = new Date();
    const triggerDate = new Date();
    triggerDate.setHours(alarm.hour, alarm.minute, 0, 0);

    // If alarm time already passed today, schedule for tomorrow
    if (triggerDate.getTime() <= now.getTime()) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    const secondsUntil = Math.max(
      1,
      Math.floor((triggerDate.getTime() - Date.now()) / 1000)
    );

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title:    '⏰ Wake Up Idiot!',
        body:     alarm.label?.trim() || 'Uth ja bhai! Duniya aage badh rahi hai 😤',
        data:     { alarmId: alarm.id },
        sound:    'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: {
        type:      Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds:   secondsUntil,
        repeats:   false,
        channelId: 'alarm-channel',
      },
    });

    return notificationId;
  } catch (err) {
    // Log but don't crash — alarm is still saved in the store
    console.warn('[alarmScheduler] scheduleAlarm failed:', err);
    return null;
  }
}

// ─── Cancel ───────────────────────────────────────────────────────────────────
export async function cancelAlarmById(alarmId: string): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => n.content.data?.alarmId === alarmId)
        .map((n)  => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );
  } catch {
    // Ignore cancellation errors
  }
}
