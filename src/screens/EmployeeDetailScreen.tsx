import React, { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Image, Pressable, TextInput } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Camera, X, Clock, KeyRound, CircleCheck, Eye, EyeOff, Sparkles, Copy, Check, CalendarClock } from 'lucide-react-native';
import { color, interFamily, space, radius } from '../theme';
import { Txt, Avatar, AdminStatusBadge, TopAppBar, SelectField, Button, Dialog } from '../components';
import { useLang } from '../i18n/LangContext';
import { fetchHistory, type HistoryEntry } from '../lib/attendance';
import { signedUrlsFor } from '../lib/storage';
import { fetchShifts, shiftLabel, type Shift } from '../lib/shifts';
import { setMemberShift, resetMemberPassword, type AdminMember } from '../lib/admin';
import { fetchLeaveBalance, setLeaveQuota, type LeaveBalance } from '../lib/leave';
import { parseYmd, weekdayShort, monthYear, dateStr } from '../lib/format';

export function EmployeeDetailScreen({ member, onBack }: { member: AdminMember; onBack?: () => void }) {
  const { s, lang } = useLang();
  const [rows, setRows] = useState<HistoryEntry[] | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [sel, setSel] = useState<HistoryEntry | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [shiftText, setShiftText] = useState<string | null>(member.shift);

  // Annual-leave quota
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [quotaDraft, setQuotaDraft] = useState('');
  const [quotaBusy, setQuotaBusy] = useState(false);
  const [quotaSaved, setQuotaSaved] = useState(false);

  // Reset-password modal
  const [rpOpen, setRpOpen] = useState(false);
  const [rpNew, setRpNew] = useState('');
  const [rpShow, setRpShow] = useState(false);
  const [rpBusy, setRpBusy] = useState(false);
  const [rpErr, setRpErr] = useState<string | null>(null);
  const [rpDone, setRpDone] = useState(false);
  const [rpSaved, setRpSaved] = useState(''); // the password that was set (shown on success)
  const [rpCopied, setRpCopied] = useState(false);

  const copyPw = async () => {
    await Clipboard.setStringAsync(rpSaved);
    setRpCopied(true);
  };

  const generatePw = () => {
    const pw = Math.random().toString(36).slice(2, 6) + Math.random().toString(36).slice(2, 6);
    setRpNew(pw);
    setRpShow(true);
    setRpErr(null);
  };
  const doReset = async () => {
    if (rpBusy) return;
    if (rpNew.length < 6) return setRpErr(s.prof.pwMin);
    setRpErr(null);
    setRpBusy(true);
    const err = await resetMemberPassword(member.id, rpNew);
    setRpBusy(false);
    if (err) return setRpErr(err);
    setRpSaved(rpNew);
    setRpDone(true);
    setRpNew('');
  };
  const closeReset = () => {
    setRpOpen(false);
    setRpErr(null);
    setRpDone(false);
    setRpNew('');
    setRpSaved('');
    setRpShow(false);
    setRpCopied(false);
  };

  useEffect(() => {
    fetchShifts().then(setShifts);
  }, []);

  useEffect(() => {
    fetchLeaveBalance(member.id).then((b) => {
      setBalance(b);
      setQuotaDraft(String(b.quota));
    });
  }, [member.id]);

  const saveQuota = async () => {
    const n = parseInt(quotaDraft, 10);
    if (Number.isNaN(n) || n < 0) return;
    setQuotaBusy(true);
    const ok = await setLeaveQuota(member.id, n);
    setQuotaBusy(false);
    if (ok) {
      setQuotaSaved(true);
      setBalance((b) => (b ? { ...b, quota: n, remaining: Math.max(0, n - b.taken) } : b));
      setTimeout(() => setQuotaSaved(false), 2000);
    }
  };

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
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xl, gap: space.md }}>
        {/* Employee header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.md, padding: space.lg }}>
          <Avatar name={member.name} size={54} />
          <View style={{ flex: 1 }}>
            <Txt w="bold" size={16} color={color.ink}>
              {member.name}
            </Txt>
            <Txt size={12} color={color.muted} tabular style={{ marginTop: space.xs }}>
              {member.dept} · {member.employeeId}
            </Txt>
            {!!member.email && (
              <Txt size={12} color={color.muted} numberOfLines={1} style={{ marginTop: space.xs }}>
                {member.email}
              </Txt>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm }}>
              <AdminStatusBadge status={member.st} />
              <Txt size={12} color={color.muted} tabular>
                {s.out.inAt} {member.in} · {s.out.outAt} {member.out}
              </Txt>
            </View>
          </View>
        </View>

        {/* Assign shift */}
        {shifts.length > 0 && (
          <View style={{ backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.md, padding: space.lg }}>
            <SelectField
              label={s.adm.fShift}
              value={currentShiftId}
              options={shifts.map((sh) => ({ value: sh.id, label: shiftLabel(sh) }))}
              onChange={onPickShift}
              icon={Clock}
            />
          </View>
        )}

        {/* Annual-leave quota */}
        {balance && (
          <View style={{ backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.md, padding: space.lg, gap: space.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
              <CalendarClock size={18} color={color.anugrahBlue} strokeWidth={2} />
              <Txt w="semibold" size={13} color={color.muted}>
                {s.adm.quotaTitle}
              </Txt>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, flex: 1, backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.sm, paddingHorizontal: space.md, paddingVertical: space.md }}>
                <TextInput
                  value={quotaDraft}
                  onChangeText={(t) => setQuotaDraft(t.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  style={{ flex: 1, fontFamily: interFamily('semibold'), fontSize: 16, color: color.ink, padding: 0 }}
                />
                <Txt size={12} color={color.muted}>
                  {s.adm.quotaUnit}
                </Txt>
              </View>
              <Button
                variant="primary"
                size="md"
                label={quotaSaved ? '✓' : s.adm.quotaSave}
                disabled={quotaBusy || quotaDraft === '' || parseInt(quotaDraft, 10) === balance.quota}
                onPress={saveQuota}
              />
            </View>
            <Txt size={12} color={color.muted} tabular>
              {s.home.taken}: {balance.taken} · {s.home.balance}: {balance.remaining} {s.leave.daysWork}
            </Txt>
          </View>
        )}

        {/* Reset password */}
        <Pressable
          onPress={() => setRpOpen(true)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.md, paddingVertical: space.md, paddingHorizontal: space.lg }}
        >
          <View style={{ width: 40, height: 40, borderRadius: radius.sm, backgroundColor: color.skyTint, alignItems: 'center', justifyContent: 'center' }}>
            <KeyRound size={20} color={color.anugrahBlue} strokeWidth={2} />
          </View>
          <Txt w="semibold" size={14} color={color.ink} style={{ flex: 1 }}>
            {s.adm.resetPw}
          </Txt>
        </Pressable>

        <Txt w="bold" size={14} color={color.ink} style={{ marginTop: space.xs }}>
          {s.adm.recentAtt}
        </Txt>

        {rows === null ? (
          <View style={{ paddingTop: space.xl, alignItems: 'center' }}>
            <ActivityIndicator color={color.anugrahBlue} />
          </View>
        ) : rows.length === 0 ? (
          <View style={{ paddingTop: space.xl, alignItems: 'center' }}>
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
                style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.md, padding: space.md }}
              >
                <View style={{ width: 44, height: 44, borderRadius: radius.sm, backgroundColor: color.skyTint, alignItems: 'center', justifyContent: 'center' }}>
                  <Txt w="semibold" size={11} color={color.muted} style={{ textTransform: 'uppercase' }}>
                    {weekdayShort(d, lang)}
                  </Txt>
                  <Txt w="extrabold" size={16} color={color.deepNavy} tabular>
                    {String(d.getDate()).padStart(2, '0')}
                  </Txt>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', gap: space.md }}>
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
                  <Txt size={12} color={color.muted} style={{ marginTop: space.xs }}>
                    {monthYear(d, lang)}
                  </Txt>
                </View>
                {hasPhoto &&
                  (thumb ? (
                    <Image source={{ uri: thumb }} style={{ width: 38, height: 38, borderRadius: radius.sm, backgroundColor: color.line }} />
                  ) : (
                    <View style={{ width: 38, height: 38, borderRadius: radius.sm, backgroundColor: color.skyTint, alignItems: 'center', justifyContent: 'center' }}>
                      <Camera size={16} color={color.anugrahBlue} strokeWidth={2} />
                    </View>
                  ))}
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* Reset-password modal */}
      <Dialog visible={rpOpen} onClose={closeReset} maxWidth={340}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm }}>
              <Txt w="bold" size={16} color={color.ink}>
                {s.adm.resetPw}
              </Txt>
              <Pressable onPress={closeReset} hitSlop={10}>
                <X size={20} color={color.muted} strokeWidth={2} />
              </Pressable>
            </View>
            <Txt size={12} color={color.muted} style={{ marginBottom: space.lg }}>
              {member.name}
            </Txt>

            {rpDone ? (
              <View style={{ alignItems: 'center', paddingVertical: space.md, gap: space.md }}>
                <CircleCheck size={40} color={color.success} strokeWidth={2} />
                <Txt size={14} color={color.ink} style={{ textAlign: 'center' }}>
                  {s.adm.resetPwDone}
                </Txt>
                <Txt size={12} color={color.muted} style={{ textAlign: 'center' }}>
                  {s.adm.resetPwShare}
                </Txt>
                <Pressable
                  onPress={copyPw}
                  style={{ alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: color.skyTint, borderRadius: radius.sm, paddingVertical: space.md, paddingHorizontal: space.lg }}
                >
                  <Txt w="bold" size={18} color={color.deepNavy} tabular>
                    {rpSaved}
                  </Txt>
                  {rpCopied ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
                      <Check size={16} color={color.success} strokeWidth={2.5} />
                      <Txt w="semibold" size={13} color={color.success}>
                        {s.adm.copied}
                      </Txt>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
                      <Copy size={16} color={color.anugrahBlue} strokeWidth={2} />
                      <Txt w="semibold" size={13} color={color.anugrahBlue}>
                        {s.adm.copy}
                      </Txt>
                    </View>
                  )}
                </Pressable>
                <Button variant="primary" size="md" fullWidth label={s.dlg.done} onPress={closeReset} />
              </View>
            ) : (
              <View style={{ gap: space.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.sm, paddingHorizontal: space.md, paddingVertical: space.md }}>
                  <KeyRound size={20} color={color.anugrahBlue} strokeWidth={2} />
                  <TextInput
                    value={rpNew}
                    onChangeText={setRpNew}
                    placeholder={s.prof.newPw}
                    placeholderTextColor={color.muted}
                    secureTextEntry={!rpShow}
                    autoCapitalize="none"
                    style={{ flex: 1, fontFamily: interFamily('regular'), fontSize: 14, color: color.ink, padding: 0 }}
                  />
                  <Pressable onPress={() => setRpShow((v) => !v)} hitSlop={8}>
                    {rpShow ? <EyeOff size={20} color={color.muted} strokeWidth={2} /> : <Eye size={20} color={color.muted} strokeWidth={2} />}
                  </Pressable>
                </View>
                <Pressable onPress={generatePw} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, alignSelf: 'flex-start' }}>
                  <Sparkles size={15} color={color.anugrahBlue} strokeWidth={2} />
                  <Txt w="semibold" size={13} color={color.anugrahBlue}>
                    {s.adm.genPw}
                  </Txt>
                </Pressable>
                {rpErr && (
                  <Txt size={12} color={color.danger} style={{ lineHeight: 17 }}>
                    {rpErr}
                  </Txt>
                )}
                <Button variant="primary" size="md" fullWidth label={s.prof.save} disabled={rpBusy} onPress={doReset} />
              </View>
            )}
        </View>
      </Dialog>

      {/* Photo viewer */}
      <Dialog visible={sel !== null} onClose={() => setSel(null)} tone="dark" maxWidth={420}>
        <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md }}>
              <View>
                <Txt w="bold" size={16} color={color.ink}>
                  {s.hist.photoTitle}
                </Txt>
                {sel && (
                  <Txt size={12} color={color.muted} style={{ marginTop: space.xs }}>
                    {dateStr(parseYmd(sel.date), lang)}
                  </Txt>
                )}
              </View>
              <Pressable onPress={() => setSel(null)} hitSlop={10} accessibilityLabel={s.hist.close}>
                <X size={22} color={color.muted} strokeWidth={2} />
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', gap: space.md }}>
              <PhotoCell label={s.out.inAt} time={sel?.clockInTime ?? null} uri={sel?.clockInPhoto ? urls[sel.clockInPhoto] : undefined} noPhoto={s.hist.noPhoto} />
              <PhotoCell label={s.out.outAt} time={sel?.clockOutTime ?? null} uri={sel?.clockOutPhoto ? urls[sel.clockOutPhoto] : undefined} noPhoto={s.hist.noPhoto} />
            </View>
        </View>
      </Dialog>
    </View>
  );
}

function PhotoCell({ label, time, uri, noPhoto }: { label: string; time: string | null; uri?: string; noPhoto: string }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm }}>
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
        <Image source={{ uri }} style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: radius.md, backgroundColor: color.line }} resizeMode="cover" />
      ) : (
        <View style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: radius.md, backgroundColor: color.paper, borderWidth: 1, borderColor: color.line, alignItems: 'center', justifyContent: 'center', gap: space.sm }}>
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
