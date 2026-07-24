import React, { useState } from 'react';
import { View, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { Bell, Check, X } from 'lucide-react-native';
import { color } from '../theme';
import { Txt, Button, Avatar, IconTile, LogoMark, GlowCircle } from '../components';
import { useLang } from '../i18n/LangContext';
import { useNow } from '../lib/useNow';
import { timeStr, dateStr } from '../lib/format';
import { menuIcons, teamByDept, approvalsByDept, HEAD_DEPT, type ApprItem, type RosterStatus } from '../lib/data';

export function HomeScreen({
  onClock,
  deptHead,
  clockInTime,
  clockOutTime,
}: {
  onClock?: (mode: 'in' | 'out') => void;
  deptHead?: boolean;
  clockInTime?: string | null;
  clockOutTime?: string | null;
}) {
  const { s, lang } = useLang();
  const now = useNow(1000);
  const { width } = useWindowDimensions();
  const tile = (width - 18 * 2 - 12 * 2) / 3;

  // Status pill: yellow while the day's attendance is still pending (not clocked
  // in, or clocked in but not yet out); teal once clocked out (complete).
  const done = !!clockOutTime;
  const statusLabel = done ? s.home.statusDone : clockInTime ? s.home.statusIn : s.home.statusOut;
  const sc = done
    ? { fg: color.humanAccent, bg: 'rgba(149,252,246,0.14)', bd: 'rgba(149,252,246,0.4)' }
    : { fg: '#FFCB47', bg: 'rgba(255,203,71,0.16)', bd: 'rgba(255,203,71,0.45)' };
  const work = workDuration(clockInTime, clockOutTime, lang, s.home.zero);
  // Primary action flips to Clock Out from 12:00 noon until midnight.
  const afterNoon = now.getHours() >= 12;
  const primaryMode: 'in' | 'out' = afterNoon ? 'out' : 'in';

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
        <Txt w="extrabold" size={44} color={color.white} tabular style={{ marginTop: 4, letterSpacing: -1.5 }}>
          {timeStr(now)}
        </Txt>

        {/* Clock In / Clock Out times */}
        <View style={{ flexDirection: 'row', gap: 28, marginTop: 14 }}>
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

      {/* Clock In */}
      <View style={{ paddingHorizontal: 18, paddingTop: 18 }}>
        <Button variant="primary" size="lg" fullWidth label={afterNoon ? s.home.clockOut : s.home.clockIn} onPress={() => onClock?.(primaryMode)} />
      </View>

      {/* Today summary */}
      <Section title={s.home.todayTitle}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <SummaryCard label={s.home.inLabel} value={clockInTime ?? s.home.dash} />
          <SummaryCard label={s.home.outLabel} value={clockOutTime ?? s.home.dash} />
          <SummaryCard label={s.home.workLabel} value={work} valueColor={color.anugrahBlue} />
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

      {deptHead && <DeptHeadPanels />}
    </ScrollView>
  );
}

const DOT: Record<RosterStatus, string> = {
  present: color.success,
  late: color.danger,
  leave: color.anugrahBlue,
  not: color.muted,
};

/** Extra Home sections shown only for a department head: team clock-in/out table + team approvals. */
function DeptHeadPanels() {
  const { s, lang } = useLang();
  const team = teamByDept(HEAD_DEPT);
  const [appr, setAppr] = useState<ApprItem[]>(() => approvalsByDept(HEAD_DEPT, lang, s));
  const [seedLang, setSeedLang] = useState(lang);
  if (seedLang !== lang) {
    setSeedLang(lang);
    setAppr(approvalsByDept(HEAD_DEPT, lang, s));
  }
  const resolve = (name: string) => setAppr((prev) => prev.filter((a) => a.name !== name));

  return (
    <>
      {/* Team clock-in / clock-out table */}
      <View style={{ paddingHorizontal: 18, paddingTop: 22 }}>
        <Txt w="bold" size={14} color={color.ink} style={{ marginBottom: 12 }}>
          {s.dh.teamTitle}
        </Txt>
        <View style={{ backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: 18, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, backgroundColor: color.paper }}>
            <Txt w="semibold" size={12} color={color.muted} style={{ flex: 1, marginLeft: 18 }}>
              {lang === 'id' ? 'Karyawan' : 'Employee'}
            </Txt>
            <Txt w="semibold" size={12} color={color.muted} style={{ width: 56, textAlign: 'right' }}>
              {s.out.inAt}
            </Txt>
            <Txt w="semibold" size={12} color={color.muted} style={{ width: 56, textAlign: 'right' }}>
              {s.out.outAt}
            </Txt>
          </View>
          {team.map((m) => (
            <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: color.line }}>
              <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: DOT[m.st], marginRight: 10 }} />
              <Txt size={14} color={color.ink} style={{ flex: 1 }} numberOfLines={1}>
                {m.name}
              </Txt>
              <Txt tabular size={13} color={m.in === '—' ? color.muted : color.ink} style={{ width: 56, textAlign: 'right' }}>
                {m.in}
              </Txt>
              <Txt tabular size={13} color={m.out === '—' ? color.muted : color.ink} style={{ width: 56, textAlign: 'right' }}>
                {m.out}
              </Txt>
            </View>
          ))}
        </View>
      </View>

      {/* Team approvals */}
      <View style={{ paddingHorizontal: 18, paddingTop: 22 }}>
        <Txt w="bold" size={14} color={color.ink} style={{ marginBottom: 12 }}>
          {s.dh.apprTitle}
        </Txt>
        {appr.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 24, backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: 18 }}>
            <Txt size={13} color={color.muted}>
              {s.dh.noAppr}
            </Txt>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {appr.map((q) => {
              const Icon = q.icon;
              return (
                <View key={q.name} style={{ backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: 18, padding: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <Avatar name={q.name} size={40} />
                    <View style={{ flex: 1 }}>
                      <Txt w="semibold" size={14} color={color.ink}>
                        {q.name}
                      </Txt>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Icon size={13} color={color.muted} strokeWidth={2} />
                        <Txt size={12} color={color.muted}>
                          {q.type}
                        </Txt>
                      </View>
                    </View>
                    <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: color.skyTint }}>
                      <Txt w="semibold" size={12} color={color.anugrahBlue} tabular>
                        {q.dates} · {q.days} {s.daysUnit}
                      </Txt>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Pressable onPress={() => resolve(q.name)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 11, borderRadius: 12, backgroundColor: color.success }}>
                      <Check size={17} color={color.white} strokeWidth={2.5} />
                      <Txt w="semibold" size={14} color={color.white}>
                        {s.adm.approve}
                      </Txt>
                    </Pressable>
                    <Pressable onPress={() => resolve(q.name)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 11, borderRadius: 12, backgroundColor: color.white, borderWidth: 1, borderColor: color.line }}>
                      <X size={17} color={color.danger} strokeWidth={2.5} />
                      <Txt w="semibold" size={14} color={color.danger}>
                        {s.adm.reject}
                      </Txt>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </>
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

/** Worked hours between clock-in and clock-out (HH:MM strings), localized. */
function workDuration(inT: string | null | undefined, outT: string | null | undefined, lang: string, zero: string): string {
  if (!inT || !outT) return zero;
  const [ih, im] = inT.split(':').map(Number);
  const [oh, om] = outT.split(':').map(Number);
  let mins = oh * 60 + om - (ih * 60 + im);
  if (mins < 0) mins += 24 * 60;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return lang === 'id' ? `${h}j ${m}m` : `${h}h ${m}m`;
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
