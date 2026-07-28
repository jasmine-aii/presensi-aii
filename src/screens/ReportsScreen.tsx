import React, { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { TrendingUp, Palmtree } from 'lucide-react-native';
import { color, space, radius } from '../theme';
import { Txt, Avatar, Badge } from '../components';
import { useLang } from '../i18n/LangContext';
import { fetchLeaveStats, type LeaveStat } from '../lib/leave';
import { fetchAttendanceInsights, type AttendanceInsights } from '../lib/reports';

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
 * Reports (Laporan) — real team attendance rate + monthly insights derived live
 * from attendance/leave, plus per-employee annual-leave statistics.
 */
export function ReportsScreen() {
  const { s } = useLang();
  const [ins, setIns] = useState<AttendanceInsights | null>(null);
  const [stats, setStats] = useState<LeaveStat[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetchAttendanceInsights().then((r) => alive && setIns(r));
    fetchLeaveStats().then((r) => alive && setStats(r));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
      <View style={{ paddingHorizontal: space.lg, paddingVertical: space.lg, backgroundColor: color.white, borderBottomWidth: 1, borderBottomColor: color.line }}>
        <Txt w="bold" size={17} color={color.ink}>
          {s.anav.report}
        </Txt>
      </View>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
        {/* Team attendance rate (real, month-to-date) */}
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
                [s.adm.iOnTime, ins.onTime, color.success],
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

        {/* Employee leave statistics */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.md, marginBottom: space.xs }}>
          <Palmtree size={18} color={color.anugrahBlue} strokeWidth={2} />
          <Txt w="bold" size={14} color={color.ink}>
            {s.adm.statLeaveTitle}
          </Txt>
        </View>

        {stats === null ? (
          <View style={{ paddingVertical: space.xl, alignItems: 'center' }}>
            <ActivityIndicator color={color.anugrahBlue} />
          </View>
        ) : stats.length === 0 ? (
          <Txt size={13} color={color.muted} style={{ paddingVertical: space.lg, textAlign: 'center' }}>
            {s.adm.statEmpty}
          </Txt>
        ) : (
          <View style={{ gap: space.md }}>
            {stats.map((m) => (
              <View key={m.id} style={{ backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.md, padding: space.lg, gap: space.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                  <Avatar name={m.name} size={38} />
                  <View style={{ flex: 1 }}>
                    <Txt w="semibold" size={14} color={color.ink}>
                      {m.name}
                    </Txt>
                    <Txt size={12} color={color.muted} tabular style={{ marginTop: space.xs }}>
                      {m.employeeId}
                    </Txt>
                  </View>
                  {m.pending > 0 && <Badge tone="warning" variant="soft" label={`${m.pending} ${s.adm.statPending}`} />}
                </View>
                <MetricRow
                  items={[
                    [s.adm.accrued, m.accrued, color.ink],
                    [s.adm.carryOver, m.carryOver, color.deepNavy],
                    [s.home.taken, m.taken, color.warning],
                    [s.home.balance, m.remaining, color.success],
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
