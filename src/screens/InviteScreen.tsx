import React, { useState } from 'react';
import { View, ScrollView, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, Mail, BadgeCheck, Clock, ShieldCheck, Briefcase, type LucideIcon } from 'lucide-react-native';
import { color, interFamily } from '../theme';
import { Txt, Button, TopAppBar, InfoBanner, Field, SelectField, type SelectOption } from '../components';
import { useLang } from '../i18n/LangContext';

export function InviteScreen({ onBack }: { onBack?: () => void }) {
  const { s, lang } = useLang();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [access, setAccess] = useState('employee');

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

  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
      <TopAppBar title={s.adm.invTitle} onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 22 + insets.bottom, gap: 16 }}>
        <InfoBanner text={s.adm.invHint} />

        <TextField label={s.adm.fName} icon={User} value={name} onChangeText={setName} placeholder={s.adm.fNamePh} autoCapitalize="words" />
        <TextField label={s.adm.fEmail} icon={Mail} value={email} onChangeText={setEmail} placeholder={s.adm.fEmailPh} keyboardType="email-address" autoCapitalize="none" />
        <Field label={s.adm.fId} value={s.adm.fIdV} icon={BadgeCheck} variant="readonly" />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <TextField label={s.adm.fJobRole} icon={Briefcase} value={jobRole} onChangeText={setJobRole} placeholder={s.adm.fJobRolePh} autoCapitalize="words" />
          </View>
          <View style={{ flex: 1 }}>
            <SelectField label={s.adm.fRole} value={access} options={accessOptions} onChange={setAccess} />
          </View>
        </View>

        <Field label={s.adm.fShift} value={s.adm.fShiftV} icon={Clock} variant="select" />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={15} color={color.muted} strokeWidth={2} />
          <Txt size={12} color={color.muted}>
            {s.adm.invMethod}
          </Txt>
        </View>

        <Button variant="primary" size="lg" fullWidth label={s.adm.invSend} onPress={onBack} />
      </ScrollView>
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
