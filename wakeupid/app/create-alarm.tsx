import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, Alert, ScrollView, StatusBar, Animated, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAlarmStore } from '../src/store/alarmStore';
import { MEME_CATEGORIES, MemeCategory } from '../src/utils/memeGenerator';
import {
  RINGTONE_LIST, RINGTONE_CATEGORIES,
  RingtoneKey, RingtoneCategory,
  previewRingtone, stopPreview,
} from '../src/utils/alarmSound';
import type { Difficulty } from '../src/utils/mathGenerator';

const { width: SW } = Dimensions.get('window');

// ─── Config data ──────────────────────────────────────────────────────────────
const DIFFICULTIES: { key: Difficulty; label: string; color: string; desc: string }[] = [
  { key: 'easy',   label: '⭐ Easy',    color: '#00cc88', desc: 'Simple addition'       },
  { key: 'medium', label: '⭐⭐ Medium', color: '#ffaa00', desc: 'Mixed operations'       },
  { key: 'hard',   label: '⭐⭐⭐ Hard', color: '#ff6644', desc: 'Multiply & divide'      },
  { key: 'insane', label: '💀 Insane',  color: '#ff2244', desc: 'Big multiply / squares' },
];
const QUICK = [
  { label: '5:30',    h: 5,  m: 30, p: 0 },
  { label: '6:00',    h: 6,  m: 0,  p: 0 },
  { label: '7:00 AM', h: 7,  m: 0,  p: 0 },
  { label: '7:30 AM', h: 7,  m: 30, p: 0 },
  { label: '8:00 AM', h: 8,  m: 0,  p: 0 },
  { label: '9:00 AM', h: 9,  m: 0,  p: 0 },
  { label: '12:00 PM',h: 12, m: 0,  p: 1 },
  { label: '6:00 PM', h: 6,  m: 0,  p: 1 },
];

function pad(n: number) { return String(n).padStart(2, '0'); }
function to24(h: number, p: number) {
  if (p === 0) return h === 12 ? 0  : h;
  else         return h === 12 ? 12 : h + 12;
}

// ─── Arrow column component ───────────────────────────────────────────────────
interface ColProps { value: string; onUp: () => void; onDown: () => void; accent?: string; }
function ArrowCol({ value, onUp, onDown, accent = '#00ffcc' }: ColProps) {
  const anim   = useRef(new Animated.Value(1)).current;
  const fastRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flash = () => Animated.sequence([
    Animated.timing(anim, { toValue: 0.88, duration: 55, useNativeDriver: true }),
    Animated.timing(anim, { toValue: 1,    duration: 70, useNativeDriver: true }),
  ]).start();
  const startFast = (fn: () => void) => { fn(); fastRef.current = setInterval(fn, 120); };
  const stopFast  = useCallback(() => {
    if (fastRef.current) { clearInterval(fastRef.current); fastRef.current = null; }
  }, []);
  return (
    <View style={col.wrap}>
      <TouchableOpacity style={col.btn} onPress={() => { flash(); onUp(); }}
        onLongPress={() => startFast(onUp)} onPressOut={stopFast} delayLongPress={360} activeOpacity={0.5}>
        <Text style={[col.arrow, { color: accent }]}>▲</Text>
      </TouchableOpacity>
      <Animated.View style={[col.box, { borderColor: accent + '44', shadowColor: accent, transform: [{ scale: anim }] }]}>
        <Text style={col.val}>{value}</Text>
      </Animated.View>
      <TouchableOpacity style={col.btn} onPress={() => { flash(); onDown(); }}
        onLongPress={() => startFast(onDown)} onPressOut={stopFast} delayLongPress={360} activeOpacity={0.5}>
        <Text style={[col.arrow, { color: accent }]}>▼</Text>
      </TouchableOpacity>
    </View>
  );
}
const col = StyleSheet.create({
  wrap:  { alignItems: 'center', gap: 6 },
  btn:   { padding: 12, borderRadius: 12 },
  arrow: { fontSize: 22, fontWeight: 'bold', lineHeight: 26 },
  box: {
    width: 90, height: 90, borderRadius: 20, backgroundColor: '#101010',
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.45, shadowRadius: 14, elevation: 8,
  },
  val: { color: '#fff', fontSize: 42, fontWeight: 'bold', letterSpacing: -2 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function CreateAlarmScreen() {
  const router    = useRouter();
  const { addAlarm } = useAlarmStore();

  const [hour,   setHour]   = useState(7);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState(0);   // 0=AM 1=PM

  const [label,         setLabel]         = useState('');
  const [difficulty,    setDifficulty]    = useState<Difficulty>('medium');
  const [ringtone,      setRingtone]      = useState<RingtoneKey>('alarm_classic');
  const [ringCat,       setRingCat]       = useState<RingtoneCategory>('loud');
  const [memeCategory,  setMemeCategory]  = useState<MemeCategory>('mixed');
  const [questionCount, setQuestionCount] = useState(3);
  const [saving,        setSaving]        = useState(false);
  const [previewing,    setPreviewing]    = useState<RingtoneKey | null>(null);

  const saveScale = useRef(new Animated.Value(1)).current;

  const incH = () => setHour(h => h === 12 ? 1 : h + 1);
  const decH = () => setHour(h => h === 1  ? 12 : h - 1);
  const incM = () => setMinute(m => m === 59 ? 0 : m + 1);
  const decM = () => setMinute(m => m === 0  ? 59 : m - 1);

  const handlePreview = async (key: RingtoneKey) => {
    if (previewing === key) { await stopPreview(); setPreviewing(null); return; }
    setPreviewing(key);
    try {
      await previewRingtone(key);
      setTimeout(() => setPreviewing(null), 4500);
    } catch {
      Alert.alert('🔇 Error', 'Could not play sound. Restart the app and try again.');
      setPreviewing(null);
    }
  };

  const handleSave = async () => {
    Animated.sequence([
      Animated.timing(saveScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(saveScale, { toValue: 1,    duration: 100, useNativeDriver: true }),
    ]).start();
    setSaving(true);
    try {
      await addAlarm({
        hour: to24(hour, period), minute, label,
        difficulty, ringtone, memeCategory, questionCount,
      });
      Alert.alert('✅ Alarm Set!', `${pad(hour)}:${pad(minute)} ${period === 0 ? 'AM' : 'PM'}`,
        [{ text: "Let's Go! 🔥", onPress: () => router.back() }]
      );
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not save alarm.');
    } finally { setSaving(false); }
  };

  const periodStr = period === 0 ? 'AM' : 'PM';
  const filteredTones = RINGTONE_LIST.filter(r => r.category === ringCat);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#060606" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>New Alarm</Text>
        <View style={{ width: 56 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={s.scroll}>

        {/* ── Time Picker ────────────────────────────────── */}
        <View style={s.timeCard}>
          <Text style={s.timeCardLbl}>SET TIME</Text>
          <View style={s.pickerRow}>
            <ArrowCol value={pad(hour)}   onUp={incH} onDown={decH} />
            <Text style={s.colon}>:</Text>
            <ArrowCol value={pad(minute)} onUp={incM} onDown={decM} />
            <View style={s.periodCol}>
              {['AM','PM'].map((p,i) => (
                <TouchableOpacity key={p} style={[s.periodBtn, period===i && s.periodBtnOn]} onPress={() => setPeriod(i)}>
                  <Text style={[s.periodTxt, period===i && s.periodTxtOn]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={s.badge}>
            <Text style={s.badgeTxt}>{pad(hour)} : {pad(minute)}  {periodStr}</Text>
          </View>
          <Text style={s.holdHint}>Hold ▲/▼ to change fast</Text>
        </View>

        {/* ── Quick presets ──────────────────────────────── */}
        <View style={s.sec}>
          <Text style={s.secLbl}>QUICK SET</Text>
          <View style={s.quickRow}>
            {QUICK.map(qt => {
              const on = hour===qt.h && minute===qt.m && period===qt.p;
              return (
                <TouchableOpacity key={qt.label} style={[s.quickBtn, on && s.quickBtnOn]}
                  onPress={() => { setHour(qt.h); setMinute(qt.m); setPeriod(qt.p); }}>
                  <Text style={[s.quickTxt, on && s.quickTxtOn]}>{qt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Label ─────────────────────────────────────── */}
        <View style={s.sec}>
          <Text style={s.secLbl}>LABEL  (OPTIONAL)</Text>
          <TextInput style={s.input} value={label} onChangeText={setLabel}
            placeholder="e.g. Gym, School, Meeting…" placeholderTextColor="#333"
            maxLength={40} returnKeyType="done" />
        </View>

        {/* ── Difficulty ────────────────────────────────── */}
        <View style={s.sec}>
          <Text style={s.secLbl}>MATH DIFFICULTY</Text>
          <View style={s.grid2}>
            {DIFFICULTIES.map(d => (
              <TouchableOpacity key={d.key} style={[s.card2, difficulty===d.key && { borderColor: d.color, backgroundColor: d.color+'18' }]}
                onPress={() => setDifficulty(d.key)}>
                <Text style={[s.card2Title, difficulty===d.key && { color: d.color }]}>{d.label}</Text>
                <Text style={s.card2Desc}>{d.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Questions ─────────────────────────────────── */}
        <View style={s.sec}>
          <Text style={s.secLbl}>QUESTIONS TO SOLVE ({questionCount})</Text>
          <Text style={s.hint}>Min 3 · Max 10 — all must be solved to stop alarm</Text>
          <View style={s.stepRow}>
            <TouchableOpacity style={[s.stepBtn, questionCount<=3 && s.stepBtnOff]}
              onPress={() => setQuestionCount(q => Math.max(3,q-1))} disabled={questionCount<=3}>
              <Text style={s.stepBtnTxt}>−</Text>
            </TouchableOpacity>
            <View style={s.stepDisplay}>
              <Text style={s.stepNum}>{questionCount}</Text>
              <Text style={s.stepLbl}>questions</Text>
            </View>
            <TouchableOpacity style={[s.stepBtn, questionCount>=10 && s.stepBtnOff]}
              onPress={() => setQuestionCount(q => Math.min(10,q+1))} disabled={questionCount>=10}>
              <Text style={s.stepBtnTxt}>+</Text>
            </TouchableOpacity>
          </View>
          <View style={s.dotRow}>
            {Array.from({length:10}).map((_,i) => (
              <View key={i} style={[s.dot, i<questionCount && s.dotOn]} />
            ))}
          </View>
        </View>

        {/* ── Ringtone ──────────────────────────────────── */}
        <View style={s.sec}>
          <Text style={s.secLbl}>RINGTONE</Text>

          {/* Category tabs */}
          <View style={s.catRow}>
            {RINGTONE_CATEGORIES.map(cat => (
              <TouchableOpacity key={cat.key} style={[s.catTab, ringCat===cat.key && s.catTabOn]}
                onPress={() => setRingCat(cat.key)}>
                <Text style={s.catEmoji}>{cat.emoji}</Text>
                <Text style={[s.catTxt, ringCat===cat.key && s.catTxtOn]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sound list */}
          <View style={s.toneList}>
            {filteredTones.map(r => {
              const isOn  = ringtone === r.key;
              const isPre = previewing === r.key;
              return (
                <View key={r.key} style={[s.toneRow, isOn && s.toneRowOn]}>
                  <TouchableOpacity style={s.toneLeft} onPress={() => setRingtone(r.key as RingtoneKey)}>
                    <View style={[s.radio, isOn && s.radioOn]}>
                      {isOn && <View style={s.radioDot} />}
                    </View>
                    <Text style={s.toneEmoji}>{r.emoji}</Text>
                    <Text style={[s.toneName, isOn && { color: '#fff' }]}>{r.name}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.playBtn, isPre && s.playBtnOn]}
                    onPress={() => handlePreview(r.key as RingtoneKey)}>
                    <Text style={s.playBtnTxt}>{isPre ? '⏹' : '▶'}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Meme Type ─────────────────────────────────── */}
        <View style={s.sec}>
          <Text style={s.secLbl}>MEME STYLE</Text>
          <View style={s.grid2}>
            {MEME_CATEGORIES.map(cat => (
              <TouchableOpacity key={cat.key} style={[s.card2, memeCategory===cat.key && s.card2On]}
                onPress={() => setMemeCategory(cat.key)}>
                <Text style={[s.card2Title, memeCategory===cat.key && { color: '#00ffcc' }]}>{cat.label}</Text>
                <Text style={s.card2Desc}>{cat.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Summary ───────────────────────────────────── */}
        <View style={s.summary}>
          <Text style={s.sumHead}>✦ ALARM SUMMARY</Text>
          {([
            ['⏰ Time',       `${pad(hour)}:${pad(minute)} ${periodStr}`],
            label.trim() ? ['🏷 Label', label] : null,
            ['🧠 Difficulty', DIFFICULTIES.find(d=>d.key===difficulty)?.label ?? ''],
            ['🔢 Questions',  `${questionCount} to solve`],
            ['🔔 Ringtone',   RINGTONE_LIST.find(r=>r.key===ringtone)?.name ?? ''],
            ['🎭 Meme',       MEME_CATEGORIES.find(c=>c.key===memeCategory)?.label ?? ''],
          ] as (string[]|null)[]).filter((x): x is string[] => x!==null).map(([k,v]) => (
            <View key={k} style={s.sumRow}>
              <Text style={s.sumKey}>{k}</Text>
              <Text style={[s.sumVal, k==='🧠 Difficulty' && { color: DIFFICULTIES.find(d=>d.key===difficulty)?.color }]}>
                {v}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Save ──────────────────────────────────────── */}
        <Animated.View style={{ transform: [{ scale: saveScale }] }}>
          <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave} disabled={saving} activeOpacity={0.85}>
            <Text style={s.saveTxt}>{saving ? 'Setting…' : '✅  Set Alarm'}</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#060606', paddingTop: 52 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 4 },
  back:   { color: '#00ffcc', fontSize: 20, fontWeight: '600' },
  title:  { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  scroll: { paddingHorizontal: 16, paddingTop: 12 },

  // Time card
  timeCard:     { backgroundColor: '#0b0b0b', borderRadius: 28, paddingVertical: 20, paddingHorizontal: 16, marginBottom: 20, borderWidth: 1, borderColor: '#00ffcc22', alignItems: 'center', gap: 14, shadowColor: '#00ffcc', shadowOffset: {width:0,height:0}, shadowOpacity: 0.07, shadowRadius: 20, elevation: 5 },
  timeCardLbl:  { color: '#00ffcc55', fontSize: 10, fontWeight: '700', letterSpacing: 3 },
  pickerRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  colon:        { color: '#00ffcc', fontSize: 46, fontWeight: 'bold', marginBottom: 8, width: 20, textAlign: 'center', lineHeight: 54 },
  periodCol:    { gap: 10, marginLeft: 12 },
  periodBtn:    { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, backgroundColor: '#181818', borderWidth: 1, borderColor: '#2a2a2a', minWidth: 56, alignItems: 'center' },
  periodBtnOn:  { backgroundColor: '#00ffcc18', borderColor: '#00ffcc77' },
  periodTxt:    { color: '#3a3a3a', fontSize: 16, fontWeight: 'bold' },
  periodTxtOn:  { color: '#00ffcc' },
  badge:        { backgroundColor: '#00ffcc0d', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 8, borderWidth: 1, borderColor: '#00ffcc2a' },
  badgeTxt:     { color: '#00ffcc', fontSize: 22, fontWeight: 'bold', letterSpacing: 2 },
  holdHint:     { color: '#282828', fontSize: 11 },

  // Section
  sec:    { marginBottom: 22, gap: 10 },
  secLbl: { color: '#444', fontSize: 10, letterSpacing: 2.5, fontWeight: '700' },
  hint:   { color: '#2c2c2c', fontSize: 12, marginTop: -4 },
  input:  { backgroundColor: '#111', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 15, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#222' },

  // Quick
  quickRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickBtn:   { backgroundColor: '#111', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: '#1e1e1e' },
  quickBtnOn: { backgroundColor: '#00ffcc18', borderColor: '#00ffcc55' },
  quickTxt:   { color: '#444', fontSize: 12, fontWeight: '600' },
  quickTxtOn: { color: '#00ffcc' },

  // Stepper
  stepRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 },
  stepBtn:     { width: 54, height: 54, borderRadius: 18, backgroundColor: '#111', borderWidth: 1.5, borderColor: '#00ffcc55', alignItems: 'center', justifyContent: 'center' },
  stepBtnOff:  { borderColor: '#1e1e1e', opacity: 0.35 },
  stepBtnTxt:  { color: '#00ffcc', fontSize: 28, fontWeight: 'bold', lineHeight: 32 },
  stepDisplay: { alignItems: 'center', minWidth: 80 },
  stepNum:     { color: '#fff', fontSize: 56, fontWeight: 'bold', letterSpacing: -2, lineHeight: 62 },
  stepLbl:     { color: '#555', fontSize: 11 },
  dotRow:      { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  dot:         { width: 14, height: 14, borderRadius: 7, backgroundColor: '#1e1e1e' },
  dotOn:       { backgroundColor: '#00ffcc', shadowColor: '#00ffcc', shadowRadius: 4, shadowOpacity: 0.6 },

  // Category tabs
  catRow:    { flexDirection: 'row', gap: 8 },
  catTab:    { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14, backgroundColor: '#111', borderWidth: 1, borderColor: '#222', gap: 2 },
  catTabOn:  { backgroundColor: '#00ffcc18', borderColor: '#00ffcc55' },
  catEmoji:  { fontSize: 18 },
  catTxt:    { color: '#444', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  catTxtOn:  { color: '#00ffcc' },

  // Ringtone list
  toneList: { gap: 8 },
  toneRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0e0e0e', borderRadius: 16, paddingVertical: 13, paddingHorizontal: 14, borderWidth: 1, borderColor: '#1e1e1e' },
  toneRowOn:{ borderColor: '#00ffcc44', backgroundColor: '#00ffcc0a' },
  toneLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  toneEmoji:{ fontSize: 18, width: 26, textAlign: 'center' },
  toneName: { color: '#555', fontSize: 13, fontWeight: '600', flex: 1 },
  radio:    { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#333', alignItems: 'center', justifyContent: 'center' },
  radioOn:  { borderColor: '#00ffcc' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#00ffcc' },
  playBtn:  { backgroundColor: '#181818', borderRadius: 10, width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2a2a2a' },
  playBtnOn:{ backgroundColor: '#00ffcc18', borderColor: '#00ffcc66' },
  playBtnTxt:{ color: '#00ffcc', fontSize: 14, fontWeight: 'bold' },

  // 2-col grid
  grid2:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card2:      { width: (SW-42)/2, backgroundColor: '#0f0f0f', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 14, borderWidth: 1.5, borderColor: '#1e1e1e', gap: 4 },
  card2On:    { borderColor: '#00ffcc55', backgroundColor: '#00ffcc0e' },
  card2Title: { color: '#666', fontSize: 13, fontWeight: 'bold' },
  card2Desc:  { color: '#2e2e2e', fontSize: 11 },

  // Summary
  summary: { backgroundColor: '#080e0b', borderRadius: 22, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#00ffcc1a', gap: 12 },
  sumHead: { color: '#00ffcc55', fontSize: 10, fontWeight: '700', letterSpacing: 2.5 },
  sumRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sumKey:  { color: '#484848', fontSize: 13 },
  sumVal:  { color: '#ccc', fontSize: 13, fontWeight: '600' },

  // Save
  saveBtn: { backgroundColor: '#00ffcc', paddingVertical: 18, borderRadius: 20, alignItems: 'center', shadowColor: '#00ffcc', shadowOffset: {width:0,height:0}, shadowOpacity: 0.55, shadowRadius: 24, elevation: 12 },
  saveTxt: { color: '#000', fontWeight: 'bold', fontSize: 18 },
});
