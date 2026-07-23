import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, Mail, BadgeCheck, Clock, ShieldCheck } from 'lucide-react-native';
import { color } from '../theme';
import { Txt, Button, TopAppBar, InfoBanner, Field, SelectField, type SelectOption } from '../components';
import { useLang } from '../i18n/LangContext';

export function InviteScreen({ onBack }: { onBack?: () => void }) {
  const { s, lang } = useLang();
  const insets = useSafeAreaInsets();
  const [role, setRole] = useState('employee');

  const roleOptions: SelectOption[] =
    lang === 'id'
      ? [
          { value: 'employee', label: 'Karyawan' },
          { value: 'hr', label: 'HR' },
          { value: 'head', label: 'Kepala Departemen' },
          { value: 'owner', label: 'Owner' },
        ]
      : [
          { value: 'employee', label: 'Employee' },
          { value: 'hr', label: 'HR' },
          { value: 'head', label: 'Department Head' },
          { value: 'owner', label: 'Owner' },
        ];

  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
      <TopAppBar title={s.adm.invTitle} onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 22 + insets.bottom, gap: 16 }}>
        <InfoBanner text={s.adm.invHint} />

        <Field label={s.adm.fName} value={s.adm.fNameV} icon={User} variant="text" />
        <Field label={s.adm.fEmail} value={s.adm.fEmailV} icon={Mail} variant="text" />
        <Field label={s.adm.fId} value={s.adm.fIdV} icon={BadgeCheck} variant="readonly" />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Field label={s.adm.fDept} value={s.adm.fDeptV} variant="select" />
          </View>
          <View style={{ flex: 1 }}>
            <SelectField label={s.adm.fRole} value={role} options={roleOptions} onChange={setRole} />
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

export default InviteScreen;
