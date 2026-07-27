import React, { useEffect, useState } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Bell, ArrowLeftRight, Users, ClipboardList, TrendingUp, UserPlus, type LucideIcon } from 'lucide-react-native';
import { color, space, radius } from '../theme';
import { Txt, Avatar, AdminStatusBadge, GlowCircle } from '../components';
import type { AdminNav } from '../components';
import { useLang } from '../i18n/LangContext';
import { useAuth } from '../auth/AuthContext';
import { useNow } from '../lib/useNow';
import { dateStr } from '../lib/format';
import { fetchTeam, deriveStats, type AdminMember } from '../lib/admin';

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

  useEffect(() => {
    let alive = true;
    fetchTeam().then((t) => alive && setTeam(t));
    return () => {
      alive = false;
    };
  }, []);

  const stats = team ? deriveStats(team) : { present: 0, late: 0, notyet: 0, leave: 0, total: 0 };
  const notInList = (team ?? []).filter((m) => m.st === 'not' || m.st === 'late');
  const adminName = profile?.full_name ?? s.adm.name;

  return (
    <ScrollView style={{ backgroundColor: color.paper }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space[22], paddingTop: space[16], paddingBottom: space[14], backgroundColor: color.white }}>
        <View style={{ flexDirection: 'row', gap: space[12], flex: 1 }}>
          <Avatar name={adminName} size={46} />
          <View style={{ flex: 1 }}>
            <Txt size={13} color={color.muted}>
              {s.adm.greeting}
            </Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[8] }}>
              <Txt w="bold" size={17} color={color.ink}>
                {adminName}
              </Txt>
              <View style={{ paddingVertical: space[3], paddingHorizontal: space[9], borderRadius: radius.pill, backgroundColor: color.humanTint }}>
                <Txt w="bold" size={11} color="#0F766E">
                  {s.adm.role}
                </Txt>
              </View>
            </View>
            <Pressable
              onPress={onSwitchEmployee}
              style={{ flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: space[6], marginTop: space[8], paddingVertical: space[6], paddingHorizontal: space[11], borderRadius: radius.pill, backgroundColor: color.skyTint }}
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

      {/* Navy attendance card */}
      <View style={{ paddingHorizontal: space[18], paddingTop: space[16] }}>
        <View style={{ backgroundColor: color.deepNavy, borderRadius: radius[24], padding: space[20], overflow: 'hidden' }}>
          <GlowCircle size={180} top={-70} right={-40} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space[16] }}>
            <Txt w="bold" size={14} color={color.white}>
              {s.adm.todayTitle}
            </Txt>
            <Txt size={13} color="rgba(255,255,255,0.7)" tabular>
              {dateStr(now, lang)}
            </Txt>
          </View>
          <View style={{ flexDirection: 'row', gap: space[10] }}>
            <NavyTile value={stats.present} label={s.adm.present} valueColor="#5EE0A0" />
            <NavyTile value={stats.notyet} label={s.adm.notyet} valueColor={color.white} />
            <NavyTile value={stats.late} label={s.adm.late} valueColor="#FF9D9D" />
            <NavyTile value={stats.leave} label={s.adm.leave} valueColor={color.humanAccent} />
          </View>
        </View>
      </View>

      {/* Not clocked in */}
      <View style={{ paddingHorizontal: space[18], paddingTop: space[20] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space[12] }}>
          <Txt w="bold" size={14} color={color.ink}>
            {s.adm.notYetTitle}
          </Txt>
          <Pressable onPress={() => onNavigate?.('team')} hitSlop={8}>
            <Txt w="semibold" size={13} color={color.anugrahBlue}>
              {s.adm.seeAll}
            </Txt>
          </Pressable>
        </View>
        <View style={{ gap: space[10] }}>
          {team === null ? (
            <View style={{ paddingVertical: space[20], alignItems: 'center' }}>
              <ActivityIndicator color={color.anugrahBlue} />
            </View>
          ) : notInList.length === 0 ? (
            <View style={{ paddingVertical: space[20], alignItems: 'center' }}>
              <Txt size={13} color={color.muted}>
                {s.adm.allIn}
              </Txt>
            </View>
          ) : (
            notInList.map((p) => (
              <Pressable key={p.id} onPress={() => onSelectMember?.(p)} style={{ flexDirection: 'row', alignItems: 'center', gap: space[12], backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius[16], paddingVertical: space[12], paddingHorizontal: space[14] }}>
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

      {/* Quick actions */}
      <View style={{ paddingHorizontal: space[18], paddingTop: space[22], paddingBottom: space[24] }}>
        <Txt w="bold" size={14} color={color.ink} style={{ marginBottom: space[12] }}>
          {s.adm.quickTitle}
        </Txt>
        <View style={{ flexDirection: 'row', gap: space[12] }}>
          <QuickAction icon={Users} label={s.adm.qDir} onPress={() => onNavigate?.('team')} />
          <QuickAction icon={ClipboardList} label={s.adm.qAppr} disabled />
          <QuickAction icon={TrendingUp} label={s.adm.qReport} onPress={() => onNavigate?.('report')} />
          <QuickAction icon={UserPlus} label={s.adm.qInvite} filled onPress={() => onNavigate?.('add')} />
        </View>
      </View>
    </ScrollView>
  );
}

function NavyTile({ value, label, valueColor }: { value: number; label: string; valueColor: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radius[14], paddingVertical: space[12], paddingHorizontal: space[8], alignItems: 'center' }}>
      <Txt w="extrabold" size={24} color={valueColor} tabular>
        {value}
      </Txt>
      <Txt size={11} color="rgba(255,255,255,0.7)" style={{ marginTop: space[2], textAlign: 'center' }}>
        {label}
      </Txt>
    </View>
  );
}

function QuickAction({ icon: Icon, label, badge, filled, disabled, onPress }: { icon: LucideIcon; label: string; badge?: number; filled?: boolean; disabled?: boolean; onPress?: () => void }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={{ flex: 1, backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius[18], paddingVertical: space[14], paddingHorizontal: space[6], alignItems: 'center', gap: space[8], opacity: disabled ? 0.45 : 1 }}>
      {badge != null && (
        <View style={{ position: 'absolute', top: 8, right: 12, minWidth: 18, height: 18, paddingHorizontal: space[5], borderRadius: radius.pill, backgroundColor: color.danger, alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
          <Txt w="bold" size={11} color={color.white}>
            {badge}
          </Txt>
        </View>
      )}
      <View style={{ width: 44, height: 44, borderRadius: radius[14], backgroundColor: filled ? color.anugrahBlue : color.skyTint, alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={22} color={filled ? color.white : color.anugrahBlue} strokeWidth={2} />
      </View>
      <Txt w="semibold" size={11} color={color.ink} style={{ textAlign: 'center' }}>
        {label}
      </Txt>
    </Pressable>
  );
}

export default HRDashboardScreen;
