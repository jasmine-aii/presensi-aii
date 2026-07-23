import React, { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { color } from '../theme';
import { Txt, Avatar, AdminStatusBadge, TopAppBar, GlowCircle } from '../components';
import { useLang } from '../i18n/LangContext';
import { teamByDept, approvalsByDept, HEAD_DEPT, type ApprItem } from '../lib/data';

/**
 * Department Head view — a SINGLE view (no HR switcher). The head sees their
 * team's clock-in/out for the day and approves requests from their own
 * department only. `onExit` is a demo affordance to leave the preview.
 */
export function DeptHeadScreen({ onExit }: { onExit?: () => void }) {
  const { s, lang } = useLang();
  const team = teamByDept(HEAD_DEPT);
  const [appr, setAppr] = useState<ApprItem[]>(() => approvalsByDept(HEAD_DEPT, lang, s));

  const [seedLang, setSeedLang] = useState(lang);
  if (seedLang !== lang) {
    setSeedLang(lang);
    setAppr(approvalsByDept(HEAD_DEPT, lang, s));
  }

  const resolve = (name: string) => setAppr((prev) => prev.filter((a) => a.name !== name));

  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
      <TopAppBar title={s.dh.title} onBack={onExit} />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Identity — no workspace switcher */}
        <View style={{ backgroundColor: color.deepNavy, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 22, overflow: 'hidden' }}>
          <GlowCircle size={200} top={-70} right={-50} />
          <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
            <Avatar name={s.dh.name} size={60} ring="rgba(149,252,246,0.5)" />
            <View style={{ flex: 1 }}>
              <Txt w="extrabold" size={20} color={color.white}>
                {s.dh.name}
              </Txt>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <View style={{ paddingVertical: 3, paddingHorizontal: 9, borderRadius: 999, backgroundColor: 'rgba(149,252,246,0.16)' }}>
                  <Txt w="bold" size={11} color={color.humanAccent}>
                    {s.dh.title}
                  </Txt>
                </View>
                <Txt size={13} color="rgba(255,255,255,0.72)">
                  {s.dh.dept}
                </Txt>
              </View>
            </View>
          </View>
        </View>

        {/* Team attendance */}
        <View style={{ paddingHorizontal: 18, paddingTop: 20 }}>
          <Txt w="bold" size={14} color={color.ink} style={{ marginBottom: 12 }}>
            {s.dh.teamTitle}
          </Txt>
          <View style={{ gap: 10 }}>
            {team.map((m) => (
              <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14 }}>
                <Avatar name={m.name} size={40} />
                <View style={{ flex: 1 }}>
                  <Txt w="semibold" size={14} color={color.ink}>
                    {m.name}
                  </Txt>
                  <Txt size={12} color={color.muted} tabular style={{ marginTop: 1 }}>
                    {s.out.inAt} {m.in} · {s.out.outAt} {m.out}
                  </Txt>
                </View>
                <AdminStatusBadge status={m.st} />
              </View>
            ))}
          </View>
        </View>

        {/* Team approvals */}
        <View style={{ paddingHorizontal: 18, paddingTop: 22 }}>
          <Txt w="bold" size={14} color={color.ink} style={{ marginBottom: 12 }}>
            {s.dh.apprTitle}
          </Txt>
          {appr.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 28 }}>
              <Txt size={13} color={color.muted}>
                {s.dh.noAppr}
              </Txt>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {appr.map((q) => {
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
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

export default DeptHeadScreen;
