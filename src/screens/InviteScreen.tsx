import React, { useEffect, useState } from 'react';
import { View, ScrollView, TextInput, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, Mail, BadgeCheck, Clock, ShieldCheck, Briefcase, Lock, Settings2, TriangleAlert, type LucideIcon } from 'lucide-react-native';
import { color, interFamily } from '../theme';
import { Txt, Button, TopAppBar, InfoBanner, Field, SelectField, ResultDialog, type SelectOption } from '../components';
import { useLang } from '../i18n/LangContext';
import { supabase } from '../lib/supabase';
import { fetchShifts, shiftLabel, type Shift } from '../lib/shifts';

export function InviteScreen({ onBack, onManageShifts }: { onBack?: () => void; onManageShifts?: () => void }) {
  const { s, lang } = useLang();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [access, setAccess] = useState('employee');
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [shiftId, setShiftId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetchShifts().then((list) => {
      setShifts(list);
      setShiftId((cur) => cur || list[0]?.id || '');
    });
  }, []);

  const accessOptions: SelectOption[] =
    lang === 'id'
      ? [
          { value: 'employee', label: 'Karyawan' },
          { value: 'admin', label: 'Admin' },
        ]
      : [
          { value: 'employee', label: 'Employee' },
          { value: 'admin', label: 'Admin' },
        ];

  const submit = async () => {
    if (busy) return;
    if (!name.trim() || !email.trim() || !password) {
      setError(s.adm.createFillReq);
      return;
    }
    setError(null);
    setBusy(true);
    const shiftSel = shifts.find((x) => x.id === shiftId);
    const { data, error: fnErr } = await supabase.functions.invoke('create-employee', {
      body: {
        email: email.trim(),
        password,
        full_name: name.trim(),
        job_role: jobRole.trim(),
        access_role: access,
        shift: shiftSel ? shiftLabel(shiftSel) : null,
      },
    });
    setBusy(false);
    if (fnErr || data?.error) {
      setError(data?.error || fnErr?.message || s.adm.createGeneric);
    } else {
      setDone(true);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
      <TopAppBar title={s.adm.invTitle} onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 22 + insets.bottom, gap: 16 }}>
        <InfoBanner text={s.adm.invHint} />

        <TextField label={s.adm.fName} icon={User} value={name} onChangeText={setName} placeholder={s.adm.fNamePh} autoCapitalize="words" />
        <TextField label={s.adm.fEmail} icon={Mail} value={email} onChangeText={setEmail} placeholder={s.adm.fEmailPh} keyboardType="email-address" autoCapitalize="none" autoComplete="off" />
        <TextField label={s.adm.fPassword} icon={Lock} value={password} onChangeText={setPassword} placeholder={s.adm.fPasswordPh} secureTextEntry autoCapitalize="none" autoComplete="off" />
        <Field label={s.adm.fId} value={s.adm.fIdV} icon={BadgeCheck} variant="readonly" />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <TextField label={s.adm.fJobRole} icon={Briefcase} value={jobRole} onChangeText={setJobRole} placeholder={s.adm.fJobRolePh} autoCapitalize="words" />
          </View>
          <View style={{ flex: 1 }}>
            <SelectField label={s.adm.fRole} value={access} options={accessOptions} onChange={setAccess} />
          </View>
        </View>

        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Txt w="semibold" size={13} color={color.muted}>
              {s.adm.fShift}
            </Txt>
            <Pressable onPress={onManageShifts} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Settings2 size={14} color={color.anugrahBlue} strokeWidth={2} />
              <Txt w="semibold" size={12} color={color.anugrahBlue}>
                {s.adm.manageShift}
              </Txt>
            </Pressable>
          </View>
          {shifts.length > 0 ? (
            <SelectField label="" value={shiftId} options={shifts.map((sh) => ({ value: sh.id, label: shiftLabel(sh) }))} onChange={setShiftId} icon={Clock} />
          ) : (
            <Field label="" value={s.adm.fShiftV} icon={Clock} variant="select" />
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={15} color={color.muted} strokeWidth={2} />
          <Txt size={12} color={color.muted}>
            {s.adm.invMethod}
          </Txt>
        </View>

        {error && (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <TriangleAlert size={16} color={color.danger} strokeWidth={2} style={{ marginTop: 1 }} />
            <Txt size={13} color={color.danger} style={{ flex: 1, lineHeight: 18 }}>
              {error}
            </Txt>
          </View>
        )}

        <Button variant="primary" size="lg" fullWidth label={busy ? s.adm.creating : s.adm.invSend} disabled={busy} onPress={submit} />
      </ScrollView>

      <ResultDialog
        visible={done}
        kind="success"
        title={s.adm.created}
        message={`${name} · ${email}`}
        actionLabel={s.dlg.done}
        onClose={() => {
          setDone(false);
          onBack?.();
        }}
      />
    </View>
  );
}

/** Controlled labelled text input (matches the Field look). */
function TextField({
  label,
  icon: Icon,
  ...props
}: { label: string; icon: LucideIcon } & React.ComponentProps<typeof TextInput>) {
  return (
    <View>
      <Txt w="semibold" size={13} color={color.muted} style={{ marginBottom: 8 }}>
        {label}
      </Txt>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: 12, padding: 14 }}>
        <Icon size={20} color={color.anugrahBlue} strokeWidth={2} />
        <TextInput
          placeholderTextColor={color.muted}
          style={{ flex: 1, fontFamily: interFamily('regular'), fontSize: 14, color: color.ink, padding: 0 }}
          {...props}
        />
      </View>
    </View>
  );
}

export default InviteScreen;
