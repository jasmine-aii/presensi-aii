import React, { useEffect, useState } from 'react';
import { View, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, BellRing, BellOff, Check, Clock as ClockIcon } from 'lucide-react-native';
import { color, space, radius } from '../theme';
import { Txt, Button, Avatar, IconTile, LogoMark, GlowCircle } from '../components';
import { useLang } from '../i18n/LangContext';
import { useAuth } from '../auth/AuthContext';
import { useNow } from '../lib/useNow';
import { timeStr, dateStr } from '../lib/format';
import { menuIcons } from '../lib/data';
import { parseShiftWindow, netWorkedMin, durationStr } from '../lib/shifts';
import { useClockReminders } from '../lib/useClockReminders';
import { fetchLeaveBalance, type LeaveBalance, type LeaveType } from '../lib/leave';

// Quick-menu (order: Cuti, Sakit, Izin khusus, Lembur, Dinas luar, Riwayat):
const LEAVE_INDEX = 0; // opens the leave-request form (Cuti tahunan)
const SICK_INDEX = 1; // opens the leave form pre-filled with Sakit
const DISABLED_MENU = new Set<number>(); // none disabled
const HIDDEN_MENU = new Set([2, 3, 4]); // Izin khusus, Lembur, Dinas luar — hidden for now
const RIWAYAT_INDEX = 5; // opens the History page

export function HomeScreen({
  name,
  shift,
  onClock,
  onOpenHistory,
  onOpenLeave,
  clockInTime,
  clockOutTime,
}: {
  name?: string;
  shift?: string | null;
  onClock?: (mode: 'in' | 'out') => void;
  onOpenHistory?: () => void;
  onOpenLeave?: (type?: LeaveType) => void;
  clockInTime?: string | null;
  clockOutTime?: string | null;
}) {
  const { s, lang } = useLang();
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
  const userName = name ?? s.home.name;
  const now = useNow(1000);

  // Personal annual-leave balance for the dashboard stats card.
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    fetchLeaveBalance(userId).then((b) => alive && setBalance(b));
    return () => {
      alive = false;
    };
  }, [userId]);
  const { width } = useWindowDimensions();
  // Tile width derives from the actual quick-menu row width (measured on layout),
  // not the window — on desktop the app is a narrow centered column, so the
  // window width would over-size the tiles and wrap them to one per row.
  const [rowW, setRowW] = useState(0);
  const fallback = (Math.min(width, 440) - 18 * 2 - 12 * 2) / 3;
  const tile = rowW > 0 ? (rowW - 12 * 2) / 3 : fallback;

  // Status pill: yellow only while not clocked in yet; teal (human accent) once
  // the employee has clocked in (and after clocking out).
  const done = !!clockOutTime;
  const statusLabel = done ? s.home.statusDone : clockInTime ? s.home.statusIn : s.home.statusOut;
  const sc = clockInTime
    ? { fg: color.humanAccent, bg: 'rgba(149,252,246,0.14)', bd: 'rgba(149,252,246,0.4)' }
    : { fg: '#FFCB47', bg: 'rgba(255,203,71,0.16)', bd: 'rgba(255,203,71,0.45)' };
  // Primary action flips to Clock Out from 12:00 noon until midnight.
  const afterNoon = now.getHours() >= 12;
  const primaryMode: 'in' | 'out' = afterNoon ? 'out' : 'in';

  // Time-of-day greeting: pagi 05–10 · siang 11–14 · sore 15–18 · malam 19–04.
  const h = now.getHours();
  const greetKey = h < 5 ? 'night' : h < 11 ? 'morning' : h < 15 ? 'noon' : h < 19 ? 'afternoon' : 'night';
  const greeting = s.home.greet[greetKey];

  // Work hours are credited within the SHIFT window: counting starts at the
  // shift start (arriving early doesn't add hours) and stops at the shift end
  // (overtime past shift end isn't counted in regular hours). Late arrival /
  // early leave still shorten it.
  const win = parseShiftWindow(shift);
  const toMin = (t: string) => {
    const [hh, mm] = t.split(':').map(Number);
    return hh * 60 + mm;
  };
  let workStr = s.home.dash;
  if (clockInTime) {
    const endActual = clockOutTime ? toMin(clockOutTime) : now.getHours() * 60 + now.getMinutes();
    workStr = durationStr(netWorkedMin(toMin(clockInTime), endActual, win), lang);
  }

  const rem = useClockReminders(shift, clockInTime, clockOutTime);

  return (
    <ScrollView style={{ backgroundColor: color.paper }} contentContainerStyle={{ paddingBottom: space.xl }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: space.xl,
          paddingTop: space.lg,
          paddingBottom: space.md,
          backgroundColor: color.white,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <Avatar name={userName} size={46} ring={color.skyTint} />
          <View>
            <Txt size={13} color={color.muted}>
              {greeting}
            </Txt>
            <Txt w="bold" size={17} color={color.ink}>
              {userName}
            </Txt>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <Bell size={22} color={color.muted} strokeWidth={2} />
          <LogoMark height={26} />
        </View>
      </View>

      {/* Clock hero — AII-blue → navy gradient (primary dominant, navy accent) */}
      <LinearGradient
        colors={[color.anugrahBlue, color.anugrahBlue, color.deepNavy]}
        locations={[0, 0.55, 1]}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        style={{
          marginHorizontal: space.lg,
          marginTop: space.lg,
          padding: space.xl,
          paddingBottom: space.xl,
          borderRadius: radius.lg,
          overflow: 'hidden',
        }}
      >
        <GlowCircle size={180} top={-60} right={-40} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Txt w="bold" size={12} color={color.humanAccent} style={{ letterSpacing: 1.6, textTransform: 'uppercase' }}>
            {s.home.shift}
          </Txt>
          <Txt w="semibold" size={13} color="rgba(255,255,255,0.78)" tabular>
            {win.startStr} – {win.endStr}
          </Txt>
        </View>
        <Txt size={14} color="rgba(255,255,255,0.7)" style={{ marginTop: space.md }}>
          {dateStr(now, lang)}
        </Txt>
        <Txt w="extrabold" size={44} color={color.white} tabular style={{ marginTop: space.xs, letterSpacing: -1.5 }}>
          {timeStr(now)}
        </Txt>

        {/* Clock In / Clock Out / total work hours */}
        <View style={{ flexDirection: 'row', gap: space.xl, marginTop: space.md }}>
          <View>
            <Txt size={11} color="rgba(255,255,255,0.6)">
              {s.home.inLabel}
            </Txt>
            <Txt w="bold" size={17} color={color.white} tabular style={{ marginTop: space.xs }}>
              {clockInTime ?? s.home.dash}
            </Txt>
          </View>
          <View>
            <Txt size={11} color="rgba(255,255,255,0.6)">
              {s.home.outLabel}
            </Txt>
            <Txt w="bold" size={17} color={color.white} tabular style={{ marginTop: space.xs }}>
              {clockOutTime ?? s.home.dash}
            </Txt>
          </View>
          <View>
            <Txt size={11} color="rgba(255,255,255,0.6)">
              {s.home.workLabel}
            </Txt>
            <Txt w="bold" size={17} color={color.humanAccent} tabular style={{ marginTop: space.xs }}>
              {workStr}
            </Txt>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.sm,
            alignSelf: 'flex-start',
            marginTop: space.md,
            paddingVertical: space.sm,
            paddingHorizontal: space.md,
            borderRadius: radius.pill,
            backgroundColor: sc.bg,
            borderWidth: 1,
            borderColor: sc.bd,
          }}
        >
          <View style={{ width: 8, height: 8, borderRadius: radius.pill, backgroundColor: sc.fg }} />
          <Txt w="semibold" size={13} color={sc.fg}>
            {statusLabel}
          </Txt>
        </View>
      </LinearGradient>

      {/* Primary clock action */}
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg }}>
        <Button variant="primary" size="lg" fullWidth label={afterNoon ? s.home.clockOut : s.home.clockIn} onPress={() => onClock?.(primaryMode)} />
      </View>

      {/* Attendance reminders */}
      <Section title={s.home.remindTitle}>
        <View style={{ backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.md, padding: space.lg }}>
          {/* Notification status / enable */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingBottom: space.md, marginBottom: space.md, borderBottomWidth: 1, borderBottomColor: color.line }}>
            {rem.permission === 'granted' ? (
              <>
                <BellRing size={18} color={color.success} strokeWidth={2} />
                <Txt w="semibold" size={13} color={color.success} style={{ flex: 1 }}>
                  {s.home.notifOn}
                </Txt>
              </>
            ) : rem.permission === 'default' && rem.supported ? (
              <>
                <Bell size={18} color={color.anugrahBlue} strokeWidth={2} />
                <Txt size={13} color={color.muted} style={{ flex: 1 }}>
                  {s.home.remindNote}
                </Txt>
                <Pressable onPress={rem.requestPermission} style={{ paddingVertical: space.sm, paddingHorizontal: space.md, borderRadius: radius.pill, backgroundColor: color.anugrahBlue }}>
                  <Txt w="semibold" size={12} color={color.white}>
                    {s.home.enableNotif}
                  </Txt>
                </Pressable>
              </>
            ) : (
              <>
                <BellOff size={18} color={color.muted} strokeWidth={2} />
                <Txt size={12} color={color.muted} style={{ flex: 1 }}>
                  {rem.supported ? s.home.notifDenied : s.home.notifUnsupported}
                </Txt>
              </>
            )}
          </View>

          {/* Reminder rows */}
          {rem.items.map((it) => (
            <View key={it.kind} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm }}>
              <View style={{ width: 34, height: 34, borderRadius: radius.sm, backgroundColor: it.done ? color.successBg : color.skyTint, alignItems: 'center', justifyContent: 'center' }}>
                {it.done ? <Check size={18} color={color.success} strokeWidth={2.5} /> : <ClockIcon size={17} color={color.anugrahBlue} strokeWidth={2} />}
              </View>
              <Txt w="semibold" size={14} color={color.ink} style={{ flex: 1 }}>
                {it.kind === 'in' ? s.home.remindIn : s.home.remindOut}
              </Txt>
              {it.done ? (
                <Txt w="semibold" size={12} color={color.success}>
                  {s.home.remindDone}
                </Txt>
              ) : (
                <Txt w="semibold" size={13} color={color.muted} tabular>
                  {it.before} · {it.after}
                </Txt>
              )}
            </View>
          ))}
        </View>
      </Section>

      {/* Personal leave balance */}
      {balance && (
        <Section title={s.home.leaveTitle}>
          <View style={{ flexDirection: 'row', backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.md, padding: space.lg }}>
            {(
              [
                [s.home.entitle, balance.quota, color.ink],
                [s.home.taken, balance.taken, color.warning],
                [s.home.balance, balance.remaining, color.success],
              ] as const
            ).map(([label, value, hex], i) => (
              <View key={label} style={{ flex: 1, alignItems: 'center', borderLeftWidth: i === 0 ? 0 : 1, borderLeftColor: color.line }}>
                <Txt w="extrabold" size={22} color={hex} tabular>
                  {value}
                </Txt>
                <Txt size={12} color={color.muted} style={{ marginTop: space.xs }}>
                  {label}
                </Txt>
              </View>
            ))}
          </View>
        </Section>
      )}

      {/* Quick menu */}
      <Section title={s.home.menuTitle}>
        <View onLayout={(e) => setRowW(e.nativeEvent.layout.width)} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
          {s.menu.map((label, i) => {
            if (HIDDEN_MENU.has(i)) return null;
            const disabled = DISABLED_MENU.has(i);
            const tileStyle = {
              width: tile,
              backgroundColor: color.white,
              borderWidth: 1,
              borderColor: color.line,
              borderRadius: radius.md,
              paddingVertical: space.md,
              paddingHorizontal: space.sm,
              alignItems: 'center' as const,
              gap: space.sm,
              opacity: disabled ? 0.4 : 1,
            };
            const inner = (
              <>
                <IconTile icon={menuIcons[i]} bg={disabled ? color.paper : color.skyTint} fg={disabled ? color.muted : color.anugrahBlue} />
                <Txt w="semibold" size={12} color={disabled ? color.muted : color.ink} style={{ textAlign: 'center' }}>
                  {label}
                </Txt>
              </>
            );
            const onPress =
              i === RIWAYAT_INDEX
                ? onOpenHistory
                : i === LEAVE_INDEX
                  ? () => onOpenLeave?.('cuti_tahunan')
                  : i === SICK_INDEX
                    ? () => onOpenLeave?.('sakit')
                    : undefined;
            return onPress && !disabled ? (
              <Pressable key={label} onPress={onPress} style={tileStyle}>
                {inner}
              </Pressable>
            ) : (
              <View key={label} style={tileStyle}>
                {inner}
              </View>
            );
          })}
        </View>
      </Section>

    </ScrollView>
  );
}

function Section({ title, children }: { title: string | null; children: React.ReactNode }) {
  return (
    <View style={{ paddingHorizontal: space.lg, paddingTop: space.xl }}>
      {title != null && (
        <Txt w="bold" size={14} color={color.ink} style={{ marginBottom: space.md }}>
          {title}
        </Txt>
      )}
      {children}
    </View>
  );
}

export default HomeScreen;
