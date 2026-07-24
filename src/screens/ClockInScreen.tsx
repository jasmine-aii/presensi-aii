import React, { useRef, useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShieldCheck, RefreshCw } from 'lucide-react-native';
import { CameraView } from 'expo-camera';
import { color } from '../theme';
import { Txt, Button, Badge, DataTag, TopAppBar, CameraViewfinder, MiniMap, ResultDialog, type ResultKind } from '../components';
import type { BadgeTone } from '../components/Badge';
import { useLang } from '../i18n/LangContext';
import { useNow } from '../lib/useNow';
import { timeStr, timeShort } from '../lib/format';
import { useLocation } from '../lib/useLocation';
import { OFFICE, formatCoord, formatDistance } from '../lib/office';

type ClockConfirm = (p: { time: string; lat: number | null; lng: number | null; photoBase64: string | null }) => Promise<boolean> | boolean;

export function ClockInScreen({ onBack, onConfirm }: { onBack?: () => void; onConfirm?: ClockConfirm }) {
  const { s, lang } = useLang();
  const now = useNow(1000);
  const clock = timeStr(now);
  const insets = useSafeAreaInsets();
  const loc = useLocation();
  const cameraRef = useRef<CameraView>(null);
  const [result, setResult] = useState<ResultKind | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const confirmedTime = useRef<string>('');

  const coordText = loc.coords ? formatCoord(loc.coords.lat, loc.coords.lng) : '—';
  const canConfirm = loc.inRadius === true;

  const geo: { tone: BadgeTone; label: string } =
    loc.status === 'locating'
      ? { tone: 'neutral', label: s.loc.locating }
      : loc.status === 'denied'
        ? { tone: 'warning', label: s.loc.permGeo }
        : loc.status === 'error'
          ? { tone: 'neutral', label: s.loc.unavailable }
          : loc.inRadius
            ? { tone: 'success', label: s.loc.within }
            : { tone: 'danger', label: s.loc.outside };

  const onConfirmPress = async () => {
    if (!canConfirm || submitting) return;
    setSubmitting(true);
    confirmedTime.current = timeShort(now);
    let photoBase64: string | null = null;
    try {
      const photo = await cameraRef.current?.takePictureAsync?.({ base64: true, quality: 0.4 });
      photoBase64 = photo?.base64 ?? null;
    } catch {
      // capture is best-effort; geofence is the hard gate
    }
    const ok = await onConfirm?.({ time: confirmedTime.current, lat: loc.coords?.lat ?? null, lng: loc.coords?.lng ?? null, photoBase64 });
    setSubmitting(false);
    setResult(ok === false ? 'fail' : 'success');
  };

  const closeDialog = () => {
    const wasSuccess = result === 'success';
    setResult(null);
    if (wasSuccess) onBack?.(); // pop back to Home; navigator already recorded the clock-in
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
      <TopAppBar title={s.in.title} onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: 18 }}>
        <Txt size={13} color={color.muted} style={{ marginBottom: 14 }}>
          {s.in.photoHint}
        </Txt>

        <CameraViewfinder height={300} coord={coordText} time={clock} cameraRef={cameraRef} permMessage={s.loc.permCam} />
        <Txt size={12} color={color.muted} style={{ marginTop: 10, textAlign: 'center' }}>
          {s.in.faceGuide}
        </Txt>

        {/* Location card */}
        <View style={{ marginTop: 18, backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: 22, padding: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Txt w="bold" size={14} color={color.ink}>
              {s.in.locTitle}
            </Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Badge tone={geo.tone} variant="soft" dot label={geo.label} />
              <Pressable onPress={loc.refresh} hitSlop={8} accessibilityLabel={s.loc.retry}>
                <RefreshCw size={16} color={color.muted} strokeWidth={2} />
              </Pressable>
            </View>
          </View>

          <MiniMap height={120} />

          <View style={{ marginTop: 14 }}>
            <Txt w="semibold" size={14} color={color.ink}>
              {OFFICE.name[lang]}
            </Txt>
            <Txt size={13} color={color.muted} style={{ lineHeight: 19 }}>
              {OFFICE.address[lang]}
            </Txt>
            {loc.distanceM != null && (
              <Txt size={12} color={loc.inRadius ? color.success : color.danger} tabular style={{ marginTop: 6 }}>
                {formatDistance(loc.distanceM, lang)} {s.loc.away}
              </Txt>
            )}
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <DataTag label={s.in.coord} value={coordText} tone="brand" />
            <DataTag label={s.in.nowLabel} value={clock} tone="navy" />
          </View>
        </View>
      </ScrollView>

      {/* Confirm */}
      <View style={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 16 + insets.bottom, backgroundColor: color.paper }}>
        <Button variant="primary" size="lg" fullWidth label={s.in.confirm} disabled={!canConfirm || submitting} onPress={onConfirmPress} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, paddingHorizontal: 8 }}>
          {loc.status === 'ready' && !loc.inRadius ? (
            <Txt size={12} color={color.danger} style={{ textAlign: 'center' }}>
              {s.loc.outsideMsg}
            </Txt>
          ) : (
            <>
              <ShieldCheck size={14} color={color.muted} strokeWidth={2} />
              <Txt size={12} color={color.muted}>
                {s.in.required}
              </Txt>
            </>
          )}
        </View>
      </View>

      <ResultDialog
        visible={result !== null}
        kind={result ?? 'success'}
        title={result === 'fail' ? s.dlg.failTitle : s.in.successTitle}
        message={result === 'fail' ? s.dlg.failMsg : s.in.successMsg}
        actionLabel={result === 'fail' ? s.dlg.retry : s.dlg.done}
        onClose={closeDialog}
      />
    </View>
  );
}

export default ClockInScreen;
