import React from 'react';
import { View, ScrollView, useWindowDimensions } from 'react-native';
import { Bell } from 'lucide-react-native';
import { color } from '../theme';
import { Txt, Button, Avatar, IconTile, LogoMark, GlowCircle } from '../components';
import { useLang } from '../i18n/LangContext';
import { useNow } from '../lib/useNow';
import { timeStr, dateStr } from '../lib/format';
import { menuIcons } from '../lib/data';

export function HomeScreen({ onClockIn }: { onClockIn?: () => void }) {
  const { s, lang } = useLang();
  const now = useNow(1000);
  const { width } = useWindowDimensions();
  const tile = (width - 18 * 2 - 12 * 2) / 3;

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
          <Avatar name={s.home.name} size={46} ring={color.skyTint} />
          <View>
            <Txt size={13} color={color.muted}>
              {s.home.greeting}
            </Txt>
            <Txt w="bold" size={17} color={color.ink}>
              {s.home.name}
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
        <Txt w="extrabold" size={52} color={color.white} tabular style={{ marginTop: 4, letterSpacing: -1.5 }}>
          {timeStr(now)}
        </Txt>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            alignSelf: 'flex-start',
            marginTop: 16,
            paddingVertical: 7,
            paddingHorizontal: 14,
            borderRadius: 999,
            backgroundColor: 'rgba(149,252,246,0.14)',
            borderWidth: 1,
            borderColor: 'rgba(149,252,246,0.4)',
          }}
        >
          <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: color.humanAccent }} />
          <Txt w="semibold" size={13} color={color.humanAccent}>
            {s.home.statusOut}
          </Txt>
        </View>
      </View>

      {/* Clock In */}
      <View style={{ paddingHorizontal: 18, paddingTop: 18 }}>
        <Button variant="primary" size="lg" fullWidth label={s.home.clockIn} onPress={onClockIn} />
      </View>

      {/* Today summary */}
      <Section title={s.home.todayTitle}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <SummaryCard label={s.home.inLabel} value={s.home.dash} />
          <SummaryCard label={s.home.outLabel} value={s.home.dash} />
          <SummaryCard label={s.home.workLabel} value={s.home.zero} valueColor={color.anugrahBlue} />
        </View>
      </Section>

      {/* Quick menu */}
      <Section title={s.home.menuTitle}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {s.menu.map((label, i) => (
            <View
              key={label}
              style={{
                width: tile,
                backgroundColor: color.white,
                borderWidth: 1,
                borderColor: color.line,
                borderRadius: 18,
                paddingVertical: 14,
                paddingHorizontal: 8,
                alignItems: 'center',
                gap: 8,
              }}
            >
              <IconTile icon={menuIcons[i]} />
              <Txt w="semibold" size={12} color={color.ink} style={{ textAlign: 'center' }}>
                {label}
              </Txt>
            </View>
          ))}
        </View>
      </Section>

      {/* Leave balance */}
      <Section title={null}>
        <View
          style={{
            backgroundColor: color.white,
            borderWidth: 1,
            borderColor: color.line,
            borderRadius: 22,
            padding: 18,
            overflow: 'hidden',
          }}
        >
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: color.humanAccent }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <Txt w="bold" size={14} color={color.ink}>
              {s.home.leaveTitle}
            </Txt>
            <Txt w="semibold" size={13} color={color.anugrahBlue}>
              {s.home.seeAll}
            </Txt>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <BalanceCell label={s.home.entitle} value="12" bg={color.skyTint} valueColor={color.deepNavy} />
            <BalanceCell label={s.home.taken} value="4" bg={color.dangerBg} valueColor={color.danger} />
            <BalanceCell label={s.home.balance} value="8" bg={color.successBg} valueColor={color.success} />
          </View>
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

function SummaryCard({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: 16, padding: 14 }}>
      <Txt size={12} color={color.muted}>
        {label}
      </Txt>
      <Txt w="extrabold" size={20} color={valueColor ?? color.ink} tabular style={{ marginTop: 4 }}>
        {value}
      </Txt>
    </View>
  );
}

function BalanceCell({ label, value, bg, valueColor }: { label: string; value: string; bg: string; valueColor: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, borderRadius: 14, backgroundColor: bg }}>
      <Txt w="extrabold" size={22} color={valueColor} tabular>
        {value}
      </Txt>
      <Txt size={12} color={color.muted} style={{ marginTop: 2 }}>
        {label}
      </Txt>
    </View>
  );
}

export default HomeScreen;
