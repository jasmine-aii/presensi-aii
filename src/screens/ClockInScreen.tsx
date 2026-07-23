import React from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShieldCheck } from 'lucide-react-native';
import { color } from '../theme';
import { Txt, Button, Badge, DataTag, TopAppBar, CameraViewfinder, MiniMap } from '../components';
import { useLang } from '../i18n/LangContext';
import { useNow } from '../lib/useNow';
import { timeStr } from '../lib/format';
import { SAMPLE_COORD } from '../lib/data';

export function ClockInScreen({ onBack, onConfirm }: { onBack?: () => void; onConfirm?: () => void }) {
  const { s } = useLang();
  const now = useNow(1000);
  const clock = timeStr(now);
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
      <TopAppBar title={s.in.title} onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: 18 }}>
        <Txt size={13} color={color.muted} style={{ marginBottom: 14 }}>
          {s.in.photoHint}
        </Txt>

        <CameraViewfinder height={300} coord={SAMPLE_COORD} time={clock} placeholder={s.in.title} />
        <Txt size={12} color={color.muted} style={{ marginTop: 10, textAlign: 'center' }}>
          {s.in.faceGuide}
        </Txt>

        {/* Location card */}
        <View
          style={{
            marginTop: 18,
            backgroundColor: color.white,
            borderWidth: 1,
            borderColor: color.line,
            borderRadius: 22,
            padding: 18,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Txt w="bold" size={14} color={color.ink}>
              {s.in.locTitle}
            </Txt>
            <Badge tone="success" variant="soft" dot label={s.in.inRadius} />
          </View>

          <MiniMap height={120} />

          <View style={{ marginTop: 14 }}>
            <Txt w="semibold" size={14} color={color.ink}>
              {s.in.office}
            </Txt>
            <Txt size={13} color={color.muted} style={{ lineHeight: 19 }}>
              {s.in.address}
            </Txt>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <DataTag label={s.in.coord} value={SAMPLE_COORD} tone="brand" />
            <DataTag label={s.in.nowLabel} value={clock} tone="navy" />
          </View>
        </View>
      </ScrollView>

      {/* Confirm */}
      <View style={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 16 + insets.bottom, backgroundColor: color.paper }}>
        <Button variant="primary" size="lg" fullWidth label={s.in.confirm} onPress={onConfirm} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 }}>
          <ShieldCheck size={14} color={color.muted} strokeWidth={2} />
          <Txt size={12} color={color.muted}>
            {s.in.required}
          </Txt>
        </View>
      </View>
    </View>
  );
}

export default ClockInScreen;
