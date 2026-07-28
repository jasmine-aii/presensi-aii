import React, { useEffect, useState } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, ArrowLeftRight, Users, ClipboardList, TrendingUp, UserPlus, Palmtree, type LucideIcon } from 'lucide-react-native';
import { color, space, radius } from '../theme';
import { Txt, Avatar, AdminStatusBadge, GlowCircle } from '../components';
import type { AdminNav } from '../components';
import { useLang } from '../i18n/LangContext';
import { useAuth } from '../auth/AuthContext';
import { useNow } from '../lib/useNow';
import { dateStr, rangeStr } from '../lib/format';
import { fetchTeam, deriveStats, type AdminMember } from '../lib/admin';
import { fetchOnLeaveToday, pendingLeaveCount, type AdminLeaveRequest } from '../lib/leave';

export function HRDashboardScreen({
  onNavigate,
  onSwitchEmployee,
  onSelectMember,
}: {
  onNavigate?: (k: AdminNav) => void;
  onSwitchEmployee?: () => void;
  onSelectMember?: (m: AdminMember) => void;
}) {
  const { s, lang } = useLang();
  const { profile } = useAuth();
  const now = useNow(60000);
  const [team, setTeam] = useState<AdminMember[] | null>(null);
  const [onLeave, setOnLeave] = useState<AdminLeaveRequest[]>([]);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    let alive = true;
    Promise.all([fetchTeam(), fetchOnLeaveToday(), pendingLeaveCount()]).then(([t, l, p]) => {
      if (!alive) return;
      setTeam(t);
      setOnLeave(l);
      setPending(p);
    });
    return () => {
      alive = false;
    };
  }, []);

  // fetchTeam already marks employees on approved leave as 'leave', so the
  // headline counts and the "not clocked in" list exclude them automatically.
  const stats = team ? deriveStats(team) : { present: 0, late: 0, notyet: 0, leave: 0, total: 0 };
  const notInList = (team ?? []).filter((m) => (m.st === 'not' || m.st === 'late') && !m.excludeFromStats);
  const adminName = profile?.full_name ?? s.adm.name;

  return (
    <ScrollView style={{ backgroundColor: color.paper }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.xl, paddingTop: space.lg, paddingBottom: space.md, backgroundColor: color.white }}>
        <View style={{ flexDirection: 'row', gap: space.md, flex: 1 }}>
          <Avatar name={adminName} size={46} />
          <View style={{ flex: 1 }}>
            <Txt size={13} color={color.muted}>
              {s.adm.greeting}
            </Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
              <Txt w="bold" size={17} color={color.ink}>
                {adminName}
              </Txt>
              <View style={{ paddingVertical: space.xs, paddingHorizontal: space.sm, borderRadius: radius.pill, backgroundColor: color.humanTint }}>
                <Txt w="bold" size={11} color="#0F766E">
                  {s.adm.role}
                </Txt>
              </View>
            </View>
            <Pressable
              onPress={onSwitchEmployee}
              style={{ flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: space.sm, marginTop: space.sm, paddingVertical: space.sm, paddingHorizontal: space.md, borderRadius: radius.pill, backgroundColor: color.skyTint }}
            >
              <ArrowLeftRight size={14} color={color.anugrahBlue} strokeWidth={2} />
              <Txt w="semibold" size={12} color={color.anugrahBlue}>
                {s.adm.switchEmp}
              </Txt>
            </Pressable>
          </View>
        </View>
        <Bell size={22} color={color.muted} strokeWidth={2} />
      </View>

      {/* Attendance card — AII-blue → navy gradient (matches the employee hero) */}
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg }}>
        <LinearGradient
          colors={[color.anugrahBlue, color.anugrahBlue, color.deepNavy]}
          locations={[0, 0.55, 1]}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
          style={{ borderRadius: radius.lg, padding: space.lg, overflow: 'hidden' }}
        >
          <GlowCircle size={180} top={-70} right={-40} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.lg }}>
            <Txt w="bold" size={14} color={color.white}>
              {s.adm.todayTitle}
            </Txt>
            <Txt size={13} color="rgba(255,255,255,0.7)" tabular>
              {dateStr(now, lang)}
            </Txt>
          </View>
          <View style={{ flexDirection: 'row', gap: space.md }}>
            <NavyTile value={stats.present} label={s.adm.present} valueColor="#5EE0A0" />
            <NavyTile value={stats.notyet} label={s.adm.notyet} valueColor={color.white} />
            <NavyTile value={stats.late} label={s.adm.late} valueColor="#FF9D9D" />
            <NavyTile value={stats.leave} label={s.adm.leave} valueColor={color.humanAccent} />
          </View>
        </LinearGradient>
      </View>

      {/* Not clocked in */}
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md }}>
          <Txt w="bold" size={14} color={color.ink}>
            {s.adm.notYetTitle}
          </Txt>
          <Pressable onPress={() => onNavigate?.('team')} hitSlop={8}>
            <Txt w="semibold" size={13} color={color.anugrahBlue}>
              {s.adm.seeAll}
            </Txt>
          </Pressable>
        </View>
        <View style={{ gap: space.md }}>
          {team === null ? (
            <View style={{ paddingVertical: space.lg, alignItems: 'center' }}>
              <ActivityIndicator color={color.anugrahBlue} />
            </View>
          ) : notInList.length === 0 ? (
            <View style={{ paddingVertical: space.lg, alignItems: 'center' }}>
              <Txt size={13} color={color.muted}>
                {s.adm.allIn}
              </Txt>
            </View>
          ) : (
            notInList.map((p) => (
              <Pressable key={p.id} onPress={() => onSelectMember?.(p)} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.md, paddingVertical: space.md, paddingHorizontal: space.md }}>
                <Avatar name={p.name} size={40} />
                <View style={{ flex: 1 }}>
                  <Txt w="semibold" size={14} color={color.ink}>
                    {p.name}
                  </Txt>
                  <Txt size={12} color={color.muted}>
                    {p.dept}
                  </Txt>
                </View>
                <AdminStatusBadge status={p.st} />
              </Pressable>
            ))
          )}
        </View>
      </View>

      {/* On leave today */}
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.xl }}>
        <Txt w="bold" size={14} color={color.ink} style={{ marginBottom: space.md }}>
          {s.adm.onLeaveTitle}
        </Txt>
        {onLeave.length === 0 ? (
          <View style={{ paddingVertical: space.lg, alignItems: 'center' }}>
            <Txt size={13} color={color.muted}>
              {s.adm.onLeaveEmpty}
            </Txt>
          </View>
        ) : (
          <View style={{ gap: space.md }}>
            {onLeave.map((l) => (
              <View key={l.id} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.md, paddingVertical: space.md, paddingHorizontal: space.md }}>
                <View style={{ width: 40, height: 40, borderRadius: radius.sm, backgroundColor: color.humanTint, alignItems: 'center', justifyContent: 'center' }}>
                  <Palmtree size={20} color={color.deepNavy} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt w="semibold" size={14} color={color.ink}>
                    {l.employeeName}
                  </Txt>
                  <Txt size={12} color={color.muted} tabular>
                    {s.leave.kind[l.type]} · {rangeStr(l.startDate, l.endDate, lang)}
                  </Txt>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Quick actions */}
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.xl, paddingBottom: space.xl }}>
        <Txt w="bold" size={14} color={color.ink} style={{ marginBottom: space.md }}>
          {s.adm.quickTitle}
        </Txt>
        <View style={{ flexDirection: 'row', gap: space.md }}>
          <QuickAction icon={Users} label={s.adm.qDir} onPress={() => onNavigate?.('team')} />
          <QuickAction icon={ClipboardList} label={s.adm.qAppr} badge={pending || undefined} onPress={() => onNavigate?.('approval')} />
          <QuickAction icon={TrendingUp} label={s.adm.qReport} onPress={() => onNavigate?.('report')} />
          <QuickAction icon={UserPlus} label={s.adm.qInvite} filled onPress={() => onNavigate?.('add')} />
        </View>
      </View>
    </ScrollView>
  );
}

function NavyTile({ value, label, valueColor }: { value: number; label: string; valueColor: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radius.md, paddingVertical: space.md, paddingHorizontal: space.sm, alignItems: 'center' }}>
      <Txt w="extrabold" size={24} color={valueColor} tabular>
        {value}
      </Txt>
      <Txt size={11} color="rgba(255,255,255,0.7)" style={{ marginTop: space.xs, textAlign: 'center' }}>
        {label}
      </Txt>
    </View>
  );
}

function QuickAction({ icon: Icon, label, badge, filled, disabled, onPress }: { icon: LucideIcon; label: string; badge?: number; filled?: boolean; disabled?: boolean; onPress?: () => void }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={{ flex: 1, backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.md, paddingVertical: space.md, paddingHorizontal: space.sm, alignItems: 'center', gap: space.sm, opacity: disabled ? 0.45 : 1 }}>
      {badge != null && (
        <View style={{ position: 'absolute', top: 8, right: 12, minWidth: 18, height: 18, paddingHorizontal: space.xs, borderRadius: radius.pill, backgroundColor: color.danger, alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
          <Txt w="bold" size={11} color={color.white}>
            {badge}
          </Txt>
        </View>
      )}
      <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: filled ? color.anugrahBlue : color.skyTint, alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={22} color={filled ? color.white : color.anugrahBlue} strokeWidth={2} />
      </View>
      <Txt w="semibold" size={11} color={color.ink} style={{ textAlign: 'center' }}>
        {label}
      </Txt>
    </Pressable>
  );
}

export default HRDashboardScreen;
