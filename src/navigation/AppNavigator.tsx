import React, { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color } from '../theme';
import { TabBar, type NavKey } from '../components';
import { useLang } from '../i18n/LangContext';
import {
  HomeScreen,
  ClockInScreen,
  ClockOutScreen,
  HistoryScreen,
  LeaveScreen,
  ProfileScreen,
  HRDashboardScreen,
  DirectoryScreen,
  InviteScreen,
  ApprovalScreen,
  ReportsScreen,
} from '../screens';

type Workspace = 'employee' | 'admin';
type EmpTab = 'home' | 'history' | 'leave' | 'profile';
type AdmTab = 'dashboard' | 'team' | 'approval' | 'report';
type Pushed = 'clockin' | 'clockout' | 'invite' | null;

/**
 * State-based navigator. Two workspaces (employee ⇄ HR admin), each with a
 * bottom tab bar + raised FAB, plus pushed sub-views (clock flows, invite).
 * The WorkspaceSwitcher on Profile / the HR dashboard flips between them —
 * mirroring the design's multi-role account.
 */
export function AppNavigator() {
  const { s } = useLang();
  const insets = useSafeAreaInsets();
  const [workspace, setWorkspace] = useState<Workspace>('employee');
  const [empTab, setEmpTab] = useState<EmpTab>('home');
  const [admTab, setAdmTab] = useState<AdmTab>('dashboard');
  const [pushed, setPushed] = useState<Pushed>(null);
  const [clockedIn, setClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [clockOutTime, setClockOutTime] = useState<string | null>(null);

  // ── Pushed sub-views take over the whole screen (no tab bar) ──
  if (pushed === 'clockin') {
    return (
      <ClockInScreen
        onBack={() => setPushed(null)}
        onConfirm={(time) => { setClockedIn(true); setClockInTime(time); setClockOutTime(null); setPushed(null); }}
      />
    );
  }
  if (pushed === 'clockout') {
    return (
      <ClockOutScreen
        onBack={() => setPushed(null)}
        clockInTime={clockInTime ?? undefined}
        onConfirm={(time) => { setClockedIn(false); setClockOutTime(time); setPushed(null); }}
      />
    );
  }
  if (pushed === 'invite') {
    return <InviteScreen onBack={() => setPushed(null)} />;
  }

  // ── Admin workspace ──
  if (workspace === 'admin') {
    const admNavigate = (key: NavKey) => {
      if (key === 'add') {
        setPushed('invite');
      } else if (key === 'dashboard' || key === 'team' || key === 'approval' || key === 'report') {
        setAdmTab(key);
        setPushed(null);
      }
    };
    return (
      <View style={{ flex: 1, backgroundColor: color.paper }}>
        <View style={{ flex: 1 }}>
          {admTab === 'dashboard' && <HRDashboardScreen onNavigate={admNavigate} onSwitchEmployee={() => setWorkspace('employee')} />}
          {admTab === 'team' && <DirectoryScreen onInvite={() => setPushed('invite')} />}
          {admTab === 'approval' && <ApprovalScreen />}
          {admTab === 'report' && <ReportsScreen />}
        </View>
        <TabBar mode="admin" active={admTab} labels={s.anav} onNavigate={admNavigate} badges={{ approval: 3 }} bottomInset={insets.bottom} />
      </View>
    );
  }

  // ── Employee workspace ──
  const empNavigate = (key: NavKey) => {
    if (key === 'clock') {
      setPushed(clockedIn ? 'clockout' : 'clockin');
    } else if (key === 'home' || key === 'history' || key === 'leave' || key === 'profile') {
      setEmpTab(key);
      setPushed(null);
    }
  };
  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
      <View style={{ flex: 1 }}>
        {empTab === 'home' && (
          <HomeScreen
            onClock={(mode) => setPushed(mode === 'out' ? 'clockout' : 'clockin')}
            onOpenHistory={() => setEmpTab('history')}
            clockInTime={clockInTime}
            clockOutTime={clockOutTime}
          />
        )}
        {empTab === 'history' && <HistoryScreen />}
        {empTab === 'leave' && <LeaveScreen />}
        {empTab === 'profile' && (
          <ProfileScreen onOpenAdmin={() => { setWorkspace('admin'); setAdmTab('dashboard'); }} />
        )}
      </View>
      <TabBar mode="employee" active={empTab} labels={s.nav} onNavigate={empNavigate} bottomInset={insets.bottom} />
    </View>
  );
}

export default AppNavigator;
