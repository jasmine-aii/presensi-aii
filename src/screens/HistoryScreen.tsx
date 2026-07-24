import React, { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { color } from '../theme';
import { Txt, StatusBadge } from '../components';
import { useLang } from '../i18n/LangContext';
import { useAuth } from '../auth/AuthContext';
import { fetchHistory, type HistoryEntry } from '../lib/attendance';
import { parseYmd, weekdayShort, monthYear } from '../lib/format';
import type { AttendanceStatus } from '../lib/data';

const SHIFT_START_MIN = 8 * 60 + 30; // 08:30

/** ontime / late from the clock-in time; no clock-in → treated as leave/absent. */
function statusOf(cin: string | null): AttendanceStatus {
  if (!cin) return 'leave';
  const [h, m] = cin.split(':').map(Number);
  return h * 60 + m > SHIFT_START_MIN ? 'late' : 'ontime';
}

export function HistoryScreen() {
  const { s, lang } = useLang();
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
  const [rows, setRows] = useState<HistoryEntry[] | null>(null);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    fetchHistory(userId).then((r) => {
      if (alive) setRows(r);
    });
    return () => {
      alive = false;
    };
  }, [userId]);

  const loading = rows === null;
  const stats = (rows ?? []).reduce(
    (acc, r) => {
      const st = statusOf(r.clockInTime);
      acc[st] += 1;
      return acc;
    },
    { ontime: 0, late: 0, leave: 0 } as Record<AttendanceStatus, number>,
  );
  const headerMonth = rows && rows.length > 0 ? monthYear(parseYmd(rows[0].date), lang) : s.hist.month;

  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 16,
          backgroundColor: color.white,
          borderBottomWidth: 1,
          borderBottomColor: color.line,
        }}
      >
        <Txt w="bold" size={17} color={color.ink}>
          {s.hist.title}
        </Txt>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingVertical: 7,
            paddingHorizontal: 12,
            backgroundColor: color.skyTint,
            borderRadius: 999,
          }}
        >
          <Txt w="semibold" size={13} color={color.deepNavy}>
            {headerMonth}
          </Txt>
          <ChevronDown size={15} color={color.deepNavy} strokeWidth={2} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 22 }}>
        {/* Stat cells */}
        <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 18, paddingTop: 18 }}>
          <HistStat value={String(stats.ontime)} label={s.hist.present} valueColor={color.success} />
          <HistStat value={String(stats.late)} label={s.hist.late} valueColor={color.danger} />
          <HistStat value={String(stats.leave)} label={s.hist.leave} valueColor={color.anugrahBlue} />
        </View>

        {loading ? (
          <View style={{ paddingTop: 48, alignItems: 'center' }}>
            <ActivityIndicator color={color.anugrahBlue} />
          </View>
        ) : rows.length === 0 ? (
          <View style={{ paddingTop: 48, paddingHorizontal: 18, alignItems: 'center' }}>
            <Txt size={14} color={color.muted} style={{ textAlign: 'center' }}>
              {s.hist.empty}
            </Txt>
          </View>
        ) : (
          <View style={{ gap: 10, paddingHorizontal: 18, paddingTop: 20 }}>
            {rows.map((r) => {
              const d = parseYmd(r.date);
              return (
                <View
                  key={r.date}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    backgroundColor: color.white,
                    borderWidth: 1,
                    borderColor: color.line,
                    borderRadius: 18,
                    padding: 14,
                  }}
                >
                  <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: color.skyTint, alignItems: 'center', justifyContent: 'center' }}>
                    <Txt w="semibold" size={11} color={color.muted} style={{ textTransform: 'uppercase' }}>
                      {weekdayShort(d, lang)}
                    </Txt>
                    <Txt w="extrabold" size={17} color={color.deepNavy} tabular>
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

                  <StatusBadge status={statusOf(r.clockInTime)} />
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function HistStat({ value, label, valueColor }: { value: string; label: string; valueColor: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 4 }}>
      <Txt w="extrabold" size={22} color={valueColor} tabular>
        {value}
      </Txt>
      <Txt size={12} color={color.muted} style={{ marginTop: 2 }}>
        {label}
      </Txt>
    </View>
  );
}

export default HistoryScreen;
