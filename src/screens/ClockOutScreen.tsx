import React, { useRef, useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, RefreshCw, TriangleAlert } from 'lucide-react-native';
import { CameraView } from 'expo-camera';
import { color, elevation, space, radius } from '../theme';
import { Txt, Button, Badge, TopAppBar, CameraViewfinder, ResultDialog, SelectField, Dialog, type ResultKind } from '../components';
import type { BadgeTone } from '../components/Badge';
import { useLang } from '../i18n/LangContext';
import { useAuth } from '../auth/AuthContext';
import { useNow } from '../lib/useNow';
import { timeStr, timeShort } from '../lib/format';
import { useLocation } from '../lib/useLocation';
import { captureSelfie } from '../lib/camera';
import { parseShiftWindow, netWorkedMin, durationStr, FULL_DAY_MIN, BREAK_MIN } from '../lib/shifts';
import { OFFICE, formatCoord, formatDistance } from '../lib/office';

type ClockConfirm = (p: { time: string; lat: number | null; lng: number | null; photoBase64: string | null }) => Promise<boolean> | boolean;

export function ClockOutScreen({ onBack, onConfirm, clockInTime, name, onSwitchMode, alreadyDone }: { onBack?: () => void; onConfirm?: ClockConfirm; clockInTime?: string; name?: string; onSwitchMode?: (mode: 'in' | 'out') => void; alreadyDone?: boolean }) {
  const { s, lang } = useLang();
  const { profile } = useAuth();
  const firstName = (name ?? s.home.name).trim().split(' ')[0];
  const now = useNow(1000);
  const clock = timeStr(now);
  const out = timeShort(now);
  const insets = useSafeAreaInsets();
  const loc = useLocation();
  const cameraRef = useRef<CameraView>(null);
  const [result, setResult] = useState<ResultKind | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [warnOpen, setWarnOpen] = useState(false);
  const confirmedTime = useRef<string>('');
  const clockIn = clockInTime ?? '08:41';

  // Net work today (within shift window, minus break) vs the 8h target.
  const win = parseShiftWindow();
  const toMin = (t: string) => Number(t.split(':')[0]) * 60 + Number(t.split(':')[1]);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const inMin = clockInTime ? toMin(clockInTime) : win.startMin;
  const netMin = netWorkedMin(inMin, nowMin, win);
  const otMin = Math.max(0, netMin - FULL_DAY_MIN); // net worked beyond the 8h target
  const isEarly = netMin < FULL_DAY_MIN;

  const exempt = !!profile?.geofence_exempt;
  const coordText = loc.coords ? formatCoord(loc.coords.lat, loc.coords.lng) : '—';
  const canConfirm = exempt || loc.inRadius === true;

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

  const totals = {
    total: durationStr(netMin, lang),
    ot: durationStr(otMin, lang),
    brk: durationStr(BREAK_MIN, lang),
  };

  const onConfirmPress = () => {
    if (!canConfirm || submitting || alreadyDone) return;
    if (isEarly) {
      setWarnOpen(true);
      return;
    }
    proceed();
  };

  const proceed = async () => {
    setWarnOpen(false);
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
    if (wasSuccess) onBack?.(); // pop back to Home; navigator already recorded the clock-out
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
      <TopAppBar title={s.out.title} onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: space.lg }}>
        <View style={{ marginBottom: space.lg }}>
          <SelectField
            label={s.home.actionType}
            value="out"
            options={[
              { value: 'in', label: 'Clock In' },
              { value: 'out', label: 'Clock Out' },
            ]}
            onChange={(v) => v === 'in' && onSwitchMode?.('in')}
          />
        </View>
        <Txt size={13} color={color.muted} style={{ marginBottom: space.md }}>
          {s.out.photoHint}
        </Txt>

        <CameraViewfinder height={260} oval={{ w: 150, h: 185 }} coord={coordText} time={clock} cameraRef={cameraRef} permMessage={s.loc.permCam} busy={submitting} busyMessage={s.dlg.processing} />
        <Txt w="semibold" size={14} color={color.ink} style={{ marginTop: space.md, textAlign: 'center' }}>
          {s.out.good} {firstName}.
        </Txt>

        {/* Work summary card */}
        <View style={{ marginTop: space.lg, backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.lg, padding: space.xl, overflow: 'hidden', ...elevation('soft') }}>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: color.humanAccent }} />
          <Txt w="bold" size={14} color={color.ink} style={{ marginBottom: space.lg }}>
            {s.out.summaryTitle}
          </Txt>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: space.lg }}>
            <View style={{ flex: 1 }}>
              <Txt size={12} color={color.muted}>
                {s.out.inAt}
              </Txt>
              <Txt w="extrabold" size={24} color={color.ink} tabular>
                {clockIn}
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

          <View style={{ height: 1, backgroundColor: color.line, marginTop: space.xs, marginBottom: space.lg }} />

          <View style={{ flexDirection: 'row' }}>
            <TotalCell label={s.out.total} value={totals.total} />
            <TotalCell label={s.out.ot} value={totals.ot} bordered />
            <TotalCell label={s.out.brk} value={totals.brk} />
          </View>
        </View>

        {/* Location row */}
        <View style={{ marginTop: space.md, backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.md, padding: space.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <MapPin size={20} color={color.anugrahBlue} strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Txt w="semibold" size={14} color={color.ink}>
                {OFFICE.name[lang]}
              </Txt>
              <Txt size={12} color={color.muted} numberOfLines={1}>
                {OFFICE.address[lang]}
              </Txt>
            </View>
            <Pressable onPress={loc.refresh} hitSlop={8} accessibilityLabel={s.loc.retry}>
              <RefreshCw size={16} color={color.muted} strokeWidth={2} />
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.md }}>
            <Badge tone={geo.tone} variant="soft" dot label={geo.label} />
            {loc.distanceM != null && (
              <Txt size={12} color={loc.inRadius ? color.success : color.danger} tabular>
                {formatDistance(loc.distanceM, lang)} {s.loc.away}
              </Txt>
            )}
          </View>
          {loc.coords && loc.coords.accuracy > 30 && (
            <Txt size={12} color={color.warning} style={{ marginTop: space.sm, lineHeight: 16 }}>
              {s.loc.lowAccuracy}
            </Txt>
          )}
        </View>
      </ScrollView>

      {/* Confirm */}
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.lg + insets.bottom, backgroundColor: color.paper }}>
        <Button variant="primary" size="lg" fullWidth label={s.out.confirm} disabled={!canConfirm || submitting || alreadyDone} onPress={onConfirmPress} />
        {alreadyDone ? (
          <Txt w="semibold" size={12} color={color.success} style={{ textAlign: 'center', marginTop: space.md, paddingHorizontal: space.sm }}>
            {s.out.alreadyDone}
          </Txt>
        ) : exempt ? (
          <Txt w="semibold" size={12} color={color.anugrahBlue} style={{ textAlign: 'center', marginTop: space.md, paddingHorizontal: space.sm }}>
            {s.loc.exempt}
          </Txt>
        ) : (
          loc.status === 'ready' && !loc.inRadius && (
            <Txt size={12} color={color.danger} style={{ textAlign: 'center', marginTop: space.md, paddingHorizontal: space.sm }}>
              {s.loc.outsideMsg}
            </Txt>
          )
        )}
      </View>

      {/* Early clock-out warning */}
      <Dialog visible={warnOpen} onClose={() => setWarnOpen(false)} align="center" maxWidth={340}>
        <View style={{ width: 60, height: 60, borderRadius: radius.pill, backgroundColor: color.warningBg, alignItems: 'center', justifyContent: 'center', marginBottom: space.md }}>
          <TriangleAlert size={32} color={color.warning} strokeWidth={2} />
        </View>
        <Txt w="extrabold" size={18} color={color.ink} style={{ textAlign: 'center' }}>
          {s.out.earlyTitle}
        </Txt>
        <Txt size={14} color={color.muted} style={{ textAlign: 'center', lineHeight: 20, marginTop: space.sm }}>
          {s.out.earlyMsg} ({durationStr(netMin, lang)} / {durationStr(FULL_DAY_MIN, lang)})
        </Txt>
        <View style={{ alignSelf: 'stretch', marginTop: space.lg }}>
          <Button variant="primary" size="md" fullWidth label={s.out.earlyConfirm} onPress={proceed} />
        </View>
        <Pressable onPress={() => setWarnOpen(false)} style={{ marginTop: space.sm, paddingVertical: space.sm }}>
          <Txt w="semibold" size={15} color={color.muted}>
            {s.prof.cancel}
          </Txt>
        </Pressable>
      </Dialog>

      <ResultDialog
        visible={result !== null}
        kind={result ?? 'success'}
        title={result === 'fail' ? s.dlg.failTitle : s.out.successTitle}
        message={result === 'fail' ? s.dlg.failMsg : s.out.successMsg}
        actionLabel={result === 'fail' ? s.dlg.retry : s.dlg.done}
        imageUri={result === 'success' ? capturedUri : undefined}
        onClose={closeDialog}
      />
    </View>
  );
}

function TotalCell({ label, value, bordered }: { label: string; value: string; bordered?: boolean }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: bordered ? 1 : 0, borderRightWidth: bordered ? 1 : 0, borderColor: color.line }}>
      <Txt w="extrabold" size={20} color={color.ink} tabular>
        {value}
      </Txt>
      <Txt size={12} color={color.muted} style={{ marginTop: space.xs }}>
        {label}
      </Txt>
    </View>
  );
}

export default ClockOutScreen;
