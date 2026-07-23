import React, { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Globe, Bell, LogOut, ArrowLeftRight, ChevronRight, CircleCheck, Users } from 'lucide-react-native';
import { color } from '../theme';
import { Txt, Avatar, Toggle, GlowCircle } from '../components';
import { useLang } from '../i18n/LangContext';
import { profileRows } from '../lib/data';

export function ProfileScreen({
  onOpenAdmin,
  onOpenDeptHead,
}: {
  onOpenAdmin?: () => void;
  onOpenDeptHead?: () => void;
}) {
  const { s, lang, langName, toggleLang } = useLang();
  const [notif, setNotif] = useState(true);
  const rows = profileRows(lang);

  return (
    <ScrollView style={{ backgroundColor: color.paper }}>
      {/* Navy header */}
      <View style={{ backgroundColor: color.deepNavy, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 26, overflow: 'hidden' }}>
        <GlowCircle size={200} top={-70} right={-50} />
        <Txt w="bold" size={17} color={color.white} style={{ marginBottom: 18 }}>
          {s.prof.title}
        </Txt>
        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          <Avatar name={s.home.name} size={72} ring="rgba(149,252,246,0.5)" />
          <View style={{ flex: 1 }}>
            <Txt w="extrabold" size={22} color={color.white}>
              {s.home.name}
            </Txt>
            <Txt size={14} color="rgba(255,255,255,0.72)" style={{ marginTop: 2, marginBottom: 8 }}>
              {s.prof.role} · {s.prof.dept}
            </Txt>
            <View
              style={{
                flexDirection: 'row',
                alignSelf: 'flex-start',
                paddingVertical: 5,
                paddingHorizontal: 11,
                backgroundColor: 'rgba(149,252,246,0.14)',
                borderWidth: 1,
                borderColor: 'rgba(149,252,246,0.4)',
                borderRadius: 999,
              }}
            >
              <Txt w="semibold" size={12} color={color.humanAccent} tabular>
                {s.prof.empId} · AII-2481
              </Txt>
            </View>
          </View>
        </View>
      </View>

      <View style={{ padding: 18, gap: 18 }}>
        {/* Detail list */}
        <View style={{ backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: 22, overflow: 'hidden' }}>
          {rows.map((r) => {
            const Icon = r.icon;
            return (
              <View key={r.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: color.line }}>
                <Icon size={20} color={color.muted} strokeWidth={2} />
                <Txt size={13} color={color.muted} style={{ width: 96 }}>
                  {r.label}
                </Txt>
                <Txt w="semibold" size={14} color={color.ink} style={{ flex: 1, textAlign: 'right' }}>
                  {r.value}
                </Txt>
              </View>
            );
          })}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15, paddingHorizontal: 18 }}>
            <CircleCheck size={20} color={color.success} strokeWidth={2} />
            <Txt size={13} color={color.muted} style={{ width: 96 }}>
              {s.prof.rate}
            </Txt>
            <Txt w="bold" size={14} color={color.success} tabular style={{ flex: 1, textAlign: 'right' }}>
              98.6%
            </Txt>
          </View>
        </View>

        {/* Workspace switcher */}
        <Pressable
          onPress={onOpenAdmin}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: color.deepNavy, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 18, overflow: 'hidden' }}
        >
          <View style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, backgroundColor: color.humanAccent }} />
          <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(149,252,246,0.16)', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeftRight size={22} color={color.humanAccent} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt w="bold" size={14} color={color.white}>
              {s.prof.switchTo}
            </Txt>
            <Txt size={12} color="rgba(255,255,255,0.72)">
              {s.prof.switchDesc}
            </Txt>
          </View>
          <ChevronRight size={20} color="rgba(255,255,255,0.6)" strokeWidth={2} />
        </Pressable>

        {/* Department Head view (single view, no HR switch) */}
        <Pressable
          onPress={onOpenDeptHead}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 18, overflow: 'hidden' }}
        >
          <View style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, backgroundColor: color.anugrahBlue }} />
          <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: color.skyTint, alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} color={color.anugrahBlue} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt w="bold" size={14} color={color.ink}>
              {s.prof.switchDept}
            </Txt>
            <Txt size={12} color={color.muted}>
              {s.prof.switchDeptDesc}
            </Txt>
          </View>
          <ChevronRight size={20} color={color.muted} strokeWidth={2} />
        </Pressable>

        {/* Settings */}
        <View>
          <Txt w="bold" size={13} color={color.muted} style={{ letterSpacing: 1.6, textTransform: 'uppercase', marginHorizontal: 4, marginBottom: 12, marginTop: 6 }}>
            {s.prof.settings}
          </Txt>
          <View style={{ backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: 22, overflow: 'hidden' }}>
            <Pressable onPress={toggleLang} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: color.line }}>
              <Globe size={20} color={color.anugrahBlue} strokeWidth={2} />
              <Txt w="semibold" size={14} color={color.ink} style={{ flex: 1 }}>
                {s.prof.sLang}
              </Txt>
              <Txt size={13} color={color.muted}>
                {langName}
              </Txt>
            </Pressable>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: color.line }}>
              <Bell size={20} color={color.anugrahBlue} strokeWidth={2} />
              <Txt w="semibold" size={14} color={color.ink} style={{ flex: 1 }}>
                {s.prof.sNotif}
              </Txt>
              <Toggle on={notif} onChange={setNotif} label={s.prof.sNotif} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15, paddingHorizontal: 18 }}>
              <LogOut size={20} color={color.danger} strokeWidth={2} />
              <Txt w="semibold" size={14} color={color.danger} style={{ flex: 1 }}>
                {s.prof.logout}
              </Txt>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

export default ProfileScreen;
