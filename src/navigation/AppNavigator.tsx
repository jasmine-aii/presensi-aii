import React, { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color } from '../theme';
import { TabBar, type EmployeeNav } from '../components';
import { useLang } from '../i18n/LangContext';
import { HomeScreen, ClockInScreen, ClockOutScreen, HistoryScreen, LeaveScreen, ProfileScreen } from '../screens';

type Tab = 'home' | 'history' | 'leave' | 'profile';
type Pushed = 'clockin' | 'clockout' | null;

/**
 * Lightweight state-based navigator: four bottom tabs, a raised "Absen" FAB that
 * adapts to Clock In / Clock Out based on today's status, and pushed views for
 * the clock flows. Keeps the design's exact tab bar (no stock navigator can do
 * the raised FAB cleanly) with zero extra navigation dependencies.
 */
export function AppNavigator() {
  const { s } = useLang();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('home');
  const [pushed, setPushed] = useState<Pushed>(null);
  const [clockedIn, setClockedIn] = useState(false);

  const onNavigate = (key: EmployeeNav) => {
    if (key === 'clock') {
      setPushed(clockedIn ? 'clockout' : 'clockin');
    } else {
      setTab(key);
      setPushed(null);
    }
  };

  // Pushed clock flows take over the whole screen (no tab bar).
  if (pushed === 'clockin') {
    return (
      <ClockInScreen
        onBack={() => setPushed(null)}
        onConfirm={() => {
          setClockedIn(true);
          setPushed(null);
        }}
      />
    );
  }
  if (pushed === 'clockout') {
    return (
      <ClockOutScreen
        onBack={() => setPushed(null)}
        onConfirm={() => {
          setClockedIn(false);
          setPushed(null);
        }}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
      <View style={{ flex: 1 }}>
        {tab === 'home' && <HomeScreen onClockIn={() => onNavigate('clock')} />}
        {tab === 'history' && <HistoryScreen />}
        {tab === 'leave' && <LeaveScreen />}
        {tab === 'profile' && <ProfileScreen />}
      </View>
      <TabBar active={tab} labels={s.nav} onNavigate={onNavigate} bottomInset={insets.bottom} />
    </View>
  );
}

export default AppNavigator;
