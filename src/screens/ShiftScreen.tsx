import React, { useEffect, useState } from 'react';
import { View, ScrollView, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Pencil, Trash2, Clock, X } from 'lucide-react-native';
import { color, interFamily } from '../theme';
import { Txt, Button, TopAppBar } from '../components';
import { useLang } from '../i18n/LangContext';
import { fetchShifts, addShift, updateShift, deleteShift, type Shift } from '../lib/shifts';

export function ShiftScreen({ onBack }: { onBack?: () => void }) {
  const { s } = useLang();
  const insets = useSafeAreaInsets();
  const [shifts, setShifts] = useState<Shift[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => fetchShifts().then(setShifts);
  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setName('');
    setStart('');
    setEnd('');
    setShowForm(true);
  };
  const openEdit = (sh: Shift) => {
    setEditingId(sh.id);
    setName(sh.name);
    setStart(sh.start_time);
    setEnd(sh.end_time);
    setShowForm(true);
  };
  const save = async () => {
    if (!name.trim() || !start.trim() || !end.trim() || saving) return;
    setSaving(true);
    const payload = { name: name.trim(), start_time: start.trim(), end_time: end.trim() };
    const ok = editingId ? await updateShift(editingId, payload) : await addShift(payload);
    setSaving(false);
    if (ok) {
      setShowForm(false);
      await load();
    }
  };
  const remove = async (id: string) => {
    await deleteShift(id);
    await load();
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
      <TopAppBar title={s.adm.shiftTitle} onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 22 + insets.bottom, gap: 12 }}>
        {!showForm && (
          <Pressable
            onPress={openAdd}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: color.skyTint, borderRadius: 14, paddingVertical: 14 }}
          >
            <Plus size={18} color={color.anugrahBlue} strokeWidth={2.5} />
            <Txt w="semibold" size={14} color={color.anugrahBlue}>
              {s.adm.shiftAdd}
            </Txt>
          </Pressable>
        )}

        {showForm && (
          <View style={{ backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: 18, padding: 16, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Txt w="bold" size={14} color={color.ink}>
                {editingId ? s.adm.edit : s.adm.shiftAdd}
              </Txt>
              <Pressable onPress={() => setShowForm(false)} hitSlop={8}>
                <X size={18} color={color.muted} strokeWidth={2} />
              </Pressable>
            </View>
            <LabeledInput label={s.adm.shiftName} value={name} onChangeText={setName} placeholder={s.adm.shiftNamePh} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <LabeledInput label={s.adm.shiftStart} value={start} onChangeText={setStart} placeholder="08:30" />
              </View>
              <View style={{ flex: 1 }}>
                <LabeledInput label={s.adm.shiftEnd} value={end} onChangeText={setEnd} placeholder="17:30" />
              </View>
            </View>
            <Button variant="primary" size="md" fullWidth label={s.adm.shiftSave} disabled={saving} onPress={save} />
          </View>
        )}

        {shifts === null ? (
          <View style={{ paddingTop: 30, alignItems: 'center' }}>
            <ActivityIndicator color={color.anugrahBlue} />
          </View>
        ) : shifts.length === 0 && !showForm ? (
          <View style={{ paddingTop: 30, alignItems: 'center' }}>
            <Txt size={13} color={color.muted}>
              {s.adm.shiftEmpty}
            </Txt>
          </View>
        ) : (
          shifts.map((sh) => (
            <View key={sh.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: 16, paddingVertical: 13, paddingHorizontal: 14 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: color.skyTint, alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={20} color={color.anugrahBlue} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt w="semibold" size={14} color={color.ink}>
                  {sh.name}
                </Txt>
                <Txt size={12} color={color.muted} tabular>
                  {sh.start_time} – {sh.end_time}
                </Txt>
              </View>
              <Pressable onPress={() => openEdit(sh)} hitSlop={8} style={{ padding: 6 }}>
                <Pencil size={18} color={color.anugrahBlue} strokeWidth={2} />
              </Pressable>
              <Pressable onPress={() => remove(sh.id)} hitSlop={8} style={{ padding: 6 }}>
                <Trash2 size={18} color={color.danger} strokeWidth={2} />
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function LabeledInput({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View>
      <Txt w="semibold" size={13} color={color.muted} style={{ marginBottom: 8 }}>
        {label}
      </Txt>
      <TextInput
        placeholderTextColor={color.muted}
        style={{ fontFamily: interFamily('regular'), fontSize: 14, color: color.ink, backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 }}
        {...props}
      />
    </View>
  );
}

export default ShiftScreen;
