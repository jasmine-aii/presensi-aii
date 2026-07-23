import React, { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { color } from '../theme';
import { Txt, Avatar, SegmentedTabs } from '../components';
import { useLang } from '../i18n/LangContext';
import { approvalQueue, type ApprItem } from '../lib/data';

export function ApprovalScreen() {
  const { s, lang } = useLang();
  const [tab, setTab] = useState('pending');
  const [items, setItems] = useState<ApprItem[]>(() => approvalQueue(lang, s));

  // Re-seed when language flips (dates/type localize).
  const [seedLang, setSeedLang] = useState(lang);
  if (seedLang !== lang) {
    setSeedLang(lang);
    setItems(approvalQueue(lang, s));
  }

  const resolve = (name: string) => setItems((prev) => prev.filter((i) => i.name !== name));

  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, backgroundColor: color.white }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Txt w="bold" size={17} color={color.ink}>
            {s.adm.apprTitle}
          </Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Check size={15} color={color.anugrahBlue} strokeWidth={2.5} />
            <Txt w="semibold" size={13} color={color.anugrahBlue}>
              {s.adm.bulk}
            </Txt>
          </View>
        </View>
        <SegmentedTabs
          tabs={[
            { key: 'pending', label: `${s.adm.tabPending} · ${items.length}` },
            { key: 'done', label: s.adm.tabDone },
          ]}
          active={tab}
          onChange={setTab}
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 24, gap: 12 }}>
        {tab === 'pending' ? (
          items.map((q) => {
            const Icon = q.icon;
            return (
              <View key={q.name} style={{ backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: 18, padding: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <Avatar name={q.name} size={42} />
                  <View style={{ flex: 1 }}>
                    <Txt w="semibold" size={14} color={color.ink}>
                      {q.name}
                    </Txt>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Icon size={13} color={color.muted} strokeWidth={2} />
                      <Txt size={12} color={color.muted}>
                        {q.type}
                      </Txt>
                    </View>
                  </View>
                  <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: color.skyTint }}>
                    <Txt w="semibold" size={12} color={color.anugrahBlue} tabular>
                      {q.dates} · {q.days} {s.daysUnit}
                    </Txt>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Pressable onPress={() => resolve(q.name)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 11, borderRadius: 12, backgroundColor: color.success }}>
                    <Check size={17} color={color.white} strokeWidth={2.5} />
                    <Txt w="semibold" size={14} color={color.white}>
                      {s.adm.approve}
                    </Txt>
                  </Pressable>
                  <Pressable onPress={() => resolve(q.name)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 11, borderRadius: 12, backgroundColor: color.white, borderWidth: 1, borderColor: color.line }}>
                    <X size={17} color={color.danger} strokeWidth={2.5} />
                    <Txt w="semibold" size={14} color={color.danger}>
                      {s.adm.reject}
                    </Txt>
                  </Pressable>
                </View>
              </View>
            );
          })
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <Txt size={13} color={color.muted}>
              —
            </Txt>
          </View>
        )}
        {tab === 'pending' && items.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <Txt size={13} color={color.muted}>
              {lang === 'id' ? 'Semua pengajuan sudah diproses.' : 'All requests processed.'}
            </Txt>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export default ApprovalScreen;
