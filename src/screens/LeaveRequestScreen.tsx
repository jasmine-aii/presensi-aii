import React, { useMemo, useState } from 'react';
import { View, ScrollView, TextInput } from 'react-native';
import { CalendarDays, Tag } from 'lucide-react-native';
import { color, space, radius, interFamily } from '../theme';
import { Txt, Button, SelectField, ResultDialog, DateField } from '../components';
import { TopAppBar } from '../components/TopAppBar';
import { useLang } from '../i18n/LangContext';
import { useAuth } from '../auth/AuthContext';
import {
  submitLeave,
  workingDaysBetween,
  todayISO,
  LEAVE_TYPES,
  type LeaveType,
  type SubmitResult,
} from '../lib/leave';

/** True for a real calendar date in strict YYYY-MM-DD form. */
function isValidISO(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

export interface LeaveRequestScreenProps {
  onBack: () => void;
  onSubmitted: () => void;
}

export function LeaveRequestScreen({ onBack, onSubmitted }: LeaveRequestScreenProps) {
  const { s } = useLang();
  const { session } = useAuth();
  const userId = session?.user.id ?? '';

  const [type, setType] = useState<LeaveType>('cuti_tahunan');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [reason, setReason] = useState('');
  const [errKey, setErrKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const typeOptions = useMemo(
    () => LEAVE_TYPES.map((t) => ({ value: t, label: s.leave.kind[t] })),
    [s],
  );

  const datesValid = isValidISO(start) && isValidISO(end);
  const days = datesValid && end >= start ? workingDaysBetween(start, end) : 0;

  const errText = (): string | null => {
    switch (errKey) {
      case 'date':
        return s.leave.errDate;
      case 'range':
        return s.leave.errRange;
      case 'past':
        return s.leave.errPast;
      case 'quota':
        return s.leave.errQuota;
      case 'overlap':
        return s.leave.errOverlap;
      case 'db':
        return s.leave.errDb;
      default:
        return null;
    }
  };

  const submit = async () => {
    setErrKey(null);
    if (!isValidISO(start) || !isValidISO(end)) {
      setErrKey('date');
      return;
    }
    setSubmitting(true);
    const res: SubmitResult = await submitLeave(userId, {
      type,
      startDate: start,
      endDate: end,
      reason: reason.trim() || null,
    });
    setSubmitting(false);
    if (res.ok) {
      setSuccess(true);
    } else {
      setErrKey(res.code);
    }
  };

  const inputStyle = {
    fontFamily: interFamily('regular'),
    fontSize: 14,
    color: color.ink,
    backgroundColor: color.white,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
  } as const;

  const Label = ({ children }: { children: string }) => (
    <Txt w="semibold" size={13} color={color.muted} style={{ marginBottom: space.sm }}>
      {children}
    </Txt>
  );

  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
      <TopAppBar title={s.leave.formTitle} onBack={onBack} />

      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xl, gap: space.lg }}>
        <SelectField
          label={s.leave.fType}
          value={type}
          options={typeOptions}
          onChange={(v) => setType(v as LeaveType)}
          icon={Tag}
        />

        <View style={{ flexDirection: 'row', gap: space.md }}>
          <View style={{ flex: 1 }}>
            <DateField label={s.leave.fStart} value={start} onChange={setStart} min={todayISO()} />
          </View>
          <View style={{ flex: 1 }}>
            <DateField label={s.leave.fEnd} value={end} onChange={setEnd} min={start || todayISO()} />
          </View>
        </View>

        <View>
          <Label>{s.leave.fReason}</Label>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder={s.leave.fReasonPh}
            placeholderTextColor={color.muted}
            multiline
            style={[inputStyle, { minHeight: 88, textAlignVertical: 'top' }]}
          />
        </View>

        {/* Duration summary */}
        {days > 0 && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.sm,
              backgroundColor: color.skyTint,
              borderRadius: radius.sm,
              paddingHorizontal: space.md,
              paddingVertical: space.md,
            }}
          >
            <CalendarDays size={18} color={color.anugrahBlue} strokeWidth={2} />
            <Txt size={13} color={color.deepNavy}>
              {s.leave.summaryDays}: {days} {s.leave.daysWork}
            </Txt>
          </View>
        )}

        {errText() && (
          <Txt size={13} color={color.danger} style={{ lineHeight: 18 }}>
            {errText()}
          </Txt>
        )}

        <Button
          label={submitting ? s.leave.submitting : s.leave.submit}
          size="lg"
          fullWidth
          disabled={submitting || !datesValid}
          onPress={submit}
        />
      </ScrollView>

      <ResultDialog
        visible={success}
        kind="success"
        title={s.leave.successTitle}
        message={s.leave.successMsg}
        actionLabel={s.dlg.done}
        onClose={() => {
          setSuccess(false);
          onSubmitted();
        }}
      />
    </View>
  );
}

export default LeaveRequestScreen;
