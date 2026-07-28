import React, { useEffect, useState } from 'react';
import { View, ScrollView, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trash2, PartyPopper } from 'lucide-react-native';
import { color, interFamily, space, radius } from '../theme';
import { Txt, Button, TopAppBar, DateField, Toast } from '../components';
import { useLang } from '../i18n/LangContext';
import { fetchHolidays, addHoliday, deleteHoliday, type Holiday } from '../lib/holidays';
import { rangeStr } from '../lib/format';

/** Admin screen to manage national holidays / company days off. */
export function HolidayScreen({ onBack }: { onBack?: () => void }) {
  const { s, lang } = useLang();
  const insets = useSafeAreaInsets();
  const [rows, setRows] = useState<Holiday[] | null>(null);
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = () => fetchHolidays().then(setRows);
  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (busy) return;
    if (!date || !name.trim()) {
      setToast(s.leave.toastRequired);
      return;
    }
    setBusy(true);
    const ok = await addHoliday(date, name.trim());
    setBusy(false);
    if (ok) {
      setDate('');
      setName('');
      load();
    }
  };

  const remove = async (d: string) => {
    await deleteHoliday(d);
    load();
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
      <TopAppBar title={s.adm.holidayTitle} onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: space.xl + insets.bottom }}>
        {/* Add form */}
        <View style={{ backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.md, padding: space.lg, gap: space.md }}>
          <Txt w="bold" size={14} color={color.ink}>
            {s.adm.holidayAdd}
          </Txt>
          <DateField label={s.adm.holidayDate} value={date} onChange={setDate} required />
          <View>
            <Txt w="semibold" size={12} color={color.muted} style={{ marginBottom: space.sm }}>
              {s.adm.holidayName}
              <Txt color={color.danger}> *</Txt>
            </Txt>
            <View style={{ backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.sm, paddingHorizontal: space.md, paddingVertical: space.md }}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={s.adm.holidayNamePh}
                placeholderTextColor={color.muted}
                style={{ fontFamily: interFamily('regular'), fontSize: 14, color: color.ink, padding: 0 }}
              />
            </View>
          </View>
          <Button label={busy ? s.leave.submitting : s.adm.holidayAddBtn} fullWidth disabled={busy} onPress={add} />
        </View>

        {/* List */}
        <Txt w="bold" size={14} color={color.ink}>
          {s.adm.holidayList}
        </Txt>
        {rows === null ? (
          <View style={{ paddingVertical: space.xl, alignItems: 'center' }}>
            <ActivityIndicator color={color.anugrahBlue} />
          </View>
        ) : rows.length === 0 ? (
          <Txt size={13} color={color.muted} style={{ textAlign: 'center', paddingVertical: space.lg }}>
            {s.adm.holidayEmpty}
          </Txt>
        ) : (
          <View style={{ gap: space.md }}>
            {rows.map((h) => (
              <View key={h.date} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.md, paddingVertical: space.md, paddingHorizontal: space.md }}>
                <View style={{ width: 40, height: 40, borderRadius: radius.sm, backgroundColor: color.humanTint, alignItems: 'center', justifyContent: 'center' }}>
                  <PartyPopper size={19} color={color.deepNavy} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt w="semibold" size={14} color={color.ink}>
                    {h.name}
                  </Txt>
                  <Txt size={12} color={color.muted} tabular style={{ marginTop: space.xs }}>
                    {rangeStr(h.date, h.date, lang)}
                  </Txt>
                </View>
                <Pressable onPress={() => remove(h.date)} hitSlop={8} accessibilityLabel={s.adm.del} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={18} color={color.danger} strokeWidth={2} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Toast message={toast} onHide={() => setToast(null)} tone="error" />
    </View>
  );
}

export default HolidayScreen;
