import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAlarmStore } from '../src/store/alarmStore';
import AlarmCard from '../src/components/AlarmCard';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { alarms, loaded } = useAlarmStore();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const btnGlow = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(btnGlow, { toValue: 1, duration: 1200, useNativeDriver: false }),
        Animated.timing(btnGlow, { toValue: 0.5, duration: 1200, useNativeDriver: false }),
      ])
    );
    glow.start();
    return () => glow.stop();
  }, []);

  const enabledCount = alarms.filter((a) => a.enabled).length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#080808" />

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.titleRow}>
          <Image
            source={require('../assets/images/adaptive-icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.appTitle}>WakeUpIdiot</Text>
            <Text style={styles.subtitle}>
              {alarms.length === 0
                ? 'No alarms. Still sleeping on your dreams?'
                : `${enabledCount} alarm${enabledCount !== 1 ? 's' : ''} active`}
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        {alarms.length > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statBadge}>
              <Text style={styles.statNum}>{alarms.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={[styles.statBadge, styles.activeStatBadge]}>
              <Text style={[styles.statNum, styles.activeStatNum]}>{enabledCount}</Text>
              <Text style={[styles.statLabel, styles.activeStatLabel]}>Active</Text>
            </View>
            <View style={styles.statBadge}>
              <Text style={styles.statNum}>{alarms.length - enabledCount}</Text>
              <Text style={styles.statLabel}>Off</Text>
            </View>
          </View>
        )}
      </Animated.View>

      {/* Content */}
      {!loaded ? (
        <View style={styles.center}>
          <ActivityIndicator color="#00ffcc" size="large" />
          <Text style={styles.loadingText}>Loading alarms...</Text>
        </View>
      ) : alarms.length === 0 ? (
        <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
          <Text style={styles.emptyEmoji}>😴</Text>
          <Text style={styles.emptyTitle}>No Alarms Set</Text>
          <Text style={styles.emptyBody}>
            Add one below.{'\n'}No snooze allowed 😤
          </Text>
        </Animated.View>
      ) : (
        <FlatList
          data={alarms}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <AlarmCard alarm={item} />}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/create-alarm')}
          activeOpacity={0.85}
        >
          <Text style={styles.addButtonIcon}>+</Text>
          <Text style={styles.addButtonText}>Add Alarm</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.testButton}
          onPress={() => router.push('/alarm')}
          activeOpacity={0.7}
        >
          <Text style={styles.testButtonText}>🔔  Test Alarm Screen</Text>
        </TouchableOpacity>

        {/* Made by */}
        <View style={styles.madeByRow}>
          <Text style={styles.madeByTxt}>Made with 💀 by </Text>
          <Text style={styles.madeByName}>Deepanshu</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
    paddingTop: 56,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  appEmoji: {
    fontSize: 36,
  },
  appTitle: {
    fontSize: 28,
    color: '#00ffcc',
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#555',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBadge: {
    flex: 1,
    backgroundColor: '#141414',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  activeStatBadge: {
    backgroundColor: '#00ffcc12',
    borderColor: '#00ffcc33',
  },
  statNum: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  activeStatNum: {
    color: '#00ffcc',
  },
  statLabel: {
    color: '#555',
    fontSize: 10,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  activeStatLabel: {
    color: '#00ffcc88',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#555',
    fontSize: 13,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 12,
    gap: 10,
  },
  addButton: {
    backgroundColor: '#00ffcc',
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#00ffcc',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 10,
  },
  addButtonIcon: {
    color: '#000',
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  addButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  testButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e1e1e',
    backgroundColor: '#0f0f0f',
  },
  testButtonText: {
    color: '#444',
    fontSize: 14,
  },

  // Logo
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },

  // Made by Deepanshu
  madeByRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 4,
  },
  madeByTxt:  { color: '#2a2a2a', fontSize: 11 },
  madeByName: { color: '#00ffcc44', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
});
