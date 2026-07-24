import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color } from '../theme';
import { TabBar, type NavKey } from '../components';
import { useLang } from '../i18n/LangContext';
import { useAuth } from '../auth/AuthContext';
import { fetchToday, recordClockIn, recordClockOut } from '../lib/attendance';
import { uploadClockPhoto } from '../lib/storage';
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
 * State-based navigator. Two workspaces (employee ⇄ admin), each with a bottom
 * tab bar + raised FAB, plus pushed sub-views (clock flows, invite). Clock
 * in/out is persisted to Supabase; today's status is restored on mount.
 */
export function AppNavigator() {
  const { s } = useLang();
  const insets = useSafeAreaInsets();
  const { session, profile, signOut } = useAuth();
  const userId = session?.user.id ?? '';
  const isAdmin = profile?.role === 'admin';

  const [workspace, setWorkspace] = useState<Workspace>('employee');
  const [empTab, setEmpTab] = useState<EmpTab>('home');
  const [admTab, setAdmTab] = useState<AdmTab>('dashboard');
  const [pushed, setPushed] = useState<Pushed>(null);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [clockOutTime, setClockOutTime] = useState<string | null>(null);
  const clockedIn = !!clockInTime && !clockOutTime;

  // Restore today's attendance so the hero shows the real clocked state.
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    fetchToday(userId).then((t) => {
      if (!alive) return;
      setClockInTime(t.clockInTime);
      setClockOutTime(t.clockOutTime);
    });
    return () => {
      alive = false;
    };
  }, [userId]);

  const displayName = profile?.full_name ?? s.home.name;

  // ── Pushed sub-views take over the whole screen (no tab bar) ──
  if (pushed === 'clockin') {
    return (
      <ClockInScreen
        onBack={() => setPushed(null)}
        onConfirm={async ({ time, lat, lng, photoBase64 }) => {
          const photo = photoBase64 ? await uploadClockPhoto(userId, 'in', photoBase64) : null;
          const ok = await recordClockIn(userId, { time, lat, lng, photo });
          if (ok) {
            setClockInTime(time);
            setClockOutTime(null);
          }
          return ok;
        }}
      />
    );
  }
  if (pushed === 'clockout') {
    return (
      <ClockOutScreen
        onBack={() => setPushed(null)}
        name={displayName}
        clockInTime={clockInTime ?? undefined}
        onConfirm={async ({ time, lat, lng, photoBase64 }) => {
          const photo = photoBase64 ? await uploadClockPhoto(userId, 'out', photoBase64) : null;
          const ok = await recordClockOut(userId, { time, lat, lng, photo });
          if (ok) setClockOutTime(time);
          return ok;
        }}
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
            name={displayName}
            onClock={(mode) => setPushed(mode === 'out' ? 'clockout' : 'clockin')}
            onOpenHistory={() => setEmpTab('history')}
            clockInTime={clockInTime}
            clockOutTime={clockOutTime}
          />
        )}
        {empTab === 'history' && <HistoryScreen />}
        {empTab === 'leave' && <LeaveScreen />}
        {empTab === 'profile' && (
          <ProfileScreen
            name={displayName}
            role={profile?.role === 'admin' ? s.adm.role : s.prof.role}
            dept={profile?.department ?? s.prof.dept}
            empId={profile?.employee_id ?? undefined}
            isAdmin={isAdmin}
            onOpenAdmin={() => {
              setWorkspace('admin');
              setAdmTab('dashboard');
            }}
            onLogout={signOut}
          />
        )}
      </View>
      <TabBar mode="employee" active={empTab} labels={s.nav} onNavigate={empNavigate} bottomInset={insets.bottom} />
    </View>
  );
}

export default AppNavigator;
