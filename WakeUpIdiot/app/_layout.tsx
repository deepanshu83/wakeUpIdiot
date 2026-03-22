import { Stack } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useAlarmStore } from '../src/store/alarmStore';

// ── No notifications. Alarms fire via 5-second polling while app is open. ──

export default function RootLayout() {
  const router  = useRouter();
  const { loadAlarms, setActiveAlarmId } = useAlarmStore();
  const firedSet  = useRef<Set<string>>(new Set());

  useEffect(() => {
    loadAlarms();

    // Poll every 5 s — fire any alarm whose hour:minute matches now
    const timer = setInterval(() => {
      const { alarms } = useAlarmStore.getState();
      const now    = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();

      for (const alarm of alarms) {
        if (!alarm.enabled) continue;
        const alarmMin = alarm.hour * 60 + alarm.minute;

        if (alarmMin === nowMin && !firedSet.current.has(alarm.id)) {
          firedSet.current.add(alarm.id);
          setActiveAlarmId(alarm.id);
          router.push('/alarm');
          // Allow the same alarm to fire again tomorrow
          setTimeout(() => firedSet.current.delete(alarm.id), 90_000);
          break;
        }
      }
    }, 5_000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="create-alarm" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="alarm"        options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="challenge"    options={{ gestureEnabled: false }} />
    </Stack>
  );
}
