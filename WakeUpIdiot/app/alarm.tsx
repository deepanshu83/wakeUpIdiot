import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAlarmStore } from '../src/store/alarmStore';
import { getRandomMeme } from '../src/utils/memeGenerator';
import { startAlarmSound, stopAlarmSound } from '../src/utils/alarmSound';

const { width } = Dimensions.get('window');

const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AlarmRingScreen() {
  const router = useRouter();
  const { alarms, activeAlarmId } = useAlarmStore();

  // Get the active alarm's settings (fallback to defaults)
  const activeAlarm = alarms.find((a) => a.id === activeAlarmId);
  const ringtone     = activeAlarm?.ringtone     ?? 'classic';
  const memeCategory = activeAlarm?.memeCategory ?? 'mixed';

  const [meme,        setMeme]        = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  const fadeAnim     = useRef(new Animated.Value(0)).current;
  const pulseAnim    = useRef(new Animated.Value(1)).current;
  const ring1Anim    = useRef(new Animated.Value(0)).current;
  const ring2Anim    = useRef(new Animated.Value(0)).current;
  const ring3Anim    = useRef(new Animated.Value(0)).current;
  const shakeAnim    = useRef(new Animated.Value(0)).current;
  const btnScale     = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setMeme(getRandomMeme(memeCategory));
    startAlarmSound(ringtone);

    // Clock
    const tick = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${h}:${m}`);
      setCurrentDate(`${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]}`);
    };
    tick();
    const clockInterval = setInterval(tick, 1000);

    // Fade in
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();

    // Pulse clock
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();

    // Ripple rings
    const makeRipple = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 1800, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0,    useNativeDriver: true }),
        ])
      );
    const r1 = makeRipple(ring1Anim, 0);
    const r2 = makeRipple(ring2Anim, 600);
    const r3 = makeRipple(ring3Anim, 1200);
    r1.start(); r2.start(); r3.start();

    // Bell shake
    const shake = Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 9,  duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -9, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6,  duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0,  duration: 80, useNativeDriver: true }),
        Animated.delay(700),
      ])
    );
    shake.start();

    // Button pulse
    const btn = Animated.loop(
      Animated.sequence([
        Animated.timing(btnScale, { toValue: 1.06, duration: 600, useNativeDriver: true }),
        Animated.timing(btnScale, { toValue: 1,    duration: 600, useNativeDriver: true }),
      ])
    );
    btn.start();

    // Haptics
    const haptic = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }, 1500);

    return () => {
      clearInterval(clockInterval);
      clearInterval(haptic);
      pulse.stop(); r1.stop(); r2.stop(); r3.stop(); shake.stop(); btn.stop();
      stopAlarmSound();
    };
  }, []);

  const handleStop = () => {
    stopAlarmSound();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    router.push('/challenge');
  };

  const ringSize = width * 0.72;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#060606" />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>

        {/* Badge */}
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Animated.Text
              style={[
                styles.bellIcon,
                {
                  transform: [{
                    rotate: shakeAnim.interpolate({
                      inputRange: [-10, 10],
                      outputRange: ['-10deg', '10deg'],
                    }),
                  }],
                },
              ]}
            >
              🔔
            </Animated.Text>
            <Text style={styles.badgeText}>ALARM RINGING</Text>
          </View>
        </View>

        {/* Ripple + Clock */}
        <View style={[styles.rippleWrapper, { width: ringSize, height: ringSize }]}>
          {[ring1Anim, ring2Anim, ring3Anim].map((anim, i) => (
            <Animated.View
              key={i}
              style={[
                styles.ripple,
                {
                  width: ringSize,
                  height: ringSize,
                  borderRadius: ringSize / 2,
                  opacity: anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.45, 0] }),
                  transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1.45] }) }],
                },
              ]}
            />
          ))}

          <View
            style={[
              styles.clockCircle,
              { width: ringSize * 0.78, height: ringSize * 0.78, borderRadius: ringSize * 0.39 },
            ]}
          >
            <Text style={styles.dateText}>{currentDate}</Text>
            <Animated.Text style={[styles.timeText, { transform: [{ scale: pulseAnim }] }]}>
              {currentTime}
            </Animated.Text>
          </View>
        </View>

        {/* Meme */}
        <View style={styles.memeBox}>
          <Text style={styles.memeText}>{meme}</Text>
        </View>

        {/* Stop Button */}
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <TouchableOpacity style={styles.stopBtn} onPress={handleStop} activeOpacity={0.8}>
            <Text style={styles.stopBtnIcon}>🛑</Text>
            <Text style={styles.stopBtnText}>Stop Alarm</Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.hint}>🧠 Solve a math challenge to dismiss</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060606',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
    width: '100%',
    gap: 20,
  },
  badgeRow: {},
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ff24441a',
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ff244460',
  },
  bellIcon: { fontSize: 16 },
  badgeText: { color: '#ff4d4d', fontSize: 11, fontWeight: 'bold', letterSpacing: 3 },

  rippleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ripple: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#ff2244',
    backgroundColor: 'transparent',
  },
  clockCircle: {
    backgroundColor: '#120a0a',
    borderWidth: 2,
    borderColor: '#ff224444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff2244',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 20,
    gap: 4,
  },
  dateText: { color: '#ff4d4d88', fontSize: 13, fontWeight: '600', letterSpacing: 1 },
  timeText: {
    fontSize: 70,
    color: '#ffffff',
    fontWeight: 'bold',
    letterSpacing: -3,
    lineHeight: 76,
  },

  memeBox: {
    backgroundColor: '#ffffff08',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#ffffff10',
    width: '100%',
  },
  memeText: { color: '#ff7777', fontSize: 16, textAlign: 'center', lineHeight: 24, fontWeight: '600' },

  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ff2244',
    paddingVertical: 18,
    paddingHorizontal: 52,
    borderRadius: 20,
    shadowColor: '#ff2244',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 28,
    elevation: 16,
  },
  stopBtnIcon: { fontSize: 20 },
  stopBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 0.3 },

  hint: { color: '#3a3a3a', fontSize: 12, textAlign: 'center' },
});
