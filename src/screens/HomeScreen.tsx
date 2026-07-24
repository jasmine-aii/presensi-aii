import React from 'react';
import { View, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { Bell } from 'lucide-react-native';
import { color } from '../theme';
import { Txt, Button, Avatar, IconTile, LogoMark, GlowCircle } from '../components';
import { useLang } from '../i18n/LangContext';
import { useNow } from '../lib/useNow';
import { timeStr, dateStr } from '../lib/format';
import { menuIcons } from '../lib/data';

// Quick-menu (order: Cuti, Sakit, Izin khusus, Lembur, Dinas luar, Riwayat):
const DISABLED_MENU = new Set([0, 1]); // Cuti, Sakit — shown but disabled
const HIDDEN_MENU = new Set([2, 3, 4]); // Izin khusus, Lembur, Dinas luar — hidden for now
const RIWAYAT_INDEX = 5; // opens the History page

export function HomeScreen({
  name,
  onClock,
  onOpenHistory,
  clockInTime,
  clockOutTime,
}: {
  name?: string;
  onClock?: (mode: 'in' | 'out') => void;
  onOpenHistory?: () => void;
  clockInTime?: string | null;
  clockOutTime?: string | null;
}) {
  const { s, lang } = useLang();
  const userName = name ?? s.home.name;
  const now = useNow(1000);
  const { width } = useWindowDimensions();
  const tile = (width - 18 * 2 - 12 * 2) / 3;

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

  // Total work hours: clock-out − clock-in, or live (now − clock-in) if still in.
  const toMin = (t: string) => {
    const [hh, mm] = t.split(':').map(Number);
    return hh * 60 + mm;
  };
  let workStr = s.home.dash;
  if (clockInTime) {
    const endMin = clockOutTime ? toMin(clockOutTime) : now.getHours() * 60 + now.getMinutes();
    const diff = Math.max(0, endMin - toMin(clockInTime));
    workStr = `${Math.floor(diff / 60)}${lang === 'id' ? 'j' : 'h'} ${diff % 60}m`;
  }

  return (
    <ScrollView style={{ backgroundColor: color.paper }} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 22,
          paddingTop: 16,
          paddingBottom: 14,
          backgroundColor: color.white,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Bell size={22} color={color.muted} strokeWidth={2} />
          <LogoMark height={26} />
        </View>
      </View>

      {/* Navy hero */}
      <View
        style={{
          marginHorizontal: 18,
          marginTop: 16,
          padding: 22,
          paddingBottom: 24,
          borderRadius: 26,
          backgroundColor: color.deepNavy,
          overflow: 'hidden',
        }}
      >
        <GlowCircle size={180} top={-60} right={-40} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Txt w="bold" size={12} color={color.humanAccent} style={{ letterSpacing: 1.6, textTransform: 'uppercase' }}>
            {s.home.shift}
          </Txt>
          <Txt w="semibold" size={13} color="rgba(255,255,255,0.78)" tabular>
            {s.home.hours}
          </Txt>
        </View>
        <Txt size={14} color="rgba(255,255,255,0.7)" style={{ marginTop: 14 }}>
          {dateStr(now, lang)}
        </Txt>
        <Txt w="extrabold" size={44} color={color.white} tabular style={{ marginTop: 4, letterSpacing: -1.5 }}>
          {timeStr(now)}
        </Txt>

        {/* Clock In / Clock Out / total work hours */}
        <View style={{ flexDirection: 'row', gap: 22, marginTop: 14 }}>
          <View>
            <Txt size={11} color="rgba(255,255,255,0.6)">
              {s.home.inLabel}
            </Txt>
            <Txt w="bold" size={17} color={color.white} tabular style={{ marginTop: 2 }}>
              {clockInTime ?? s.home.dash}
            </Txt>
          </View>
          <View>
            <Txt size={11} color="rgba(255,255,255,0.6)">
              {s.home.outLabel}
            </Txt>
            <Txt w="bold" size={17} color={color.white} tabular style={{ marginTop: 2 }}>
              {clockOutTime ?? s.home.dash}
            </Txt>
          </View>
          <View>
            <Txt size={11} color="rgba(255,255,255,0.6)">
              {s.home.workLabel}
            </Txt>
            <Txt w="bold" size={17} color={color.humanAccent} tabular style={{ marginTop: 2 }}>
              {workStr}
            </Txt>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            alignSelf: 'flex-start',
            marginTop: 14,
            paddingVertical: 7,
            paddingHorizontal: 14,
            borderRadius: 999,
            backgroundColor: sc.bg,
            borderWidth: 1,
            borderColor: sc.bd,
          }}
        >
          <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: sc.fg }} />
          <Txt w="semibold" size={13} color={sc.fg}>
            {statusLabel}
          </Txt>
        </View>
      </View>

      {/* Primary clock action */}
      <View style={{ paddingHorizontal: 18, paddingTop: 18 }}>
        <Button variant="primary" size="lg" fullWidth label={afterNoon ? s.home.clockOut : s.home.clockIn} onPress={() => onClock?.(primaryMode)} />
      </View>

      {/* Quick menu */}
      <Section title={s.home.menuTitle}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {s.menu.map((label, i) => {
            if (HIDDEN_MENU.has(i)) return null;
            const disabled = DISABLED_MENU.has(i);
            const tileStyle = {
              width: tile,
              backgroundColor: color.white,
              borderWidth: 1,
              borderColor: color.line,
              borderRadius: 18,
              paddingVertical: 14,
              paddingHorizontal: 8,
              alignItems: 'center' as const,
              gap: 8,
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
            return i === RIWAYAT_INDEX ? (
              <Pressable key={label} onPress={onOpenHistory} style={tileStyle}>
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
    <View style={{ paddingHorizontal: 18, paddingTop: 22 }}>
      {title != null && (
        <Txt w="bold" size={14} color={color.ink} style={{ marginBottom: 12 }}>
          {title}
        </Txt>
      )}
      {children}
    </View>
  );
}

export default HomeScreen;
