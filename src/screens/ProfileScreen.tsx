import React, { useState } from 'react';
import { View, ScrollView, Pressable, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Globe, Bell, LogOut, ArrowLeftRight, ChevronRight, CircleCheck, KeyRound, Cake, X } from 'lucide-react-native';
import { color, interFamily, space, radius } from '../theme';
import { Txt, Avatar, Toggle, Button, GlowCircle, Dialog } from '../components';
import { useLang } from '../i18n/LangContext';
import { supabase } from '../lib/supabase';
import { rangeStr } from '../lib/format';
import { profileRows } from '../lib/data';

export function ProfileScreen({
  onOpenAdmin,
  onLogout,
  name,
  role,
  dept,
  empId,
  email,
  birthDate,
  joinDate,
  isAdmin,
}: {
  onOpenAdmin?: () => void;
  onLogout?: () => void;
  name?: string;
  role?: string;
  dept?: string;
  empId?: string;
  email?: string;
  birthDate?: string | null;
  joinDate?: string | null;
  isAdmin?: boolean;
}) {
  const { s, lang, langName, toggleLang } = useLang();
  const [notif, setNotif] = useState(true);
  const rows = profileRows(lang, email, joinDate ? rangeStr(joinDate, joinDate, lang) : undefined);
  const userName = name ?? s.home.name;

  // Change-password modal state
  const [pwOpen, setPwOpen] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [pwDone, setPwDone] = useState(false);

  const savePassword = async () => {
    if (pwBusy) return;
    if (newPw.length < 6) return setPwErr(s.prof.pwMin);
    if (newPw !== confirmPw) return setPwErr(s.prof.pwMismatch);
    setPwErr(null);
    setPwBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setPwBusy(false);
    if (error) return setPwErr(error.message);
    setPwDone(true);
    setNewPw('');
    setConfirmPw('');
  };
  const closePw = () => {
    setPwOpen(false);
    setPwErr(null);
    setPwDone(false);
    setNewPw('');
    setConfirmPw('');
  };

  return (
    <ScrollView style={{ backgroundColor: color.paper }}>
      {/* Header — AII-blue → navy gradient (matches the dashboard clock card) */}
      <LinearGradient
        colors={[color.anugrahBlue, color.anugrahBlue, color.deepNavy]}
        locations={[0, 0.55, 1]}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        style={{ paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.xl, overflow: 'hidden' }}
      >
        <GlowCircle size={200} top={-70} right={-50} />
        <Txt w="bold" size={17} color={color.white} style={{ marginBottom: space.lg }}>
          {s.prof.title}
        </Txt>
        <View style={{ flexDirection: 'row', gap: space.lg, alignItems: 'center' }}>
          <Avatar name={userName} size={72} ring="rgba(149,252,246,0.5)" />
          <View style={{ flex: 1 }}>
            <Txt w="extrabold" size={22} color={color.white}>
              {userName}
            </Txt>
            <Txt size={14} color="rgba(255,255,255,0.72)" style={{ marginTop: space.xs, marginBottom: space.sm }}>
              {(role ?? s.prof.role) + ' · ' + (dept ?? s.prof.dept)}
            </Txt>
            <View
              style={{
                flexDirection: 'row',
                alignSelf: 'flex-start',
                paddingVertical: space.xs,
                paddingHorizontal: space.md,
                backgroundColor: 'rgba(149,252,246,0.14)',
                borderWidth: 1,
                borderColor: 'rgba(149,252,246,0.4)',
                borderRadius: radius.pill,
              }}
            >
              <Txt w="semibold" size={12} color={color.humanAccent} tabular>
                {s.prof.empId} · {empId ?? 'AII001'}
              </Txt>
            </View>
          </View>
        </View>
      </LinearGradient>

      <View style={{ padding: space.lg, gap: space.lg }}>
        {/* Detail list */}
        <View style={{ backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.lg, overflow: 'hidden' }}>
          {!!birthDate && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.lg, paddingHorizontal: space.lg, borderBottomWidth: 1, borderBottomColor: color.line }}>
              <Cake size={20} color={color.muted} strokeWidth={2} />
              <Txt size={13} color={color.muted} style={{ width: 96 }}>
                {s.adm.fBirth}
              </Txt>
              <Txt w="semibold" size={14} color={color.ink} tabular style={{ flex: 1, textAlign: 'right' }}>
                {rangeStr(birthDate, birthDate, lang)}
              </Txt>
            </View>
          )}
          {rows.map((r) => {
            const Icon = r.icon;
            return (
              <View key={r.label} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.lg, paddingHorizontal: space.lg, borderBottomWidth: 1, borderBottomColor: color.line }}>
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.lg, paddingHorizontal: space.lg }}>
            <CircleCheck size={20} color={color.success} strokeWidth={2} />
            <Txt size={13} color={color.muted} style={{ width: 96 }}>
              {s.prof.rate}
            </Txt>
            <Txt w="bold" size={14} color={color.success} tabular style={{ flex: 1, textAlign: 'right' }}>
              98.6%
            </Txt>
          </View>
        </View>

        {/* Admin view switcher — only for accounts with Admin access */}
        {isAdmin && (
          <Pressable
            onPress={onOpenAdmin}
            style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: color.deepNavy, borderRadius: radius.md, paddingVertical: space.lg, paddingHorizontal: space.lg, overflow: 'hidden' }}
          >
            <View style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, backgroundColor: color.humanAccent }} />
            <View style={{ width: 42, height: 42, borderRadius: radius.sm, backgroundColor: 'rgba(149,252,246,0.16)', alignItems: 'center', justifyContent: 'center' }}>
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
        )}

        {/* Settings */}
        <View>
          <Txt w="bold" size={13} color={color.muted} style={{ letterSpacing: 1.6, textTransform: 'uppercase', marginHorizontal: space.xs, marginBottom: space.md, marginTop: space.sm }}>
            {s.prof.settings}
          </Txt>
          <View style={{ backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.lg, overflow: 'hidden' }}>
            <Pressable onPress={toggleLang} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.lg, paddingHorizontal: space.lg, borderBottomWidth: 1, borderBottomColor: color.line }}>
              <Globe size={20} color={color.anugrahBlue} strokeWidth={2} />
              <Txt w="semibold" size={14} color={color.ink} style={{ flex: 1 }}>
                {s.prof.sLang}
              </Txt>
              <Txt size={13} color={color.muted}>
                {langName}
              </Txt>
            </Pressable>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.lg, paddingHorizontal: space.lg, borderBottomWidth: 1, borderBottomColor: color.line }}>
              <Bell size={20} color={color.anugrahBlue} strokeWidth={2} />
              <Txt w="semibold" size={14} color={color.ink} style={{ flex: 1 }}>
                {s.prof.sNotif}
              </Txt>
              <Toggle on={notif} onChange={setNotif} label={s.prof.sNotif} />
            </View>
            <Pressable onPress={() => setPwOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.lg, paddingHorizontal: space.lg, borderBottomWidth: 1, borderBottomColor: color.line }}>
              <KeyRound size={20} color={color.anugrahBlue} strokeWidth={2} />
              <Txt w="semibold" size={14} color={color.ink} style={{ flex: 1 }}>
                {s.prof.changePw}
              </Txt>
              <ChevronRight size={18} color={color.muted} strokeWidth={2} />
            </Pressable>
            <Pressable onPress={onLogout} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.lg, paddingHorizontal: space.lg }}>
              <LogOut size={20} color={color.danger} strokeWidth={2} />
              <Txt w="semibold" size={14} color={color.danger} style={{ flex: 1 }}>
                {s.prof.logout}
              </Txt>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Change-password modal */}
      <Dialog visible={pwOpen} onClose={closePw} maxWidth={340}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md }}>
          <Txt w="bold" size={16} color={color.ink}>
            {s.prof.changePw}
          </Txt>
          <Pressable onPress={closePw} hitSlop={10} accessibilityLabel={s.hist.close}>
            <X size={20} color={color.muted} strokeWidth={2} />
          </Pressable>
        </View>

        {pwDone ? (
          <View style={{ alignItems: 'center', paddingVertical: space.md, gap: space.md }}>
            <CircleCheck size={40} color={color.success} strokeWidth={2} />
            <Txt size={14} color={color.ink} style={{ textAlign: 'center' }}>
              {s.prof.pwSaved}
            </Txt>
            <Button variant="primary" size="md" fullWidth label={s.dlg.done} onPress={closePw} />
          </View>
        ) : (
          <View style={{ gap: space.md }}>
            <PwInput placeholder={s.prof.newPw} value={newPw} onChangeText={setNewPw} />
            <PwInput placeholder={s.prof.confirmPw} value={confirmPw} onChangeText={setConfirmPw} />
            {pwErr && (
              <Txt size={12} color={color.danger} style={{ lineHeight: 17 }}>
                {pwErr}
              </Txt>
            )}
            <Button variant="primary" size="md" fullWidth label={s.prof.save} disabled={pwBusy} onPress={savePassword} />
          </View>
        )}
      </Dialog>
    </ScrollView>
  );
}

function PwInput(props: React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.sm, paddingHorizontal: space.md, paddingVertical: space.md }}>
      <KeyRound size={20} color={color.anugrahBlue} strokeWidth={2} />
      <TextInput
        secureTextEntry
        autoCapitalize="none"
        placeholderTextColor={color.muted}
        style={{ flex: 1, fontFamily: interFamily('regular'), fontSize: 14, color: color.ink, padding: 0 }}
        {...props}
      />
    </View>
  );
}

export default ProfileScreen;
