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
      <View style={{ paddingHorizontal: space[20], paddingTop: space[16], paddingBottom: space[14], backgroundColor: color.white, borderBottomWidth: 1, borderBottomColor: color.line }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: space[14] }}>
          <View>
            <Txt w="bold" size={17} color={color.ink}>
              {s.adm.dirTitle}
            </Txt>
            <Txt size={12} color={color.muted} tabular style={{ marginTop: space[2] }}>
              {team?.length ?? 0} {s.adm.total}
            </Txt>
          </View>
          <Pressable onPress={onInvite} style={{ flexDirection: 'row', alignItems: 'center', gap: space[6], paddingVertical: space[8], paddingHorizontal: space[12], backgroundColor: color.anugrahBlue, borderRadius: radius.pill }}>
            <UserPlus size={15} color={color.white} strokeWidth={2} />
            <Txt w="semibold" size={13} color={color.white}>
              {s.adm.invite}
            </Txt>
          </Pressable>
        </View>
        <SearchField placeholder={s.adm.searchPh} value={q} onChangeText={setQ} />
      </View>

      {/* List */}
      <ScrollView contentContainerStyle={{ padding: space[18], paddingBottom: space[24], gap: space[10] }}>
        {team === null ? (
          <View style={{ paddingTop: space[40], alignItems: 'center' }}>
            <ActivityIndicator color={color.anugrahBlue} />
          </View>
        ) : (
          list.map((m) => (
            <Pressable key={m.id} onPress={() => onSelectMember?.(m)} style={{ flexDirection: 'row', alignItems: 'center', gap: space[12], backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius[16], paddingVertical: space[13], paddingHorizontal: space[14] }}>
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
