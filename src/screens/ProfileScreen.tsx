import React, { useState } from 'react';
import { View, ScrollView, Pressable, Modal, TextInput } from 'react-native';
import { Globe, Bell, LogOut, ArrowLeftRight, ChevronRight, CircleCheck, KeyRound, X } from 'lucide-react-native';
import { color, interFamily } from '../theme';
import { Txt, Avatar, Toggle, Button, GlowCircle } from '../components';
import { useLang } from '../i18n/LangContext';
import { supabase } from '../lib/supabase';
import { profileRows } from '../lib/data';

export function ProfileScreen({
  onOpenAdmin,
  onLogout,
  name,
  role,
  dept,
  empId,
  isAdmin,
}: {
  onOpenAdmin?: () => void;
  onLogout?: () => void;
  name?: string;
  role?: string;
  dept?: string;
  empId?: string;
  isAdmin?: boolean;
}) {
  const { s, lang, langName, toggleLang } = useLang();
  const [notif, setNotif] = useState(true);
  const rows = profileRows(lang);
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
      {/* Navy header */}
      <View style={{ backgroundColor: color.deepNavy, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 26, overflow: 'hidden' }}>
        <GlowCircle size={200} top={-70} right={-50} />
        <Txt w="bold" size={17} color={color.white} style={{ marginBottom: 18 }}>
          {s.prof.title}
        </Txt>
        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          <Avatar name={userName} size={72} ring="rgba(149,252,246,0.5)" />
          <View style={{ flex: 1 }}>
            <Txt w="extrabold" size={22} color={color.white}>
              {userName}
            </Txt>
            <Txt size={14} color="rgba(255,255,255,0.72)" style={{ marginTop: 2, marginBottom: 8 }}>
              {(role ?? s.prof.role) + ' · ' + (dept ?? s.prof.dept)}
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
                {s.prof.empId} · {empId ?? 'AII001'}
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

        {/* Admin view switcher — only for accounts with Admin access */}
        {isAdmin && (
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
        )}

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
            <Pressable onPress={() => setPwOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: color.line }}>
              <KeyRound size={20} color={color.anugrahBlue} strokeWidth={2} />
              <Txt w="semibold" size={14} color={color.ink} style={{ flex: 1 }}>
                {s.prof.changePw}
              </Txt>
              <ChevronRight size={18} color={color.muted} strokeWidth={2} />
            </Pressable>
            <Pressable onPress={onLogout} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15, paddingHorizontal: 18 }}>
              <LogOut size={20} color={color.danger} strokeWidth={2} />
              <Txt w="semibold" size={14} color={color.danger} style={{ flex: 1 }}>
                {s.prof.logout}
              </Txt>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Change-password modal */}
      <Modal visible={pwOpen} transparent animationType="fade" onRequestClose={closePw}>
        <View style={{ flex: 1, backgroundColor: 'rgba(14,17,22,0.45)', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
          <View style={{ width: '100%', maxWidth: 340, backgroundColor: color.white, borderRadius: 22, padding: 22 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Txt w="bold" size={16} color={color.ink}>
                {s.prof.changePw}
              </Txt>
              <Pressable onPress={closePw} hitSlop={10}>
                <X size={20} color={color.muted} strokeWidth={2} />
              </Pressable>
            </View>

            {pwDone ? (
              <View style={{ alignItems: 'center', paddingVertical: 12, gap: 12 }}>
                <CircleCheck size={40} color={color.success} strokeWidth={2} />
                <Txt size={14} color={color.ink} style={{ textAlign: 'center' }}>
                  {s.prof.pwSaved}
                </Txt>
                <Button variant="primary" size="md" fullWidth label={s.dlg.done} onPress={closePw} />
              </View>
            ) : (
              <View style={{ gap: 12 }}>
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
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function PwInput(props: React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 }}>
      <KeyRound size={18} color={color.anugrahBlue} strokeWidth={2} />
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
