import React, { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Image, Pressable } from 'react-native';
import { ChevronDown, Camera, X } from 'lucide-react-native';
import { color, space, radius } from '../theme';
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
          paddingHorizontal: space.lg,
          paddingVertical: space.lg,
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
            gap: space.xs,
            paddingVertical: space.sm,
            paddingHorizontal: space.md,
            backgroundColor: color.skyTint,
            borderRadius: radius.pill,
          }}
        >
          <Txt w="semibold" size={13} color={color.deepNavy}>
            {headerMonth}
          </Txt>
          <ChevronDown size={15} color={color.deepNavy} strokeWidth={2} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: space.xl }}>
        {/* Stat cells */}
        <View style={{ flexDirection: 'row', gap: space.md, paddingHorizontal: space.lg, paddingTop: space.lg }}>
          <HistStat value={String(stats.ontime)} label={s.hist.present} valueColor={color.success} />
          <HistStat value={String(stats.late)} label={s.hist.late} valueColor={color.danger} />
          <HistStat value={String(stats.leave)} label={s.hist.leave} valueColor={color.anugrahBlue} />
        </View>

        {loading ? (
          <View style={{ paddingTop: space['2xl'], alignItems: 'center' }}>
            <ActivityIndicator color={color.anugrahBlue} />
          </View>
        ) : rows.length === 0 ? (
          <View style={{ paddingTop: space['2xl'], paddingHorizontal: space.lg, alignItems: 'center' }}>
            <Txt size={14} color={color.muted} style={{ textAlign: 'center' }}>
              {s.hist.empty}
            </Txt>
          </View>
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

                  {/* Status badge — sits just left of the thumbnail (right-aligned) */}
                  <StatusBadge status={statusOf(r.clockInTime)} />

                  {/* Selfie thumbnail — always the rightmost element, fixed square */}
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
      <Txt w="extrabold" size={22} color={valueColor} tabular>
        {value}
      </Txt>
      <Txt size={12} color={color.muted} style={{ marginTop: space.xs }}>
        {label}
      </Txt>
    </View>
  );
}

export default HistoryScreen;
