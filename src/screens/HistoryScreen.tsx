import React, { useEffect, useState } from 'react';
import { View, ScrollView, Image, Pressable } from 'react-native';
import { Camera, X, CalendarClock } from 'lucide-react-native';
import { color, space, radius } from '../theme';
import { Txt, StatusBadge, Dialog, EmptyState, SkeletonList, SelectField } from '../components';
import { useLang } from '../i18n/LangContext';
import { useAuth } from '../auth/AuthContext';
import { fetchHistory, type HistoryEntry } from '../lib/attendance';
import { fetchEmployeeMonthStats, type EmployeeMonthStats } from '../lib/reports';
import { signedUrlsFor } from '../lib/storage';
import { parseYmd, weekdayShort, monthYear, monthName, dateStr } from '../lib/format';
import type { AttendanceStatus } from '../lib/data';

const LATE_AFTER_MIN = 9 * 60; // 09:00 — clock-in after 9 counts as late (work hours still start 08:00)
const pad = (n: number) => String(n).padStart(2, '0');

/** ontime / late from the clock-in time; no clock-in → treated as leave/absent. */
function statusOf(cin: string | null): AttendanceStatus {
  if (!cin) return 'leave';
  const [h, m] = cin.split(':').map(Number);
  return h * 60 + m > LATE_AFTER_MIN ? 'late' : 'ontime';
}

export function HistoryScreen() {
  const { s, lang } = useLang();
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
  const now = new Date();

  const [year, setYear] = useState(now.getFullYear());
  const [month0, setMonth0] = useState(now.getMonth());
  const [rows, setRows] = useState<HistoryEntry[] | null>(null);
  const [stats, setStats] = useState<EmployeeMonthStats | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [sel, setSel] = useState<HistoryEntry | null>(null);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    setRows(null);
    setStats(null);
    const start = `${year}-${pad(month0 + 1)}-01`;
    const end = `${year}-${pad(month0 + 1)}-${pad(new Date(year, month0 + 1, 0).getDate())}`;
    fetchEmployeeMonthStats(userId, year, month0).then((r) => alive && setStats(r));
    fetchHistory(userId, 62, start, end).then(async (r) => {
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
  }, [userId, year, month0]);

  const loading = rows === null;

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
      {/* Header */}
      <View style={{ paddingHorizontal: space.lg, paddingVertical: space.lg, backgroundColor: color.white, borderBottomWidth: 1, borderBottomColor: color.line }}>
        <Txt w="bold" size={17} color={color.ink}>
          {s.hist.title}
        </Txt>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: space.xl }}>
        {/* Month / year picker */}
        <View style={{ flexDirection: 'row', gap: space.md, paddingHorizontal: space.lg, paddingTop: space.lg }}>
          <View style={{ flex: 2 }}>
            <SelectField label={s.adm.selMonth} value={String(month0)} options={monthOptions} onChange={(v) => setMonth0(Number(v))} />
          </View>
          <View style={{ flex: 1 }}>
            <SelectField label={s.adm.selYear} value={String(year)} options={yearOptions} onChange={onPickYear} />
          </View>
        </View>

        {/* Summary — Hadir n/working days, Terlambat, Tidak hadir */}
        <View style={{ flexDirection: 'row', gap: space.md, paddingHorizontal: space.lg, paddingTop: space.md }}>
          <HistStat value={stats ? `${stats.present}/${stats.workingDays}` : '—'} label={s.hist.present} valueColor={color.success} />
          <HistStat value={stats ? String(stats.late) : '—'} label={s.hist.late} valueColor={color.danger} />
          <HistStat value={stats ? String(stats.absent) : '—'} label={s.adm.iAbsent} valueColor={color.muted} />
        </View>

        {loading ? (
          <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg }}>
            <SkeletonList count={5} />
          </View>
        ) : rows.length === 0 ? (
          <EmptyState icon={CalendarClock} title={s.hist.empty} subtitle={s.hist.emptyHint} />
        ) : (
          <View style={{ gap: space.md, paddingHorizontal: space.lg, paddingTop: space.lg }}>
            {rows.map((r) => {
              const d = parseYmd(r.date);
              const thumb = r.clockInPhoto ? urls[r.clockInPhoto] : undefined;
              const hasPhoto = !!(r.clockInPhoto || r.clockOutPhoto);
              return (
                <Pressable
                  key={r.date}
                  onPress={hasPhoto ? () => setSel(r) : undefined}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: space.md,
                    backgroundColor: color.white,
                    borderWidth: 1,
                    borderColor: color.line,
                    borderRadius: radius.md,
                    padding: space.md,
                  }}
                >
                  <View style={{ width: 46, height: 46, borderRadius: radius.md, backgroundColor: color.skyTint, alignItems: 'center', justifyContent: 'center' }}>
                    <Txt w="semibold" size={11} color={color.muted} style={{ textTransform: 'uppercase' }}>
                      {weekdayShort(d, lang)}
                    </Txt>
                    <Txt w="extrabold" size={17} color={color.deepNavy} tabular>
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

                  <StatusBadge status={statusOf(r.clockInTime)} />

                  <View style={{ width: 44, height: 44, borderRadius: radius.sm, overflow: 'hidden', backgroundColor: color.skyTint, alignItems: 'center', justifyContent: 'center' }}>
                    {thumb ? (
                      <Image source={{ uri: thumb }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                      <Camera size={18} color={color.anugrahBlue} strokeWidth={2} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

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

function HistStat({ value, label, valueColor }: { value: string; label: string; valueColor: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.md, paddingVertical: space.md, paddingHorizontal: space.xs }}>
      <Txt w="extrabold" size={20} color={valueColor} tabular>
        {value}
      </Txt>
      <Txt size={12} color={color.muted} style={{ marginTop: space.xs, textAlign: 'center' }}>
        {label}
      </Txt>
    </View>
  );
}

export default HistoryScreen;
