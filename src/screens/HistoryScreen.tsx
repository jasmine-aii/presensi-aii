import React, { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Image, Pressable } from 'react-native';
import { ChevronDown, Camera, X } from 'lucide-react-native';
import { color, space } from '../theme';
import { Txt, StatusBadge, Dialog } from '../components';
import { useLang } from '../i18n/LangContext';
import { useAuth } from '../auth/AuthContext';
import { fetchHistory, type HistoryEntry } from '../lib/attendance';
import { signedUrlsFor } from '../lib/storage';
import { parseYmd, weekdayShort, monthYear, dateStr } from '../lib/format';
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
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [sel, setSel] = useState<HistoryEntry | null>(null);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    fetchHistory(userId).then(async (r) => {
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
  }, [userId]);

  const loading = rows === null;
  const stats = (rows ?? []).reduce(
    (acc, r) => {
      acc[statusOf(r.clockInTime)] += 1;
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
              const thumb = r.clockInPhoto ? urls[r.clockInPhoto] : undefined;
              const hasPhoto = !!(r.clockInPhoto || r.clockOutPhoto);
              return (
                <Pressable
                  key={r.date}
                  onPress={hasPhoto ? () => setSel(r) : undefined}
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

                  {/* Selfie thumbnail (clock-in), if present */}
                  {hasPhoto &&
                    (thumb ? (
                      <Image source={{ uri: thumb }} style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: color.line }} />
                    ) : (
                      <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: color.skyTint, alignItems: 'center', justifyContent: 'center' }}>
                        <Camera size={16} color={color.anugrahBlue} strokeWidth={2} />
                      </View>
                    ))}

                  <StatusBadge status={statusOf(r.clockInTime)} />
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
                <Txt size={12} color={color.muted} style={{ marginTop: 2 }}>
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
