import React, { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { UserPlus } from 'lucide-react-native';
import { color } from '../theme';
import { Txt, Avatar, AdminStatusBadge, SearchField } from '../components';
import { useLang } from '../i18n/LangContext';
import { roster, adminStats } from '../lib/data';

export function DirectoryScreen({ onInvite }: { onInvite?: () => void }) {
  const { s } = useLang();
  const [q, setQ] = useState('');

  const list = roster.filter(
    (r) => r.name.toLowerCase().includes(q.toLowerCase()) || r.id.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, backgroundColor: color.white, borderBottomWidth: 1, borderBottomColor: color.line }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <View>
            <Txt w="bold" size={17} color={color.ink}>
              {s.adm.dirTitle}
            </Txt>
            <Txt size={12} color={color.muted} tabular style={{ marginTop: 2 }}>
              {adminStats.total} {s.adm.total}
            </Txt>
          </View>
          <Pressable onPress={onInvite} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: color.anugrahBlue, borderRadius: 999 }}>
            <UserPlus size={15} color={color.white} strokeWidth={2} />
            <Txt w="semibold" size={13} color={color.white}>
              {s.adm.invite}
            </Txt>
          </Pressable>
        </View>
        <SearchField placeholder={s.adm.searchPh} value={q} onChangeText={setQ} />
      </View>

      {/* List */}
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 24, gap: 10 }}>
        {list.map((m) => (
          <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: 16, paddingVertical: 13, paddingHorizontal: 14 }}>
            <Avatar name={m.name} size={44} />
            <View style={{ flex: 1 }}>
              <Txt w="semibold" size={14} color={color.ink}>
                {m.name}
              </Txt>
              <Txt size={12} color={color.muted} tabular>
                {m.role} · {m.id}
              </Txt>
            </View>
            <AdminStatusBadge status={m.st} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export default DirectoryScreen;
