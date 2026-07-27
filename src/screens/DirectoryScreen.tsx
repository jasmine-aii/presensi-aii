import React, { useEffect, useState } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { UserPlus } from 'lucide-react-native';
import { color, space, radius } from '../theme';
import { Txt, Avatar, AdminStatusBadge, SearchField } from '../components';
import { useLang } from '../i18n/LangContext';
import { fetchTeam, type AdminMember } from '../lib/admin';

export function DirectoryScreen({ onInvite, onSelectMember }: { onInvite?: () => void; onSelectMember?: (m: AdminMember) => void }) {
  const { s } = useLang();
  const [q, setQ] = useState('');
  const [team, setTeam] = useState<AdminMember[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetchTeam().then((t) => alive && setTeam(t));
    return () => {
      alive = false;
    };
  }, []);

  const ql = q.toLowerCase();
  const list = (team ?? []).filter(
    (r) => r.name.toLowerCase().includes(ql) || r.employeeId.toLowerCase().includes(ql) || r.email.toLowerCase().includes(ql),
  );

  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
      {/* Header */}
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.md, backgroundColor: color.white, borderBottomWidth: 1, borderBottomColor: color.line }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: space.md }}>
          <View>
            <Txt w="bold" size={17} color={color.ink}>
              {s.adm.dirTitle}
            </Txt>
            <Txt size={12} color={color.muted} tabular style={{ marginTop: space.xs }}>
              {team?.length ?? 0} {s.adm.total}
            </Txt>
          </View>
          <Pressable onPress={onInvite} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.sm, paddingHorizontal: space.md, backgroundColor: color.anugrahBlue, borderRadius: radius.pill }}>
            <UserPlus size={15} color={color.white} strokeWidth={2} />
            <Txt w="semibold" size={13} color={color.white}>
              {s.adm.invite}
            </Txt>
          </Pressable>
        </View>
        <SearchField placeholder={s.adm.searchPh} value={q} onChangeText={setQ} />
      </View>

      {/* List */}
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xl, gap: space.md }}>
        {team === null ? (
          <View style={{ paddingTop: space['2xl'], alignItems: 'center' }}>
            <ActivityIndicator color={color.anugrahBlue} />
          </View>
        ) : (
          list.map((m) => (
            <Pressable key={m.id} onPress={() => onSelectMember?.(m)} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.md, paddingVertical: space.md, paddingHorizontal: space.md }}>
              <Avatar name={m.name} size={44} />
              <View style={{ flex: 1 }}>
                <Txt w="semibold" size={14} color={color.ink}>
                  {m.name}
                </Txt>
                <Txt size={12} color={color.muted} tabular>
                  {m.dept} · {m.employeeId}
                </Txt>
                {!!m.email && (
                  <Txt size={12} color={color.muted} numberOfLines={1}>
                    {m.email}
                  </Txt>
                )}
              </View>
              <AdminStatusBadge status={m.st} />
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

export default DirectoryScreen;
