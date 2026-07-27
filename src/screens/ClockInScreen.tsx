import React, { useRef, useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShieldCheck, RefreshCw } from 'lucide-react-native';
import { CameraView } from 'expo-camera';
import { color, space, radius } from '../theme';
import { Txt, Button, Badge, DataTag, TopAppBar, CameraViewfinder, MiniMap, ResultDialog, SelectField, type ResultKind } from '../components';
import type { BadgeTone } from '../components/Badge';
import { useLang } from '../i18n/LangContext';
import { useNow } from '../lib/useNow';
import { timeStr, timeShort } from '../lib/format';
import { useLocation } from '../lib/useLocation';
import { captureSelfie } from '../lib/camera';
import { OFFICE, formatCoord, formatDistance } from '../lib/office';

type ClockConfirm = (p: { time: string; lat: number | null; lng: number | null; photoBase64: string | null }) => Promise<boolean> | boolean;

export function ClockInScreen({ onBack, onConfirm, onSwitchMode, alreadyDone }: { onBack?: () => void; onConfirm?: ClockConfirm; onSwitchMode?: (mode: 'in' | 'out') => void; alreadyDone?: boolean }) {
  const { s, lang } = useLang();
  const now = useNow(1000);
  const clock = timeStr(now);
  const insets = useSafeAreaInsets();
  const loc = useLocation();
  const cameraRef = useRef<CameraView>(null);
  const [result, setResult] = useState<ResultKind | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
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
    if (!canConfirm || submitting || alreadyDone) return;
    setSubmitting(true);
    confirmedTime.current = timeShort(now);
    const photoBase64 = await captureSelfie(cameraRef.current);
    setCapturedUri(photoBase64 ? `data:image/jpeg;base64,${photoBase64}` : null);
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
      <ScrollView contentContainerStyle={{ padding: space.lg }}>
        <View style={{ marginBottom: space.lg }}>
          <SelectField
            label={s.home.actionType}
            value="in"
            options={[
              { value: 'in', label: 'Clock In' },
              { value: 'out', label: 'Clock Out' },
            ]}
            onChange={(v) => v === 'out' && onSwitchMode?.('out')}
          />
        </View>
        <Txt size={13} color={color.muted} style={{ marginBottom: space.md }}>
          {s.in.photoHint}
        </Txt>

        <CameraViewfinder height={300} coord={coordText} time={clock} cameraRef={cameraRef} permMessage={s.loc.permCam} busy={submitting} busyMessage={s.dlg.processing} />
        <Txt size={12} color={color.muted} style={{ marginTop: space.md, textAlign: 'center' }}>
          {s.in.faceGuide}
        </Txt>

        {/* Location card */}
        <View style={{ marginTop: space.lg, backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.lg, padding: space.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md }}>
            <Txt w="bold" size={14} color={color.ink}>
              {s.in.locTitle}
            </Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
              <Badge tone={geo.tone} variant="soft" dot label={geo.label} />
              <Pressable onPress={loc.refresh} hitSlop={8} accessibilityLabel={s.loc.retry}>
                <RefreshCw size={16} color={color.muted} strokeWidth={2} />
              </Pressable>
            </View>
          </View>

          <MiniMap height={120} />

          <View style={{ marginTop: space.md }}>
            <Txt w="semibold" size={14} color={color.ink}>
              {OFFICE.name[lang]}
            </Txt>
            <Txt size={13} color={color.muted} style={{ lineHeight: 19 }}>
              {OFFICE.address[lang]}
            </Txt>
            {loc.distanceM != null && (
              <Txt size={12} color={loc.inRadius ? color.success : color.danger} tabular style={{ marginTop: space.sm }}>
                {formatDistance(loc.distanceM, lang)} {s.loc.away}
              </Txt>
            )}
          </View>

          <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md, flexWrap: 'wrap' }}>
            <DataTag label={s.in.coord} value={coordText} tone="brand" />
            <DataTag label={s.in.nowLabel} value={clock} tone="navy" />
          </View>
        </View>
      </ScrollView>

      {/* Confirm */}
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.lg + insets.bottom, backgroundColor: color.paper }}>
        <Button variant="primary" size="lg" fullWidth label={s.in.confirm} disabled={!canConfirm || submitting || alreadyDone} onPress={onConfirmPress} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, marginTop: space.md, paddingHorizontal: space.sm }}>
          {alreadyDone ? (
            <Txt w="semibold" size={12} color={color.success} style={{ textAlign: 'center' }}>
              {s.in.alreadyDone}
            </Txt>
          ) : loc.status === 'ready' && !loc.inRadius ? (
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
        imageUri={result === 'success' ? capturedUri : undefined}
        onClose={closeDialog}
      />
    </View>
  );
}

export default ClockInScreen;
