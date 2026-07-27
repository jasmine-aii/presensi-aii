import React, { useMemo, useState } from 'react';
import { View, ScrollView, TextInput } from 'react-native';
import { CalendarDays, Tag } from 'lucide-react-native';
import { color, space, radius, interFamily } from '../theme';
import { Txt, Button, SelectField, ResultDialog, DateField, AttachmentField, Toast } from '../components';
import { TopAppBar } from '../components/TopAppBar';
import { useLang } from '../i18n/LangContext';
import { useAuth } from '../auth/AuthContext';
import { uploadLeaveAttachment } from '../lib/storage';
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
  /** Preselect a request type (e.g. from the Home quick menu). */
  initialType?: LeaveType;
}

export function LeaveRequestScreen({ onBack, onSubmitted, initialType }: LeaveRequestScreenProps) {
  const { s } = useLang();
  const { session } = useAuth();
  const userId = session?.user.id ?? '';

  const [type, setType] = useState<LeaveType>(initialType ?? 'cuti_tahunan');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [reason, setReason] = useState('');
  const [attachFile, setAttachFile] = useState<any | null>(null);
  const [errKey, setErrKey] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
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
      case 'attach':
        return s.leave.attachErr;
      case 'big':
        return s.leave.attachTooBig;
      case 'reason':
        return s.leave.errReason;
      default:
        return null;
    }
  };

  const submit = async () => {
    setErrKey(null);
    // Required-field guard: keep the button enabled, nudge with a toast instead.
    if (!isValidISO(start) || !isValidISO(end) || !reason.trim()) {
      setToast(s.leave.toastRequired);
      return;
    }
    setSubmitting(true);

    let attachmentPath: string | null = null;
    if (attachFile) {
      if (attachFile.size > 5 * 1024 * 1024) {
        setSubmitting(false);
        setErrKey('big');
        return;
      }
      attachmentPath = await uploadLeaveAttachment(userId, attachFile);
      if (!attachmentPath) {
        setSubmitting(false);
        setErrKey('attach');
        return;
      }
    }

    const res: SubmitResult = await submitLeave(userId, {
      type,
      startDate: start,
      endDate: end,
      reason: reason.trim() || null,
      attachmentPath,
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

  const Label = ({ children, required }: { children: string; required?: boolean }) => (
    <Txt w="semibold" size={13} color={color.muted} style={{ marginBottom: space.sm }}>
      {children}
      {required ? <Txt color={color.danger}> *</Txt> : null}
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
          required
        />

        <View style={{ flexDirection: 'row', gap: space.md }}>
          <View style={{ flex: 1 }}>
            <DateField label={s.leave.fStart} value={start} onChange={setStart} min={todayISO()} required />
          </View>
          <View style={{ flex: 1 }}>
            <DateField label={s.leave.fEnd} value={end} onChange={setEnd} min={start || todayISO()} required />
          </View>
        </View>

        <View>
          <Label required>{s.leave.fReason}</Label>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder={s.leave.fReasonPh}
            placeholderTextColor={color.muted}
            multiline
            style={[inputStyle, { minHeight: 88, textAlignVertical: 'top' }]}
          />
        </View>

        <AttachmentField
          label={s.leave.fAttachment}
          fileName={attachFile?.name ?? null}
          onPick={setAttachFile}
          hint={s.leave.attachHint}
          pickLabel={s.leave.attachPick}
        />

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
          disabled={submitting}
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

      <Toast message={toast} onHide={() => setToast(null)} tone="error" />
    </View>
  );
}

export default LeaveRequestScreen;
