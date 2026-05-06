import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  ScrollView, TextInput, Alert, StatusBar, Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const CUP_SIZES = [
  { label: 'Small', amount: 150, icon: '🥤' },
  { label: 'Medium', amount: 250, icon: '💧' },
  { label: 'Large', amount: 350, icon: '🫙' },
  { label: 'Bottle', amount: 500, icon: '🍶' },
];

export default function App() {
  const [intake, setIntake] = useState(0);
  const [goal, setGoal] = useState(2000);
  const [weight, setWeight] = useState('');
  const [streak, setStreak] = useState(0);
  const [history, setHistory] = useState({});
  const [screen, setScreen] = useState('home');
  const [lastDate, setLastDate] = useState('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedIntake = await AsyncStorage.getItem('intake_' + today);
      const savedGoal = await AsyncStorage.getItem('goal');
      const savedStreak = await AsyncStorage.getItem('streak');
      const savedHistory = await AsyncStorage.getItem('history');
      const savedLastDate = await AsyncStorage.getItem('lastDate');
      const savedWeight = await AsyncStorage.getItem('weight');

      if (savedIntake) setIntake(parseInt(savedIntake));
      if (savedGoal) setGoal(parseInt(savedGoal));
      if (savedStreak) setStreak(parseInt(savedStreak));
      if (savedHistory) setHistory(JSON.parse(savedHistory));
      if (savedLastDate) setLastDate(savedLastDate);
      if (savedWeight) setWeight(savedWeight);

      // Streak check
      if (savedLastDate && savedLastDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().split('T')[0];
        if (savedLastDate !== yStr) {
          await AsyncStorage.setItem('streak', '0');
          setStreak(0);
        }
      }
    } catch (e) {}
  };

  const addWater = async (amount) => {
    const newIntake = intake + amount;
    setIntake(newIntake);
    await AsyncStorage.setItem('intake_' + today, String(newIntake));

    const newHistory = { ...history, [today]: newIntake };
    setHistory(newHistory);
    await AsyncStorage.setItem('history', JSON.stringify(newHistory));

    if (newIntake >= goal && intake < goal) {
      let newStreak = streak + 1;
      setStreak(newStreak);
      await AsyncStorage.setItem('streak', String(newStreak));
      await AsyncStorage.setItem('lastDate', today);
      Alert.alert('🎉 Goal Reached!', `Amazing! You hit your ${goal}ml goal! Streak: ${newStreak} days!`);
    }
  };

  const saveGoal = async () => {
    const w = parseFloat(weight);
    if (w > 0) {
      const newGoal = Math.round(w * 35);
      setGoal(newGoal);
      await AsyncStorage.setItem('goal', String(newGoal));
      await AsyncStorage.setItem('weight', weight);
      Alert.alert('✅ Goal Set!', `Daily goal: ${newGoal}ml based on ${w}kg`);
      setScreen('home');
    } else {
      Alert.alert('Error', 'Please enter a valid weight');
    }
  };

  const resetToday = async () => {
    setIntake(0);
    await AsyncStorage.setItem('intake_' + today, '0');
  };

  const percentage = Math.min((intake / goal) * 100, 100);
  const remaining = Math.max(goal - intake, 0);

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en', { weekday: 'short' });
      days.push({ key, label, amount: history[key] || 0 });
    }
    return days;
  };

  if (screen === 'settings') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0ea5e9" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setScreen('home')}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💪 Personalized Goal</Text>
            <Text style={styles.label}>Your weight (kg)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={weight}
              onChangeText={setWeight}
              placeholder="e.g. 70"
              placeholderTextColor="#94a3b8"
            />
            <Text style={styles.hint}>Recommended: 35ml × your weight</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={saveGoal}>
              <Text style={styles.primaryBtnText}>Calculate & Save Goal</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊 Current Goal</Text>
            <Text style={styles.bigNumber}>{goal} ml</Text>
            <Text style={styles.hint}>per day</Text>
          </View>

          <TouchableOpacity style={styles.dangerBtn} onPress={resetToday}>
            <Text style={styles.dangerBtnText}>Reset Today's Intake</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (screen === 'history') {
    const days = getLast7Days();
    const maxAmt = Math.max(...days.map(d => d.amount), goal);
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0ea5e9" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setScreen('home')}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>History</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📅 Last 7 Days</Text>
            <View style={styles.chartContainer}>
              {days.map((day) => {
                const h = maxAmt > 0 ? (day.amount / maxAmt) * 120 : 0;
                const hit = day.amount >= goal;
                return (
                  <View key={day.key} style={styles.barWrapper}>
                    <Text style={styles.barAmt}>{day.amount > 0 ? Math.round(day.amount/100)/10+'L' : ''}</Text>
                    <View style={styles.barBg}>
                      <View style={[styles.bar, { height: h, backgroundColor: hit ? '#22c55e' : '#0ea5e9' }]} />
                    </View>
                    <Text style={styles.barLabel}>{day.label}</Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.legend}>
              <View style={[styles.dot, { backgroundColor: '#22c55e' }]} />
              <Text style={styles.legendText}>Goal reached</Text>
              <View style={[styles.dot, { backgroundColor: '#0ea5e9', marginLeft: 12 }]} />
              <Text style={styles.legendText}>Below goal</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0ea5e9" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💧 HydroTrack</Text>
        <TouchableOpacity onPress={() => setScreen('settings')}>
          <Text style={styles.settingsBtn}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress Ring Area */}
        <View style={styles.progressCard}>
          <View style={styles.ringContainer}>
            <View style={styles.ringOuter}>
              <View style={[styles.ringFill, {
                borderColor: percentage >= 100 ? '#22c55e' : '#0ea5e9',
                opacity: 0.2 + (percentage / 100) * 0.8
              }]} />
              <View style={styles.ringInner}>
                <Text style={styles.intakeText}>{intake}</Text>
                <Text style={styles.intakeUnit}>ml</Text>
                <Text style={styles.percentText}>{Math.round(percentage)}%</Text>
              </View>
            </View>
          </View>
          <Text style={styles.remainingText}>
            {remaining > 0 ? `${remaining}ml remaining` : '🎉 Goal achieved!'}
          </Text>
          <Text style={styles.goalText}>Daily goal: {goal}ml</Text>
        </View>

        {/* Streak */}
        <View style={styles.streakCard}>
          <Text style={styles.streakIcon}>🔥</Text>
          <Text style={styles.streakCount}>{streak}</Text>
          <Text style={styles.streakLabel}>Day Streak</Text>
        </View>

        {/* Quick Add Buttons */}
        <Text style={styles.sectionTitle}>Quick Add</Text>
        <View style={styles.cupsGrid}>
          {CUP_SIZES.map((cup) => (
            <TouchableOpacity
              key={cup.label}
              style={styles.cupBtn}
              onPress={() => addWater(cup.amount)}
            >
              <Text style={styles.cupIcon}>{cup.icon}</Text>
              <Text style={styles.cupLabel}>{cup.label}</Text>
              <Text style={styles.cupAmount}>{cup.amount}ml</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Nav */}
        <TouchableOpacity style={styles.historyBtn} onPress={() => setScreen('history')}>
          <Text style={styles.historyBtnText}>📊 View History</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f9ff' },
  header: {
    backgroundColor: '#0ea5e9',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  settingsBtn: { fontSize: 24 },
  backBtn: { color: '#fff', fontSize: 16 },
  content: { flex: 1, padding: 16 },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#0ea5e9',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  ringContainer: { alignItems: 'center', marginBottom: 16 },
  ringOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 16,
    borderColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ringFill: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 16,
  },
  ringInner: { alignItems: 'center' },
  intakeText: { fontSize: 36, fontWeight: '800', color: '#0ea5e9' },
  intakeUnit: { fontSize: 14, color: '#94a3b8' },
  percentText: { fontSize: 18, fontWeight: '700', color: '#334155' },
  remainingText: { fontSize: 16, color: '#64748b', marginBottom: 4 },
  goalText: { fontSize: 14, color: '#94a3b8' },
  streakCard: {
    backgroundColor: '#fff7ed',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  streakIcon: { fontSize: 28, marginRight: 12 },
  streakCount: { fontSize: 32, fontWeight: '800', color: '#ea580c', marginRight: 8 },
  streakLabel: { fontSize: 16, color: '#9a3412' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  cupsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  cupBtn: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: (width - 56) / 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cupIcon: { fontSize: 32, marginBottom: 8 },
  cupLabel: { fontSize: 14, fontWeight: '600', color: '#334155' },
  cupAmount: { fontSize: 13, color: '#0ea5e9', fontWeight: '700' },
  historyBtn: {
    backgroundColor: '#0ea5e9',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  historyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b', marginBottom: 16 },
  label: { fontSize: 14, color: '#64748b', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 8,
  },
  hint: { fontSize: 13, color: '#94a3b8', marginBottom: 16 },
  primaryBtn: {
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  bigNumber: { fontSize: 40, fontWeight: '800', color: '#0ea5e9' },
  dangerBtn: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 32,
  },
  dangerBtnText: { color: '#dc2626', fontSize: 15, fontWeight: '600' },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 160,
    marginBottom: 12,
  },
  barWrapper: { alignItems: 'center', flex: 1 },
  barAmt: { fontSize: 10, color: '#64748b', marginBottom: 4 },
  barBg: {
    width: 28,
    height: 120,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: { width: '100%', borderRadius: 8 },
  barLabel: { fontSize: 11, color: '#64748b', marginTop: 4 },
  legend: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 4 },
  legendText: { fontSize: 12, color: '#64748b' },
});