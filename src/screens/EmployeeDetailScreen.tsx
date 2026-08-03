import React, { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Image, Pressable, TextInput } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Camera, X, KeyRound, CircleCheck, Eye, EyeOff, Sparkles, Copy, Check, CalendarClock, ChartColumnBig, Cake, Briefcase, ShieldCheck, AlertTriangle, CalendarCheck, Pencil, Plus, Globe, Trash2 } from 'lucide-react-native';
import { color, interFamily, space, radius } from '../theme';
import { Txt, Avatar, AdminStatusBadge, Badge, TopAppBar, SelectField, Button, Dialog, Stepper, DateField, TimeField, Toggle } from '../components';
import { useLang } from '../i18n/LangContext';
import { useAuth } from '../auth/AuthContext';
import { fetchHistory, saveAttendanceCorrection, deleteAttendanceDay, type HistoryEntry } from '../lib/attendance';
import { signedUrlsFor } from '../lib/storage';
import { resetMemberPassword, setExcludeFromStats, setMemberGeofenceExempt, setMemberBirthDate, setMemberDept, setMemberRole, deleteEmployee, type AdminMember } from '../lib/admin';
import { fetchLeaveBalance, setLeaveJoinDate, setLeaveQuotaAdjust, type LeaveBalance } from '../lib/leave';
import { fetchEmployeeMonthStats, type EmployeeMonthStats } from '../lib/reports';
import { parseYmd, weekdayShort, monthYear, dateStr, rangeStr } from '../lib/format';

export function EmployeeDetailScreen({ member, onBack }: { member: AdminMember; onBack?: () => void }) {
  const { s, lang } = useLang();
  const { session } = useAuth();
  const isSelf = session?.user.id === member.id;
  const [rows, setRows] = useState<HistoryEntry[] | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [sel, setSel] = useState<HistoryEntry | null>(null);
  const [excluded, setExcluded] = useState(member.excludeFromStats);

  // Reload key — bumped after an admin correction to refresh the list + stats.
  const [refresh, setRefresh] = useState(0);

  // Attendance this month (present / working days since join)
  const [att, setAtt] = useState<EmployeeMonthStats | null>(null);
  useEffect(() => {
    let alive = true;
    fetchEmployeeMonthStats(member.id).then((r) => alive && setAtt(r));
    return () => {
      alive = false;
    };
  }, [member.id, refresh]);

  // Attendance correction (admin edits another employee's day)
  type Corr = { workDate: string; clockIn: string; clockOut: string; note: string; isNew: boolean };
  const [corr, setCorr] = useState<Corr | null>(null);
  const [corrBusy, setCorrBusy] = useState(false);
  const [corrErr, setCorrErr] = useState<string | null>(null);
  const [corrDelOpen, setCorrDelOpen] = useState(false);
  const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;
  const todayIso = new Date().toISOString().slice(0, 10);

  const openAddCorr = () => {
    setCorrErr(null);
    setCorr({ workDate: todayIso, clockIn: '', clockOut: '', note: '', isNew: true });
  };
  const openEditCorr = (r: HistoryEntry) => {
    setCorrErr(null);
    setCorr({ workDate: r.date, clockIn: r.clockInTime ?? '', clockOut: r.clockOutTime ?? '', note: '', isNew: false });
  };
  const timeToISO = (workDate: string, t: string): string | null => {
    if (!t) return null;
    const [h, m] = t.split(':').map(Number);
    const [y, mo, dd] = workDate.split('-').map(Number);
    return new Date(y, mo - 1, dd, h, m).toISOString();
  };
  const saveCorr = async () => {
    if (!corr || corrBusy) return;
    if ((corr.clockIn && !timeRe.test(corr.clockIn)) || (corr.clockOut && !timeRe.test(corr.clockOut))) {
      return setCorrErr(s.adm.corrTimeErr);
    }
    setCorrErr(null);
    setCorrBusy(true);
    const err = await saveAttendanceCorrection({
      userId: member.id,
      workDate: corr.workDate,
      clockInAt: timeToISO(corr.workDate, corr.clockIn),
      clockOutAt: timeToISO(corr.workDate, corr.clockOut),
      correctedBy: session?.user.id ?? '',
      note: corr.note.trim() || null,
    });
    setCorrBusy(false);
    if (err) {
      setCorrErr(err);
      return;
    }
    setCorr(null);
    setRefresh((x) => x + 1);
  };
  const doDeleteCorr = async () => {
    if (!corr || corrBusy) return;
    setCorrBusy(true);
    const err = await deleteAttendanceDay(member.id, corr.workDate);
    setCorrBusy(false);
    setCorrDelOpen(false);
    if (err) {
      setCorrErr(err);
      return;
    }
    setCorr(null);
    setRefresh((x) => x + 1);
  };

  // Job title (profiles.department) — editable
  const [dept, setDept] = useState(member.dept);
  const [deptDraft, setDeptDraft] = useState(member.dept === '—' ? '' : member.dept);
  const [deptBusy, setDeptBusy] = useState(false);
  const [deptSaved, setDeptSaved] = useState(false);

  const saveDept = async () => {
    if (deptBusy || !deptDraft.trim()) return;
    setDeptBusy(true);
    const ok = await setMemberDept(member.id, deptDraft.trim());
    setDeptBusy(false);
    if (ok) {
      setDept(deptDraft.trim());
      setDeptSaved(true);
      setTimeout(() => setDeptSaved(false), 2000);
    }
  };

  // Access role (profiles.role) — editable
  const [role, setRole] = useState(member.role);
  const accessOptions =
    lang === 'id'
      ? [
          { value: 'employee', label: 'Karyawan' },
          { value: 'admin', label: 'Admin' },
        ]
      : [
          { value: 'employee', label: 'Employee' },
          { value: 'admin', label: 'Admin' },
        ];
  const [pendingRole, setPendingRole] = useState<'employee' | 'admin' | null>(null);
  const onPickRole = (v: string) => {
    const r = v as 'employee' | 'admin';
    if (r !== role) setPendingRole(r); // confirm before applying
  };
  const confirmRole = () => {
    if (!pendingRole) return;
    setRole(pendingRole); // optimistic
    setMemberRole(member.id, pendingRole);
    setPendingRole(null);
  };
  const pendingRoleLabel = accessOptions.find((o) => o.value === pendingRole)?.label ?? '';

  const [geoExempt, setGeoExempt] = useState(member.geofenceExempt);
  const toggleGeo = (on: boolean) => {
    setGeoExempt(on); // optimistic
    setMemberGeofenceExempt(member.id, on);
  };

  const toggleStats = (countIn: boolean) => {
    setExcluded(!countIn); // optimistic
    setExcludeFromStats(member.id, !countIn);
  };

  // Date of birth (editable)
  const [birthDate, setBirthDate] = useState<string | null>(member.birthDate);
  const [birthDraft, setBirthDraft] = useState(member.birthDate ?? '');
  const [birthBusy, setBirthBusy] = useState(false);
  const [birthSaved, setBirthSaved] = useState(false);

  const saveBirth = async () => {
    if (birthBusy) return;
    setBirthBusy(true);
    const ok = await setMemberBirthDate(member.id, birthDraft);
    setBirthBusy(false);
    if (ok) {
      setBirthDate(birthDraft || null);
      setBirthSaved(true);
      setTimeout(() => setBirthSaved(false), 2000);
    }
  };

  // Annual-leave quota (accrual + manual adjustment)
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [joinDraft, setJoinDraft] = useState('');
  const [adjustVal, setAdjustVal] = useState(0);
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

  // Delete-account modal (type the employee id to confirm — irreversible)
  const [delOpen, setDelOpen] = useState(false);
  const [delConfirm, setDelConfirm] = useState('');
  const [delBusy, setDelBusy] = useState(false);
  const [delErr, setDelErr] = useState<string | null>(null);

  const closeDelete = () => {
    setDelOpen(false);
    setDelConfirm('');
    setDelErr(null);
  };
  const doDelete = async () => {
    if (delBusy || delConfirm.trim() !== member.employeeId) return;
    setDelErr(null);
    setDelBusy(true);
    const err = await deleteEmployee(member.id);
    setDelBusy(false);
    if (err) return setDelErr(err);
    closeDelete();
    onBack?.(); // back to the directory, which refetches on mount
  };

  const loadBalance = async () => {
    const b = await fetchLeaveBalance(member.id);
    setBalance(b);
    setJoinDraft(b.joinDate ?? '');
    setAdjustVal(0); // the stepper is a delta to add/subtract, not the absolute value
  };

  useEffect(() => {
    loadBalance();
  }, [member.id]);

  const isValidISO = (v: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
    const [y, m, d] = v.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  };

  const flashSaved = () => {
    setQuotaSaved(true);
    setTimeout(() => setQuotaSaved(false), 2000);
  };

  const saveJoinDate = async () => {
    if (!isValidISO(joinDraft) || quotaBusy) return;
    setQuotaBusy(true);
    const ok = await setLeaveJoinDate(member.id, joinDraft);
    if (ok) await loadBalance();
    setQuotaBusy(false);
    if (ok) flashSaved();
  };

  const saveAdjust = async () => {
    if (quotaBusy || !balance || adjustVal === 0) return;
    setQuotaBusy(true);
    // Add the delta to the current adjustment (not replace it), then reset to 0.
    const ok = await setLeaveQuotaAdjust(member.id, balance.adjust + adjustVal);
    if (ok) await loadBalance();
    setQuotaBusy(false);
    if (ok) flashSaved();
  };

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
  }, [member.id, refresh]);

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
              {dept} · {member.employeeId}
            </Txt>
            {!!member.email && (
              <Txt size={12} color={color.muted} numberOfLines={1} style={{ marginTop: space.xs }}>
                {member.email}
              </Txt>
            )}
            {!!birthDate && (
              <Txt size={12} color={color.muted} tabular style={{ marginTop: space.xs }}>
                {s.adm.fBirth}: {rangeStr(birthDate, birthDate, lang)}
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

        {/* Attendance this month */}
        <View style={{ backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.md, padding: space.lg, gap: space.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <CalendarCheck size={18} color={color.anugrahBlue} strokeWidth={2} />
            <Txt w="semibold" size={13} color={color.muted} style={{ flex: 1 }}>
              {s.adm.attendanceTitle}
            </Txt>
          </View>
          {att === null ? (
            <ActivityIndicator color={color.anugrahBlue} />
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.sm }}>
                <Txt w="extrabold" size={34} color={color.anugrahBlue} tabular style={{ letterSpacing: -0.5 }}>
                  {att.rate}%
                </Txt>
                <Txt size={12} color={color.muted} tabular style={{ marginBottom: space.xs }}>
                  {att.present}/{att.workingDays} {s.adm.workDaysUnit}
                </Txt>
              </View>
              <View style={{ flexDirection: 'row', backgroundColor: color.paper, borderRadius: radius.sm, paddingVertical: space.md }}>
                {(
                  [
                    [s.adm.iOnTime, att.onTime, color.success],
                    [s.adm.iLate, att.late, color.danger],
                    [s.adm.iAbsent, att.absent, color.muted],
                  ] as const
                ).map(([label, value, hex], i) => (
                  <View key={label} style={{ flex: 1, alignItems: 'center', borderLeftWidth: i === 0 ? 0 : 1, borderLeftColor: color.line }}>
                    <Txt w="extrabold" size={18} color={hex} tabular>
                      {value}
                    </Txt>
                    <Txt size={11} color={color.muted} style={{ marginTop: 2, textAlign: 'center' }}>
                      {label}
                    </Txt>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>


        {/* Job title (position) */}
        <View style={{ backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.md, padding: space.lg, gap: space.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <Briefcase size={18} color={color.anugrahBlue} strokeWidth={2} />
            <Txt w="semibold" size={13} color={color.muted} style={{ flex: 1 }}>
              {s.adm.fJobRole}
            </Txt>
            {deptSaved && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
                <Check size={15} color={color.success} strokeWidth={2.5} />
                <Txt w="semibold" size={12} color={color.success}>
                  {s.adm.saved}
                </Txt>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.sm, paddingHorizontal: space.md, paddingVertical: space.md }}>
              <TextInput
                value={deptDraft}
                onChangeText={setDeptDraft}
                placeholder={s.adm.fJobRolePh}
                placeholderTextColor={color.muted}
                autoCapitalize="words"
                style={{ flex: 1, fontFamily: interFamily('regular'), fontSize: 14, color: color.ink, padding: 0 }}
              />
            </View>
            <Button
              variant="secondary"
              size="md"
              label={s.prof.save}
              disabled={deptBusy || !deptDraft.trim() || deptDraft.trim() === (dept === '—' ? '' : dept)}
              onPress={saveDept}
            />
          </View>
        </View>

        {/* Access role */}
        <View style={{ backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.md, padding: space.lg }}>
          <SelectField
            label={s.adm.fRole}
            value={role}
            options={accessOptions}
            onChange={onPickRole}
            icon={ShieldCheck}
          />
        </View>

        {/* Date of birth */}
        <View style={{ backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.md, padding: space.lg, gap: space.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <Cake size={18} color={color.anugrahBlue} strokeWidth={2} />
            <Txt w="semibold" size={13} color={color.muted} style={{ flex: 1 }}>
              {s.adm.fBirth}
            </Txt>
            {birthSaved && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
                <Check size={15} color={color.success} strokeWidth={2.5} />
                <Txt w="semibold" size={12} color={color.success}>
                  {s.adm.saved}
                </Txt>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <DateField value={birthDraft} onChange={setBirthDraft} max={new Date().toISOString().slice(0, 10)} />
            </View>
            <Button
              variant="secondary"
              size="md"
              label={s.prof.save}
              disabled={birthBusy || birthDraft === (birthDate ?? '')}
              onPress={saveBirth}
            />
          </View>
        </View>

        {/* Annual-leave quota (accrual + manual adjustment) */}
        {balance && (
          <View style={{ backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.md, padding: space.lg, gap: space.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
              <CalendarClock size={18} color={color.anugrahBlue} strokeWidth={2} />
              <Txt w="semibold" size={13} color={color.muted} style={{ flex: 1 }}>
                {s.adm.quotaTitle}
              </Txt>
              {quotaSaved && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
                  <Check size={15} color={color.success} strokeWidth={2.5} />
                  <Txt w="semibold" size={12} color={color.success}>
                    {s.adm.saved}
                  </Txt>
                </View>
              )}
            </View>

            {/* Join date */}
            <View>
              <Txt w="semibold" size={12} color={color.muted} style={{ marginBottom: space.sm }}>
                {s.adm.joinDate}
              </Txt>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <DateField value={joinDraft} onChange={setJoinDraft} />
                </View>
                <Button
                  variant="secondary"
                  size="md"
                  label={s.prof.save}
                  disabled={quotaBusy || !isValidISO(joinDraft) || joinDraft === (balance.joinDate ?? '')}
                  onPress={saveJoinDate}
                />
              </View>
            </View>

            {/* Breakdown */}
            <View style={{ flexDirection: 'row', backgroundColor: color.paper, borderRadius: radius.sm, paddingVertical: space.md }}>
              {(
                [
                  [s.home.entitle, balance.quota, color.ink],
                  [s.adm.carryOver, balance.carryOver, color.deepNavy],
                  [s.home.taken, balance.taken, color.warning],
                  [s.home.balance, balance.remaining, color.success],
                ] as const
              ).map(([label, value, hex], i) => (
                <View key={label} style={{ flex: 1, alignItems: 'center', borderLeftWidth: i === 0 ? 0 : 1, borderLeftColor: color.line }}>
                  <Txt w="extrabold" size={18} color={hex} tabular>
                    {value}
                  </Txt>
                  <Txt size={11} color={color.muted} style={{ marginTop: 2, textAlign: 'center' }}>
                    {label}
                  </Txt>
                </View>
              ))}
            </View>

            {/* Manual adjustment — a delta added to the current adjustment */}
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm }}>
                <Txt w="semibold" size={12} color={color.muted}>
                  {s.adm.adjustLabel}
                </Txt>
                <Txt size={12} color={color.muted} tabular>
                  {s.adm.adjustCurrent}: {balance.adjust > 0 ? `+${balance.adjust}` : balance.adjust} {s.adm.adjustUnit}
                </Txt>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md }}>
                <Stepper value={adjustVal} onChange={setAdjustVal} min={-30} max={30} step={1} units={s.adm.adjustUnit} signed />
                <Button
                  variant="secondary"
                  size="md"
                  label={s.prof.save}
                  disabled={quotaBusy || adjustVal === 0}
                  onPress={saveAdjust}
                />
              </View>
            </View>

            <Txt size={11} color={color.muted} style={{ lineHeight: 16 }}>
              {s.adm.accrualNote}
            </Txt>
          </View>
        )}

        {/* Count in statistics */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.md, paddingVertical: space.md, paddingHorizontal: space.lg }}>
          <View style={{ width: 40, height: 40, borderRadius: radius.sm, backgroundColor: color.skyTint, alignItems: 'center', justifyContent: 'center' }}>
            <ChartColumnBig size={20} color={color.anugrahBlue} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt w="semibold" size={14} color={color.ink}>
              {s.adm.inStatsLabel}
            </Txt>
            <Txt size={12} color={color.muted} style={{ marginTop: 2, lineHeight: 16 }}>
              {s.adm.inStatsHint}
            </Txt>
          </View>
          <Toggle on={!excluded} onChange={toggleStats} label={s.adm.inStatsLabel} />
        </View>

        {/* Clock in from anywhere (geofence exemption) */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.md, paddingVertical: space.md, paddingHorizontal: space.lg }}>
          <View style={{ width: 40, height: 40, borderRadius: radius.sm, backgroundColor: color.skyTint, alignItems: 'center', justifyContent: 'center' }}>
            <Globe size={20} color={color.anugrahBlue} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt w="semibold" size={14} color={color.ink}>
              {s.adm.geoLabel}
            </Txt>
            <Txt size={12} color={color.muted} style={{ marginTop: 2, lineHeight: 16 }}>
              {s.adm.geoHint}
            </Txt>
          </View>
          <Toggle on={geoExempt} onChange={toggleGeo} label={s.adm.geoLabel} />
        </View>

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

        {/* Delete account (destructive) — hidden on your own record */}
        {!isSelf && (
          <Pressable
            onPress={() => setDelOpen(true)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: color.white, borderWidth: 1, borderColor: color.dangerBg, borderRadius: radius.md, paddingVertical: space.md, paddingHorizontal: space.lg }}
          >
            <View style={{ width: 40, height: 40, borderRadius: radius.sm, backgroundColor: color.dangerBg, alignItems: 'center', justifyContent: 'center' }}>
              <Trash2 size={20} color={color.danger} strokeWidth={2} />
            </View>
            <Txt w="semibold" size={14} color={color.danger} style={{ flex: 1 }}>
              {s.adm.delAcct}
            </Txt>
          </Pressable>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.xs }}>
          <Txt w="bold" size={14} color={color.ink}>
            {s.adm.recentAtt}
          </Txt>
          <Pressable onPress={openAddCorr} style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingVertical: space.xs, paddingHorizontal: space.md, borderRadius: radius.pill, backgroundColor: color.skyTint }}>
            <Plus size={15} color={color.anugrahBlue} strokeWidth={2.5} />
            <Txt w="semibold" size={12} color={color.anugrahBlue}>
              {s.adm.corrAdd}
            </Txt>
          </Pressable>
        </View>

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
            // Only one of clock-in / clock-out on a past day (incomplete record).
            const incomplete = !!(!!r.clockInTime !== !!r.clockOutTime && r.date < todayIso);
            return (
              <View
                key={r.date}
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
                <Pressable disabled={!hasPhoto} onPress={hasPhoto ? () => setSel(r) : undefined} style={{ flex: 1 }}>
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.xs }}>
                    <Txt size={12} color={color.muted}>
                      {monthYear(d, lang)}
                    </Txt>
                    {r.correctedBy && <Badge tone="warning" variant="soft" label={s.adm.corrEdited} />}
                    {incomplete && <Badge tone="danger" variant="soft" dot label={s.hist.noClockOut} />}
                  </View>
                </Pressable>
                {hasPhoto && (
                  <View style={{ width: 44, height: 44, borderRadius: radius.sm, overflow: 'hidden', backgroundColor: color.skyTint, alignItems: 'center', justifyContent: 'center' }}>
                    {thumb ? (
                      <Image source={{ uri: thumb }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                      <Camera size={18} color={color.anugrahBlue} strokeWidth={2} />
                    )}
                  </View>
                )}
                <Pressable onPress={() => openEditCorr(r)} hitSlop={8} accessibilityLabel={s.adm.corrTitle} style={{ width: 34, height: 34, borderRadius: radius.sm, backgroundColor: color.paper, alignItems: 'center', justifyContent: 'center' }}>
                  <Pencil size={16} color={color.muted} strokeWidth={2} />
                </Pressable>
              </View>
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
              <Pressable onPress={closeReset} hitSlop={10} accessibilityLabel={s.hist.close}>
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

      {/* Delete-account confirmation (type the employee id) */}
      <Dialog visible={delOpen} onClose={closeDelete} maxWidth={340}>
        <View style={{ gap: space.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <AlertTriangle size={20} color={color.danger} strokeWidth={2} />
            <Txt w="bold" size={16} color={color.ink} style={{ flex: 1 }}>
              {s.adm.delAcctTitle}
            </Txt>
            <Pressable onPress={closeDelete} hitSlop={10} accessibilityLabel={s.hist.close}>
              <X size={20} color={color.muted} strokeWidth={2} />
            </Pressable>
          </View>
          <Txt size={12} color={color.muted}>
            {member.name} · {member.employeeId}
          </Txt>
          <Txt size={14} color={color.ink} style={{ lineHeight: 20 }}>
            {s.adm.delAcctMsg}
          </Txt>
          <View>
            <Txt w="semibold" size={12} color={color.muted} style={{ marginBottom: space.sm }}>
              {s.adm.delAcctConfirmLabel}
            </Txt>
            <TextInput
              value={delConfirm}
              onChangeText={setDelConfirm}
              placeholder={member.employeeId}
              placeholderTextColor={color.muted}
              autoCapitalize="characters"
              autoCorrect={false}
              style={{ backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.sm, paddingHorizontal: space.md, paddingVertical: space.md, fontFamily: interFamily('regular'), fontSize: 14, color: color.ink }}
            />
          </View>
          {delErr && (
            <Txt size={12} color={color.danger} style={{ lineHeight: 17 }}>
              {delErr}
            </Txt>
          )}
          <View style={{ flexDirection: 'row', gap: space.md }}>
            <View style={{ flex: 1 }}>
              <Button variant="secondary" size="md" fullWidth label={s.adm.cancel} onPress={closeDelete} />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                variant="danger"
                size="md"
                fullWidth
                label={delBusy ? '…' : s.adm.delAcctYes}
                disabled={delBusy || delConfirm.trim() !== member.employeeId}
                onPress={doDelete}
              />
            </View>
          </View>
        </View>
      </Dialog>

      {/* Access-role change confirmation */}
      <Dialog visible={pendingRole !== null} onClose={() => setPendingRole(null)} maxWidth={340}>
        <View style={{ gap: space.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Txt w="bold" size={16} color={color.ink}>
              {s.adm.roleWarnTitle}
            </Txt>
            <Pressable onPress={() => setPendingRole(null)} hitSlop={10} accessibilityLabel={s.hist.close}>
              <X size={20} color={color.muted} strokeWidth={2} />
            </Pressable>
          </View>
          <Txt size={12} color={color.muted}>
            {member.name}
          </Txt>
          <Txt size={14} color={color.ink} style={{ lineHeight: 20 }}>
            {s.adm.roleWarnMsg.replace('{role}', pendingRoleLabel)}
          </Txt>
          {isSelf && pendingRole === 'employee' && (
            <View style={{ flexDirection: 'row', gap: space.sm, backgroundColor: color.dangerBg, borderRadius: radius.sm, padding: space.md }}>
              <AlertTriangle size={18} color={color.danger} strokeWidth={2} style={{ marginTop: 1 }} />
              <Txt size={12} color={color.danger} style={{ flex: 1, lineHeight: 17 }}>
                {s.adm.roleWarnSelf}
              </Txt>
            </View>
          )}
          <View style={{ flexDirection: 'row', gap: space.md }}>
            <View style={{ flex: 1 }}>
              <Button variant="secondary" size="md" fullWidth label={s.adm.cancel} onPress={() => setPendingRole(null)} />
            </View>
            <View style={{ flex: 1 }}>
              <Button variant="danger" size="md" fullWidth label={s.adm.roleWarnConfirm} onPress={confirmRole} />
            </View>
          </View>
        </View>
      </Dialog>

      {/* Attendance correction */}
      <Dialog visible={corr !== null} onClose={() => setCorr(null)} maxWidth={360}>
        {corr && (
          <View style={{ gap: space.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Txt w="bold" size={16} color={color.ink}>
                {s.adm.corrTitle}
              </Txt>
              <Pressable onPress={() => setCorr(null)} hitSlop={10} accessibilityLabel={s.hist.close}>
                <X size={20} color={color.muted} strokeWidth={2} />
              </Pressable>
            </View>
            <Txt size={12} color={color.muted}>
              {member.name}
            </Txt>

            {corr.isNew ? (
              <View>
                <Txt w="semibold" size={12} color={color.muted} style={{ marginBottom: space.sm }}>
                  {s.adm.corrDate}
                </Txt>
                <DateField
                  value={corr.workDate}
                  onChange={(v) => {
                    // Prefill from an existing row so picking a filled date doesn't clear it.
                    const ex = rows?.find((r) => r.date === v);
                    setCorr({ ...corr, workDate: v, clockIn: ex?.clockInTime ?? corr.clockIn, clockOut: ex?.clockOutTime ?? corr.clockOut });
                  }}
                  max={todayIso}
                />
                {rows?.some((r) => r.date === corr.workDate) && (
                  <Txt size={12} color={color.warning} style={{ marginTop: space.sm, lineHeight: 16 }}>
                    {s.adm.corrExists}
                  </Txt>
                )}
              </View>
            ) : (
              <Txt size={13} color={color.ink}>
                {s.adm.corrDate}: {rangeStr(corr.workDate, corr.workDate, lang)}
              </Txt>
            )}

            <View style={{ flexDirection: 'row', gap: space.md }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <TimeField label={s.adm.corrIn} value={corr.clockIn} onChange={(v) => setCorr({ ...corr, clockIn: v })} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <TimeField label={s.adm.corrOut} value={corr.clockOut} onChange={(v) => setCorr({ ...corr, clockOut: v })} />
              </View>
            </View>

            <View>
              <Txt w="semibold" size={12} color={color.muted} style={{ marginBottom: space.sm }}>
                {s.adm.corrNote}
              </Txt>
              <TextInput
                value={corr.note}
                onChangeText={(v) => setCorr({ ...corr, note: v })}
                placeholder={s.adm.corrNotePh}
                placeholderTextColor={color.muted}
                style={{ backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.sm, paddingHorizontal: space.md, paddingVertical: space.md, fontFamily: interFamily('regular'), fontSize: 14, color: color.ink }}
              />
            </View>

            {corrErr && (
              <Txt size={12} color={color.danger} style={{ lineHeight: 17 }}>
                {corrErr}
              </Txt>
            )}

            <View style={{ flexDirection: 'row', gap: space.md }}>
              {!corr.isNew && (
                <View style={{ flex: 1 }}>
                  <Button variant="danger" size="md" fullWidth label={s.adm.del} disabled={corrBusy} onPress={() => setCorrDelOpen(true)} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Button variant="primary" size="md" fullWidth label={s.prof.save} disabled={corrBusy} onPress={saveCorr} />
              </View>
            </View>
          </View>
        )}
      </Dialog>

      {/* Delete attendance confirmation */}
      <Dialog visible={corrDelOpen} onClose={() => setCorrDelOpen(false)} maxWidth={320}>
        <View style={{ gap: space.md }}>
          <Txt w="bold" size={16} color={color.ink}>
            {s.adm.corrDelTitle}
          </Txt>
          <Txt size={14} color={color.ink} style={{ lineHeight: 20 }}>
            {s.adm.corrDelMsg}
          </Txt>
          <View style={{ flexDirection: 'row', gap: space.md }}>
            <View style={{ flex: 1 }}>
              <Button variant="secondary" size="md" fullWidth label={s.adm.cancel} onPress={() => setCorrDelOpen(false)} />
            </View>
            <View style={{ flex: 1 }}>
              <Button variant="danger" size="md" fullWidth label={s.adm.holidayDelYes} disabled={corrBusy} onPress={doDeleteCorr} />
            </View>
          </View>
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
