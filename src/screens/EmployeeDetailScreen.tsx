import React, { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Image, Pressable, Modal, TextInput } from 'react-native';
import { Camera, X, Clock, KeyRound, CircleCheck } from 'lucide-react-native';
import { color, interFamily } from '../theme';
import { Txt, Avatar, AdminStatusBadge, TopAppBar, SelectField, Button } from '../components';
import { useLang } from '../i18n/LangContext';
import { fetchHistory, type HistoryEntry } from '../lib/attendance';
import { signedUrlsFor } from '../lib/storage';
import { fetchShifts, shiftLabel, type Shift } from '../lib/shifts';
import { setMemberShift, resetMemberPassword, type AdminMember } from '../lib/admin';
import { parseYmd, weekdayShort, monthYear, dateStr } from '../lib/format';

export function EmployeeDetailScreen({ member, onBack }: { member: AdminMember; onBack?: () => void }) {
  const { s, lang } = useLang();
  const [rows, setRows] = useState<HistoryEntry[] | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [sel, setSel] = useState<HistoryEntry | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [shiftText, setShiftText] = useState<string | null>(member.shift);

  // Reset-password modal
  const [rpOpen, setRpOpen] = useState(false);
  const [rpNew, setRpNew] = useState('');
  const [rpConfirm, setRpConfirm] = useState('');
  const [rpBusy, setRpBusy] = useState(false);
  const [rpErr, setRpErr] = useState<string | null>(null);
  const [rpDone, setRpDone] = useState(false);

  const doReset = async () => {
    if (rpBusy) return;
    if (rpNew.length < 6) return setRpErr(s.prof.pwMin);
    if (rpNew !== rpConfirm) return setRpErr(s.prof.pwMismatch);
    setRpErr(null);
    setRpBusy(true);
    const err = await resetMemberPassword(member.id, rpNew);
    setRpBusy(false);
    if (err) return setRpErr(err);
    setRpDone(true);
    setRpNew('');
    setRpConfirm('');
  };
  const closeReset = () => {
    setRpOpen(false);
    setRpErr(null);
    setRpDone(false);
    setRpNew('');
    setRpConfirm('');
  };

  useEffect(() => {
    fetchShifts().then(setShifts);
  }, []);

  const onPickShift = (id: string) => {
    const sh = shifts.find((x) => x.id === id);
    if (!sh) return;
    const label = shiftLabel(sh);
    setShiftText(label); // optimistic
    setMemberShift(member.id, label);
  };
  const currentShiftId = shifts.find((sh) => shiftLabel(sh) === shiftText)?.id ?? '';

  useEffect(() => {
    let alive = true;
    fetchHistory(member.id).then(async (r) => {
      if (!alive) return;
      setRows(r);
      const paths = r.flatMap((e) => [e.clockInPhoto, e.clockOutPhoto]).filter((p): p is string => !!p);
      if (paths.length) {
        const map = await signedUrlsFor(paths);
        if (alive) setUrls(map);
      }
    });
    return () => {
      alive = false;
    };
  }, [member.id]);

  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
      <TopAppBar title={member.name} onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 24, gap: 14 }}>
        {/* Employee header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: 18, padding: 16 }}>
          <Avatar name={member.name} size={54} />
          <View style={{ flex: 1 }}>
            <Txt w="bold" size={16} color={color.ink}>
              {member.name}
            </Txt>
            <Txt size={12} color={color.muted} tabular style={{ marginTop: 2 }}>
              {member.dept} · {member.employeeId}
            </Txt>
            {!!member.email && (
              <Txt size={12} color={color.muted} numberOfLines={1} style={{ marginTop: 1 }}>
                {member.email}
              </Txt>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <AdminStatusBadge status={member.st} />
              <Txt size={12} color={color.muted} tabular>
                {s.out.inAt} {member.in} · {s.out.outAt} {member.out}
              </Txt>
            </View>
          </View>
        </View>

        {/* Assign shift */}
        {shifts.length > 0 && (
          <View style={{ backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: 18, padding: 16 }}>
            <SelectField
              label={s.adm.fShift}
              value={currentShiftId}
              options={shifts.map((sh) => ({ value: sh.id, label: shiftLabel(sh) }))}
              onChange={onPickShift}
              icon={Clock}
            />
          </View>
        )}

        {/* Reset password */}
        <Pressable
          onPress={() => setRpOpen(true)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16 }}
        >
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: color.skyTint, alignItems: 'center', justifyContent: 'center' }}>
            <KeyRound size={20} color={color.anugrahBlue} strokeWidth={2} />
          </View>
          <Txt w="semibold" size={14} color={color.ink} style={{ flex: 1 }}>
            {s.adm.resetPw}
          </Txt>
        </Pressable>

        <Txt w="bold" size={14} color={color.ink} style={{ marginTop: 4 }}>
          {s.adm.recentAtt}
        </Txt>

        {rows === null ? (
          <View style={{ paddingTop: 24, alignItems: 'center' }}>
            <ActivityIndicator color={color.anugrahBlue} />
          </View>
        ) : rows.length === 0 ? (
          <View style={{ paddingTop: 24, alignItems: 'center' }}>
            <Txt size={13} color={color.muted}>
              {s.adm.noAtt}
            </Txt>
          </View>
        ) : (
          rows.map((r) => {
            const d = parseYmd(r.date);
            const thumb = r.clockInPhoto ? urls[r.clockInPhoto] : undefined;
            const hasPhoto = !!(r.clockInPhoto || r.clockOutPhoto);
            return (
              <Pressable
                key={r.date}
                onPress={hasPhoto ? () => setSel(r) : undefined}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: 16, padding: 14 }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: color.skyTint, alignItems: 'center', justifyContent: 'center' }}>
                  <Txt w="semibold" size={11} color={color.muted} style={{ textTransform: 'uppercase' }}>
                    {weekdayShort(d, lang)}
                  </Txt>
                  <Txt w="extrabold" size={16} color={color.deepNavy} tabular>
                    {String(d.getDate()).padStart(2, '0')}
                  </Txt>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', gap: 14 }}>
                    <Txt size={14} color={color.ink} tabular>
                      <Txt size={12} color={color.muted}>
                        {s.out.inAt}{'  '}
                      </Txt>
                      {r.clockInTime ?? '—'}
                    </Txt>
                    <Txt size={14} color={color.ink} tabular>
                      <Txt size={12} color={color.muted}>
                        {s.out.outAt}{'  '}
                      </Txt>
                      {r.clockOutTime ?? '—'}
                    </Txt>
                  </View>
                  <Txt size={12} color={color.muted} style={{ marginTop: 3 }}>
                    {monthYear(d, lang)}
                  </Txt>
                </View>
                {hasPhoto &&
                  (thumb ? (
                    <Image source={{ uri: thumb }} style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: color.line }} />
                  ) : (
                    <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: color.skyTint, alignItems: 'center', justifyContent: 'center' }}>
                      <Camera size={16} color={color.anugrahBlue} strokeWidth={2} />
                    </View>
                  ))}
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* Reset-password modal */}
      <Modal visible={rpOpen} transparent animationType="fade" onRequestClose={closeReset}>
        <View style={{ flex: 1, backgroundColor: 'rgba(14,17,22,0.45)', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
          <View style={{ width: '100%', maxWidth: 340, backgroundColor: color.white, borderRadius: 22, padding: 22 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <Txt w="bold" size={16} color={color.ink}>
                {s.adm.resetPw}
              </Txt>
              <Pressable onPress={closeReset} hitSlop={10}>
                <X size={20} color={color.muted} strokeWidth={2} />
              </Pressable>
            </View>
            <Txt size={12} color={color.muted} style={{ marginBottom: 16 }}>
              {member.name}
            </Txt>

            {rpDone ? (
              <View style={{ alignItems: 'center', paddingVertical: 12, gap: 12 }}>
                <CircleCheck size={40} color={color.success} strokeWidth={2} />
                <Txt size={14} color={color.ink} style={{ textAlign: 'center' }}>
                  {s.adm.resetPwDone}
                </Txt>
                <Button variant="primary" size="md" fullWidth label={s.dlg.done} onPress={closeReset} />
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                <RpInput placeholder={s.prof.newPw} value={rpNew} onChangeText={setRpNew} />
                <RpInput placeholder={s.prof.confirmPw} value={rpConfirm} onChangeText={setRpConfirm} />
                {rpErr && (
                  <Txt size={12} color={color.danger} style={{ lineHeight: 17 }}>
                    {rpErr}
                  </Txt>
                )}
                <Button variant="primary" size="md" fullWidth label={s.prof.save} disabled={rpBusy} onPress={doReset} />
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Photo viewer */}
      <Modal visible={sel !== null} transparent animationType="fade" onRequestClose={() => setSel(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(10,17,40,0.82)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: color.white, borderRadius: 24, padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <View>
                <Txt w="bold" size={16} color={color.ink}>
                  {s.hist.photoTitle}
                </Txt>
                {sel && (
                  <Txt size={12} color={color.muted} style={{ marginTop: 2 }}>
                    {dateStr(parseYmd(sel.date), lang)}
                  </Txt>
                )}
              </View>
              <Pressable onPress={() => setSel(null)} hitSlop={10} accessibilityLabel={s.hist.close}>
                <X size={22} color={color.muted} strokeWidth={2} />
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <PhotoCell label={s.out.inAt} time={sel?.clockInTime ?? null} uri={sel?.clockInPhoto ? urls[sel.clockInPhoto] : undefined} noPhoto={s.hist.noPhoto} />
              <PhotoCell label={s.out.outAt} time={sel?.clockOutTime ?? null} uri={sel?.clockOutPhoto ? urls[sel.clockOutPhoto] : undefined} noPhoto={s.hist.noPhoto} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function RpInput(props: React.ComponentProps<typeof TextInput>) {
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

function PhotoCell({ label, time, uri, noPhoto }: { label: string; time: string | null; uri?: string; noPhoto: string }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <Txt w="semibold" size={12} color={color.muted}>
          {label}
        </Txt>
        {time && (
          <Txt w="semibold" size={12} color={color.ink} tabular>
            {time}
          </Txt>
        )}
      </View>
      {uri ? (
        <Image source={{ uri }} style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: 14, backgroundColor: color.line }} resizeMode="cover" />
      ) : (
        <View style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: 14, backgroundColor: color.paper, borderWidth: 1, borderColor: color.line, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Camera size={22} color={color.muted} strokeWidth={2} />
          <Txt size={11} color={color.muted}>
            {noPhoto}
          </Txt>
        </View>
      )}
    </View>
  );
}

export default EmployeeDetailScreen;
