import React, { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { TrendingUp, Palmtree, ChevronRight } from 'lucide-react-native';
import { color, space, radius } from '../theme';
import { Txt, Avatar, Badge, SelectField } from '../components';
import { useLang } from '../i18n/LangContext';
import { monthName } from '../lib/format';
import { fetchTeam, type AdminMember } from '../lib/admin';
import { fetchAttendanceInsights, fetchEmployeeReports, type AttendanceInsights, type EmployeeReport } from '../lib/reports';

/** A card of labelled metric columns separated by dividers. */
function MetricRow({ items }: { items: Array<[string, string | number, string]> }) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.md, paddingVertical: space.lg }}>
      {items.map(([label, value, hex], i) => (
        <View key={label} style={{ flex: 1, alignItems: 'center', borderLeftWidth: i === 0 ? 0 : 1, borderLeftColor: color.line, paddingHorizontal: space.sm }}>
          <Txt w="extrabold" size={22} color={hex} tabular>
            {value}
          </Txt>
          <Txt size={11} color={color.muted} style={{ marginTop: space.xs, textAlign: 'center' }}>
            {label}
          </Txt>
        </View>
      ))}
    </View>
  );
}

/**
 * Reports (Laporan) — team attendance rate + monthly insights for a chosen
 * month/year, plus per-employee attendance (present / working days since join)
 * and a simplified leave balance. All derived live from attendance / leave.
 */
export function ReportsScreen({ onSelectMember }: { onSelectMember?: (m: AdminMember) => void }) {
  const { s, lang } = useLang();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month0, setMonth0] = useState(now.getMonth());
  const [ins, setIns] = useState<AttendanceInsights | null>(null);
  const [emps, setEmps] = useState<EmployeeReport[] | null>(null);
  const [roster, setRoster] = useState<Map<string, AdminMember>>(new Map());

  useEffect(() => {
    let alive = true;
    setIns(null);
    setEmps(null);
    fetchAttendanceInsights(year, month0).then((r) => alive && setIns(r));
    fetchEmployeeReports(year, month0).then((r) => alive && setEmps(r));
    return () => {
      alive = false;
    };
  }, [year, month0]);

  // Roster resolves a report row → full member so tapping a card opens detail.
  useEffect(() => {
    let alive = true;
    fetchTeam().then((team) => alive && setRoster(new Map(team.map((m) => [m.id, m]))));
    return () => {
      alive = false;
    };
  }, []);

  const openMember = (id: string) => {
    const m = roster.get(id);
    if (m) onSelectMember?.(m);
  };

  // Month options are capped at the current month for the current year (no future).
  const maxMonth = year === now.getFullYear() ? now.getMonth() : 11;
  const monthOptions = Array.from({ length: maxMonth + 1 }, (_, i) => ({ value: String(i), label: monthName(i, lang) }));
  const yearOptions = [now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear()].map((y) => ({ value: String(y), label: String(y) }));

  const onPickYear = (v: string) => {
    const y = Number(v);
    setYear(y);
    if (y === now.getFullYear() && month0 > now.getMonth()) setMonth0(now.getMonth());
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
      <View style={{ paddingHorizontal: space.lg, paddingVertical: space.lg, backgroundColor: color.white, borderBottomWidth: 1, borderBottomColor: color.line }}>
        <Txt w="bold" size={17} color={color.ink}>
          {s.anav.report}
        </Txt>
      </View>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
        {/* Period picker */}
        <View style={{ flexDirection: 'row', gap: space.md }}>
          <View style={{ flex: 2 }}>
            <SelectField label={s.adm.selMonth} value={String(month0)} options={monthOptions} onChange={(v) => setMonth0(Number(v))} />
          </View>
          <View style={{ flex: 1 }}>
            <SelectField label={s.adm.selYear} value={String(year)} options={yearOptions} onChange={onPickYear} />
          </View>
        </View>

        {/* Team attendance rate */}
        <View style={{ backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.lg, padding: space.xl, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: color.humanAccent }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.md }}>
            <TrendingUp size={18} color={color.anugrahBlue} strokeWidth={2} />
            <Txt w="bold" size={14} color={color.ink}>
              {s.adm.rate}
            </Txt>
          </View>
          {ins === null ? (
            <View style={{ paddingVertical: space.lg }}>
              <ActivityIndicator color={color.anugrahBlue} />
            </View>
          ) : (
            <>
              <Txt w="extrabold" size={46} color={color.anugrahBlue} tabular style={{ letterSpacing: -1 }}>
                {ins.rate}%
              </Txt>
              <View style={{ height: 8, borderRadius: radius.pill, backgroundColor: color.skyTint, marginTop: space.md, overflow: 'hidden' }}>
                <View style={{ width: `${ins.rate}%`, height: 8, borderRadius: radius.pill, backgroundColor: color.anugrahBlue }} />
              </View>
              <Txt size={12} color={color.muted} tabular style={{ marginTop: space.sm }}>
                {ins.present} {s.adm.iManDays.replace('{n}', String(ins.expected))}
              </Txt>
              <Txt size={12} color={color.muted} tabular style={{ marginTop: 2 }}>
                {s.adm.workDaysElapsed.replace('{n}', String(ins.workingDays))}
              </Txt>
            </>
          )}
        </View>

        {/* Monthly insights */}
        {ins && (
          <>
            <Txt w="bold" size={14} color={color.ink} style={{ marginTop: space.md }}>
              {s.adm.insightsTitle}
            </Txt>
            <MetricRow
              items={[
                [s.adm.iOnTime, `${ins.present ? Math.round((ins.onTime / ins.present) * 100) : 0}%`, color.success],
                [s.adm.iLate, ins.late, color.danger],
                [s.adm.iAvgIn, ins.avgClockIn ?? s.home.dash, color.deepNavy],
              ]}
            />
            <MetricRow
              items={[
                [s.adm.iLeaveMonth, `${ins.leaveDays} ${s.adm.iDaysUnit}`, color.warning],
                [s.adm.iPending, ins.pending, ins.pending > 0 ? color.warning : color.ink],
              ]}
            />
          </>
        )}

        {/* Per-employee statistics */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.md, marginBottom: space.xs }}>
          <Palmtree size={18} color={color.anugrahBlue} strokeWidth={2} />
          <Txt w="bold" size={14} color={color.ink}>
            {s.adm.statLeaveTitle}
          </Txt>
        </View>

        {emps === null ? (
          <View style={{ paddingVertical: space.xl, alignItems: 'center' }}>
            <ActivityIndicator color={color.anugrahBlue} />
          </View>
        ) : emps.length === 0 ? (
          <Txt size={13} color={color.muted} style={{ paddingVertical: space.lg, textAlign: 'center' }}>
            {s.adm.statEmpty}
          </Txt>
        ) : (
          <View style={{ gap: space.md }}>
            {emps.map((m) => (
              <View key={m.id} style={{ backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.md, padding: space.lg, gap: space.md }}>
                {/* Header — tap identity to open the employee, attendance rate aligned right */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                  <Pressable
                    onPress={() => openMember(m.id)}
                    disabled={!roster.has(m.id)}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md }}
                    accessibilityRole="button"
                  >
                    <Avatar name={m.name} size={38} />
                    <View style={{ flex: 1 }}>
                      <Txt w="semibold" size={14} color={color.ink}>
                        {m.name}
                      </Txt>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.xs }}>
                        <Txt size={12} color={color.muted} tabular>
                          {m.employeeId}
                        </Txt>
                        {m.pending > 0 && <Badge tone="warning" variant="soft" label={`${m.pending} ${s.adm.statPending}`} />}
                      </View>
                    </View>
                    {roster.has(m.id) && <ChevronRight size={18} color={color.muted} strokeWidth={2} />}
                  </Pressable>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Txt w="extrabold" size={22} color={color.anugrahBlue} tabular>
                      {m.rate}%
                    </Txt>
                    <Txt size={11} color={color.muted} tabular style={{ marginTop: 2 }}>
                      {m.present}/{m.workingDays} {s.adm.workDaysUnit}
                    </Txt>
                  </View>
                </View>

                {/* Attendance counts */}
                <MetricRow
                  items={[
                    [s.adm.iOnTime, m.onTime, color.success],
                    [s.adm.iLate, m.late, color.danger],
                    [s.adm.iAbsent, m.absent, color.muted],
                  ]}
                />

                {/* Leave balance — carry-over + remaining */}
                <MetricRow
                  items={[
                    [s.adm.carryOver, m.carryOver, color.deepNavy],
                    [s.adm.leaveRemaining, m.remaining, color.success],
                  ]}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export default ReportsScreen;
