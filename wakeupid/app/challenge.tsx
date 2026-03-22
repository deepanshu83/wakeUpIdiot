import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  StatusBar,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { generateQuestion, MathQuestion, Difficulty } from '../src/utils/mathGenerator';
import { startAlarmSound, stopAlarmSound } from '../src/utils/alarmSound';
import { useAlarmStore } from '../src/store/alarmStore';
import type { RingtoneKey } from '../src/utils/alarmSound';

// ─── Constants ────────────────────────────────────────────────────────────────
const INACTIVITY_SEC = 30;
const LEVELS: Difficulty[] = ['easy', 'medium', 'hard', 'insane'];

const DIFF_META: Record<Difficulty, { label: string; emoji: string; color: string }> = {
  easy:   { label: 'Easy',   emoji: '⭐',     color: '#00cc88' },
  medium: { label: 'Medium', emoji: '⭐⭐',   color: '#ffaa00' },
  hard:   { label: 'Hard',   emoji: '⭐⭐⭐', color: '#ff6644' },
  insane: { label: 'Insane', emoji: '💀',     color: '#ff2244' },
};

const ROASTS = [
  'Try again, genius 💀',
  'Wrong! Were you even awake? 😭',
  'Soch ke karo bhai…',
  'Brain still sleeping 🧠💤',
  'REALLY?? 😤',
];

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ChallengeScreen() {
  const router = useRouter();
  const { alarms, activeAlarmId } = useAlarmStore();

  const activeAlarm   = alarms.find((a) => a.id === activeAlarmId);
  const baseDiff      = (activeAlarm?.difficulty    ?? 'medium')  as Difficulty;
  const ringtone      = (activeAlarm?.ringtone      ?? 'classic') as RingtoneKey;
  const totalNeeded   =  activeAlarm?.questionCount ?? 3;

  // ── Question ─────────────────────────────────────────────────────────────
  const [question,    setQuestion]    = useState<MathQuestion | null>(null);
  const [input,       setInput]       = useState('');
  const [qAttempts,   setQAttempts]   = useState(0);   // wrong on CURRENT question
  const [totalWrong,  setTotalWrong]  = useState(0);   // wrong across ALL questions
  const [solvedCount, setSolvedCount] = useState(0);   // correct answers
  const [currentDiff, setCurrentDiff] = useState<Difficulty>(baseDiff);
  const [allSolved,   setAllSolved]   = useState(false);

  // ── Inactivity ───────────────────────────────────────────────────────────
  const [countdown,       setCountdown]       = useState(INACTIVITY_SEC);
  const [inactiveWarning, setInactiveWarning] = useState(false);
  const inactivityRef  = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const countdownRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRingingRef   = useRef(false); // alarm ringing due to inactivity?

  // ── Animations ───────────────────────────────────────────────────────────
  const slideAnim    = useRef(new Animated.Value(50)).current;
  const fadeAnim     = useRef(new Animated.Value(0)).current;
  const shakeAnim    = useRef(new Animated.Value(0)).current;
  const qScaleAnim   = useRef(new Animated.Value(0.85)).current;
  const successAnim  = useRef(new Animated.Value(0)).current;
  const warnPulse    = useRef(new Animated.Value(0)).current;
  const warnPulseRef = useRef<Animated.CompositeAnimation | null>(null);

  // ── Mount ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadQuestion(baseDiff);
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 450, useNativeDriver: true }),
    ]).start();
    startCountdown();

    return () => {
      clearCountdown();
      if (isRingingRef.current) stopAlarmSound();
    };
  }, []);

  // ── Countdown helpers ────────────────────────────────────────────────────
  const clearCountdown = () => {
    if (inactivityRef.current)  { clearTimeout(inactivityRef.current);  inactivityRef.current = null; }
    if (countdownRef.current)   { clearInterval(countdownRef.current);   countdownRef.current = null;  }
  };

  const startCountdown = useCallback(() => {
    clearCountdown();
    let secs = INACTIVITY_SEC;
    setCountdown(secs);

    countdownRef.current = setInterval(() => {
      secs -= 1;
      setCountdown(secs);
    }, 1000);

    inactivityRef.current = setTimeout(() => {
      clearInterval(countdownRef.current!);
      countdownRef.current = null;
      // Ring bell!
      isRingingRef.current = true;
      setInactiveWarning(true);
      startAlarmSound(ringtone).catch(() => {});
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      // Pulse the warning banner
      warnPulseRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(warnPulse, { toValue: 1,   duration: 450, useNativeDriver: true }),
          Animated.timing(warnPulse, { toValue: 0.3, duration: 450, useNativeDriver: true }),
        ])
      );
      warnPulseRef.current.start();
    }, INACTIVITY_SEC * 1000);
  }, [ringtone]);

  const dismissBell = useCallback(() => {
    if (isRingingRef.current) {
      stopAlarmSound();
      isRingingRef.current = false;
      warnPulseRef.current?.stop();
      warnPulse.setValue(0);
    }
    setInactiveWarning(false);
    startCountdown();
  }, [startCountdown]);

  // ── Question helpers ─────────────────────────────────────────────────────
  const getEscalatedDiff = (wrong: number): Difficulty => {
    const baseIdx = LEVELS.indexOf(baseDiff);
    const bump    = Math.floor(wrong / 3);
    return LEVELS[Math.min(baseIdx + bump, LEVELS.length - 1)];
  };

  const loadQuestion = (diff: Difficulty) => {
    setCurrentDiff(diff);
    setQuestion(generateQuestion(diff));
    setInput('');
    setQAttempts(0);
    Animated.sequence([
      Animated.timing(qScaleAnim, { toValue: 0.82, duration: 0, useNativeDriver: true }),
      Animated.spring(qScaleAnim, { toValue: 1, speed: 14, bounciness: 10, useNativeDriver: true }),
    ]).start();
  };

  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 9,   duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -9,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 55, useNativeDriver: true }),
    ]).start();
  };

  // ── Answer check ─────────────────────────────────────────────────────────
  const checkAnswer = () => {
    Keyboard.dismiss();
    if (!question || allSolved) return;

    dismissBell();   // user is active — stop inactivity sound if playing

    const ans = parseInt(input.trim(), 10);
    if (isNaN(ans)) { Alert.alert('Enter a number 😒'); return; }

    if (ans === question.answer) {
      // ✅ CORRECT
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const newSolved = solvedCount + 1;
      setSolvedCount(newSolved);

      if (newSolved >= totalNeeded) {
        // 🎉 ALL DONE
        setAllSolved(true);
        stopAlarmSound();
        clearCountdown();
        Animated.spring(successAnim, {
          toValue: 1, speed: 6, bounciness: 14, useNativeDriver: true,
        }).start();
        setTimeout(() => {
          Alert.alert(
            '🎉 Alarm OFF!',
            `You crushed ${totalNeeded} question${totalNeeded > 1 ? 's' : ''}!\nNow go be productive 🚀`,
            [{ text: "Let's Go! 🔥", onPress: () => router.replace('/') }]
          );
        }, 600);
      } else {
        // ➡️ Next question
        setTimeout(() => {
          loadQuestion(getEscalatedDiff(totalWrong));
          startCountdown();
        }, 300);
      }
    } else {
      // ❌ WRONG
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      triggerShake();
      const newQAttempts = qAttempts + 1;
      const newTotalWrong = totalWrong + 1;
      setQAttempts(newQAttempts);
      setTotalWrong(newTotalWrong);

      const roast = ROASTS[Math.min(newQAttempts - 1, ROASTS.length - 1)];
      Alert.alert(`❌ ${roast}`, `Wrong on this question: ${newQAttempts}×`, [
        {
          text: newQAttempts >= 3 ? 'New Question 🔄' : 'Try Again',
          onPress: () => {
            if (newQAttempts >= 3) {
              loadQuestion(getEscalatedDiff(newTotalWrong));
            } else {
              setInput('');
            }
            startCountdown();
          },
        },
      ]);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const meta = DIFF_META[currentDiff];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#060606" />

      {/* ── Inactivity Warning Banner ───────────────────────── */}
      {inactiveWarning && (
        <Animated.View
          style={[
            styles.warnBanner,
            { opacity: warnPulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) },
          ]}
        >
          <TouchableOpacity style={styles.warnInner} onPress={dismissBell} activeOpacity={0.8}>
            <Text style={styles.warnBell}>🔔</Text>
            <View>
              <Text style={styles.warnTitle}>Still sleeping?!</Text>
              <Text style={styles.warnSub}>Tap here to stop the bell</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── Main content ────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { translateX: shakeAnim },
            ],
          },
        ]}
      >
        {/* Title */}
        <Text style={styles.title}>🧠 Math Challenge</Text>

        {/* Progress bar */}
        <View style={styles.progressWrap}>
          <View style={styles.progressRow}>
            {Array.from({ length: totalNeeded }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i < solvedCount                && styles.dotSolved,
                  i === solvedCount && !allSolved && styles.dotCurrent,
                ]}
              />
            ))}
          </View>
          <Text style={styles.progressLabel}>
            {solvedCount}/{totalNeeded} solved
          </Text>
        </View>

        {/* Difficulty badge */}
        <View style={[styles.diffBadge, { borderColor: meta.color + '66', backgroundColor: meta.color + '1a' }]}>
          <Text style={styles.diffEmoji}>{meta.emoji}</Text>
          <Text style={[styles.diffLabel, { color: meta.color }]}>{meta.label}</Text>
          {currentDiff !== baseDiff && (
            <Text style={[styles.escalated, { color: meta.color }]}>↑ Escalated</Text>
          )}
        </View>

        {/* Question card */}
        {question && (
          <Animated.View style={[styles.qCard, { transform: [{ scale: qScaleAnim }] }]}>
            <Text style={styles.qHint}>QUESTION {solvedCount + 1} OF {totalNeeded}</Text>
            <Text style={[styles.qText, { color: meta.color }]}>
              {question.question} = ?
            </Text>
          </Animated.View>
        )}

        {/* Wrong attempt dots */}
        {qAttempts > 0 && (
          <View style={styles.attRow}>
            {Array.from({ length: Math.min(qAttempts, 3) }).map((_, i) => (
              <View key={i} style={[styles.attDot, { backgroundColor: meta.color }]} />
            ))}
            <Text style={[styles.attText, { color: meta.color }]}>{qAttempts} ❌</Text>
          </View>
        )}

        {/* Countdown warning (last 10 seconds) */}
        {!inactiveWarning && !allSolved && countdown <= 10 && countdown > 0 && (
          <View style={[styles.countdownRow, countdown <= 5 && styles.countdownUrgent]}>
            <Text style={[styles.countdownTxt, countdown <= 5 && { color: '#ff4444' }]}>
              ⏱ Bell rings in {countdown}s…
            </Text>
          </View>
        )}

        {/* Input */}
        <TextInput
          style={[
            styles.input,
            allSolved       && { borderColor: '#00cc88', color: '#00cc88' },
            inactiveWarning && { borderColor: '#ff2244' },
          ]}
          value={input}
          onChangeText={(t) => {
            setInput(t);
            if (!allSolved) dismissBell();
          }}
          onFocus={() => { if (!allSolved) dismissBell(); }}
          keyboardType="numeric"
          placeholder={inactiveWarning ? '⏰ Wake up! Type here…' : 'Your answer…'}
          placeholderTextColor={inactiveWarning ? '#ff4444' : '#2a2a2a'}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={checkAnswer}
          maxLength={7}
          editable={!allSolved}
          selectionColor="#00ffcc"
        />

        {/* Submit button */}
        <Animated.View style={allSolved ? { transform: [{ scale: successAnim }] } : {}}>
          <TouchableOpacity
            style={[
              styles.submitBtn,
              allSolved && { backgroundColor: '#00cc88', shadowColor: '#00cc88' },
            ]}
            onPress={checkAnswer}
            activeOpacity={0.85}
            disabled={allSolved}
          >
            <Text style={styles.submitTxt}>
              {allSolved
                ? '🎉 All Solved!'
                : `Submit  (${solvedCount + 1}/${totalNeeded})`}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.hint}>You can't go back 😈</Text>
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060606',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  // Inactivity banner
  warnBanner: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    backgroundColor: '#ff2244',
    zIndex: 100,
    paddingTop: 52,
    paddingBottom: 18,
    paddingHorizontal: 24,
  },
  warnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  warnBell:  { fontSize: 32 },
  warnTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  warnSub:   { color: '#ffffff99', fontSize: 13, marginTop: 2 },

  // Content
  content: { width: '100%', alignItems: 'center', gap: 16 },
  title:   { fontSize: 28, color: '#fff', fontWeight: 'bold', letterSpacing: -0.5 },

  // Progress
  progressWrap: { alignItems: 'center', gap: 8 },
  progressRow:  { flexDirection: 'row', gap: 8 },
  dot: {
    width: 26, height: 10, borderRadius: 5,
    backgroundColor: '#252525',
    borderWidth: 1, borderColor: '#333',
  },
  dotSolved:  { backgroundColor: '#00cc88', borderColor: '#00cc88' },
  dotCurrent: { backgroundColor: '#00ffcc55', borderColor: '#00ffcc', width: 32 },
  progressLabel: { color: '#555', fontSize: 12, fontWeight: '600' },

  // Difficulty
  diffBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7, borderWidth: 1,
  },
  diffEmoji:  { fontSize: 14 },
  diffLabel:  { fontSize: 13, fontWeight: 'bold', letterSpacing: 0.5 },
  escalated:  { fontSize: 11, fontWeight: '600', opacity: 0.8 },

  // Question card
  qCard: {
    backgroundColor: '#0e0e0e',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 28,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#1e1e1e',
    gap: 8,
    shadowColor: '#00ffcc',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  qHint: { color: '#333', fontSize: 10, letterSpacing: 2, fontWeight: '600' },
  qText: { fontSize: 50, fontWeight: 'bold', letterSpacing: -1, textAlign: 'center' },

  // Wrong attempt dots
  attRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  attDot: { width: 8, height: 8, borderRadius: 4 },
  attText: { fontSize: 13, fontWeight: '700', marginLeft: 4 },

  // Countdown
  countdownRow: {
    backgroundColor: '#1a1200',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#ffaa0033',
  },
  countdownUrgent: {
    backgroundColor: '#1a0000',
    borderColor: '#ff444433',
  },
  countdownTxt: { color: '#ffaa00', fontSize: 13, fontWeight: '700' },

  // Input
  input: {
    backgroundColor: '#0f0f0f',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 28,
    color: '#fff',
    fontSize: 34,
    fontWeight: 'bold',
    textAlign: 'center',
    width: '65%',
    borderWidth: 1.5,
    borderColor: '#00ffcc33',
    letterSpacing: 2,
  },

  // Submit
  submitBtn: {
    backgroundColor: '#00ffcc',
    paddingVertical: 17,
    paddingHorizontal: 48,
    borderRadius: 18,
    shadowColor: '#00ffcc',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 10,
  },
  submitTxt: { color: '#000', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.3 },

  hint: { color: '#2a2a2a', fontSize: 12 },
});
