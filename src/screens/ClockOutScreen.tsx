import React from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin } from 'lucide-react-native';
import { color, elevation } from '../theme';
import { Txt, Button, TopAppBar, CameraViewfinder } from '../components';
import { useLang } from '../i18n/LangContext';
import { useNow } from '../lib/useNow';
import { timeStr, timeShort } from '../lib/format';
import { SAMPLE_COORD } from '../lib/data';

const CLOCK_IN_TIME = '08:41';

export function ClockOutScreen({ onBack, onConfirm }: { onBack?: () => void; onConfirm?: () => void }) {
  const { s, lang } = useLang();
  const now = useNow(1000);
  const clock = timeStr(now);
  const out = timeShort(now);
  const insets = useSafeAreaInsets();

  const totals = {
    total: lang === 'id' ? '8j 31m' : '8h 31m',
    ot: '12m',
    brk: lang === 'id' ? '1j' : '1h',
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
      <TopAppBar title={s.out.title} onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: 18 }}>
        <Txt size={13} color={color.muted} style={{ marginBottom: 14 }}>
          {s.out.photoHint}
        </Txt>

        <CameraViewfinder height={260} oval={{ w: 150, h: 185 }} coord={SAMPLE_COORD} time={clock} placeholder={s.out.title} />
        <Txt w="semibold" size={14} color={color.ink} style={{ marginTop: 12, textAlign: 'center' }}>
          {s.out.good}
        </Txt>

        {/* Work summary card */}
        <View
          style={{
            marginTop: 18,
            backgroundColor: color.white,
            borderWidth: 1,
            borderColor: color.line,
            borderRadius: 24,
            padding: 22,
            overflow: 'hidden',
            ...elevation('soft'),
          }}
        >
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: color.humanAccent }} />
          <Txt w="bold" size={14} color={color.ink} style={{ marginBottom: 18 }}>
            {s.out.summaryTitle}
          </Txt>

          {/* In / Out */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Txt size={12} color={color.muted}>
                {s.out.inAt}
              </Txt>
              <Txt w="extrabold" size={24} color={color.ink} tabular>
                {CLOCK_IN_TIME}
              </Txt>
            </View>
            <View style={{ width: 1, alignSelf: 'stretch', backgroundColor: color.line }} />
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Txt size={12} color={color.muted}>
                {s.out.outAt}
              </Txt>
              <Txt w="extrabold" size={24} color={color.anugrahBlue} tabular>
                {out}
              </Txt>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: color.line, marginTop: 4, marginBottom: 16 }} />

          {/* Totals */}
          <View style={{ flexDirection: 'row' }}>
            <TotalCell label={s.out.total} value={totals.total} />
            <TotalCell label={s.out.ot} value={totals.ot} bordered />
            <TotalCell label={s.out.brk} value={totals.brk} />
          </View>
        </View>

        {/* Location row */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            marginTop: 14,
            backgroundColor: color.white,
            borderWidth: 1,
            borderColor: color.line,
            borderRadius: 16,
            padding: 14,
          }}
        >
          <MapPin size={20} color={color.anugrahBlue} strokeWidth={2} />
          <View style={{ flex: 1 }}>
            <Txt w="semibold" size={14} color={color.ink}>
              {s.in.office}
            </Txt>
            <Txt size={12} color={color.muted} numberOfLines={1}>
              {s.in.address}
            </Txt>
          </View>
        </View>
      </ScrollView>

      {/* Confirm */}
      <View style={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 16 + insets.bottom, backgroundColor: color.paper }}>
        <Button variant="primary" size="lg" fullWidth label={s.out.confirm} onPress={onConfirm} />
      </View>
    </View>
  );
}

function TotalCell({ label, value, bordered }: { label: string; value: string; bordered?: boolean }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        borderLeftWidth: bordered ? 1 : 0,
        borderRightWidth: bordered ? 1 : 0,
        borderColor: color.line,
      }}
    >
      <Txt w="extrabold" size={20} color={color.ink} tabular>
        {value}
      </Txt>
      <Txt size={12} color={color.muted} style={{ marginTop: 2 }}>
        {label}
      </Txt>
    </View>
  );
}

export default ClockOutScreen;
