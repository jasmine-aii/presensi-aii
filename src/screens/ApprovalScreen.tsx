import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Pressable, TextInput, Linking, Image } from 'react-native';
import { Sun, Thermometer, FileText, Briefcase, Star, Paperclip, type LucideIcon } from 'lucide-react-native';
import { color, space, radius, interFamily } from '../theme';
import { Txt, Avatar, Button, StatusBadge, SegmentedTabs, Dialog } from '../components';
import { useLang } from '../i18n/LangContext';
import { rangeStr } from '../lib/format';
import { signedLeaveUrls } from '../lib/storage';
import {
  fetchPendingLeaves,
  fetchDecidedLeaves,
  reviewLeave,
  type AdminLeaveRequest,
  type LeaveType,
} from '../lib/leave';

const typeIcon: Record<LeaveType, LucideIcon> = {
  cuti_tahunan: Sun,
  sakit: Thermometer,
  unpaid_leave: FileText,
  dinas_luar: Briefcase,
  izin_khusus: Star,
};

type Decision = { req: AdminLeaveRequest; kind: 'approved' | 'rejected' };

export interface ApprovalScreenProps {
  /** Notify the navigator to refresh the pending-count badge after a decision. */
  onChanged?: () => void;
}

export function ApprovalScreen({ onChanged }: ApprovalScreenProps) {
  const { s, lang } = useLang();
  const [tab, setTab] = useState<'pending' | 'done'>('pending');
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<AdminLeaveRequest[]>([]);
  const [done, setDone] = useState<AdminLeaveRequest[]>([]);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [attachUrls, setAttachUrls] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const [p, d] = await Promise.all([fetchPendingLeaves(), fetchDecidedLeaves()]);
    setPending(p);
    setDone(d);
    setLoading(false);
    const paths = [...p, ...d].map((r) => r.attachmentPath).filter((x): x is string => !!x);
    if (paths.length) setAttachUrls(await signedLeaveUrls(paths));
  }, []);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const openDecision = (req: AdminLeaveRequest, kind: 'approved' | 'rejected') => {
    setNote('');
    setDecision({ req, kind });
  };

  const confirmDecision = async () => {
    if (!decision) return;
    setBusy(true);
    const ok = await reviewLeave(decision.req.id, decision.kind, note);
    setBusy(false);
    setDecision(null);
    if (ok) {
      await load();
      onChanged?.();
    }
  };

  const list = tab === 'pending' ? pending : done;

  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg, backgroundColor: color.white, borderBottomWidth: 1, borderBottomColor: color.line }}>
        <Txt w="bold" size={17} color={color.ink} style={{ marginBottom: space.lg }}>
          {s.adm.apprTitle}
        </Txt>
        <SegmentedTabs
          tabs={[
            { key: 'pending', label: pending.length ? `${s.adm.tabPending} · ${pending.length}` : s.adm.tabPending },
            { key: 'done', label: s.adm.tabDone },
          ]}
          active={tab}
          onChange={(k) => setTab(k as 'pending' | 'done')}
        />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={color.anugrahBlue} />
        </View>
      ) : list.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl }}>
          <Txt size={14} color={color.muted} style={{ textAlign: 'center' }}>
            {s.adm.apprEmpty}
          </Txt>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xl, gap: space.md }}>
          {list.map((r) => {
            const Icon = typeIcon[r.type];
            return (
              <View
                key={r.id}
                style={{ backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.md, padding: space.lg, gap: space.md }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                  <Avatar name={r.employeeName} size={42} />
                  <View style={{ flex: 1 }}>
                    <Txt w="bold" size={14} color={color.ink}>
                      {r.employeeName}
                    </Txt>
                    <Txt size={12} color={color.muted} tabular style={{ marginTop: space.xs }}>
                      {r.employeeId}
                    </Txt>
                  </View>
                  {tab === 'done' && <StatusBadge status={r.status} />}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                  <Icon size={16} color={color.anugrahBlue} strokeWidth={2} />
                  <Txt w="semibold" size={13} color={color.deepNavy}>
                    {s.leave.kind[r.type]}
                  </Txt>
                  <Txt size={12} color={color.muted} tabular>
                    · {rangeStr(r.startDate, r.endDate, lang)} · {r.days} {s.leave.daysWork}
                  </Txt>
                </View>

                {r.reason ? (
                  <Txt size={13} color={color.ink} style={{ lineHeight: 18 }}>
                    {r.reason}
                  </Txt>
                ) : null}

                {r.reviewNote ? (
                  <Txt size={12} color={color.muted} style={{ lineHeight: 17 }}>
                    {s.leave.reviewNote}: {r.reviewNote}
                  </Txt>
                ) : null}

                {r.attachmentPath ? (
                  <AttachmentPreview path={r.attachmentPath} url={attachUrls[r.attachmentPath]} label={s.leave.viewAttachment} loadingLabel={s.leave.loading} />
                ) : null}

                {tab === 'pending' && (
                  <View style={{ flexDirection: 'row', gap: space.md, marginTop: space.xs }}>
                    <View style={{ flex: 1 }}>
                      <Button label={s.adm.reject} variant="secondary" fullWidth onPress={() => openDecision(r, 'rejected')} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button label={s.adm.approve} variant="primary" fullWidth onPress={() => openDecision(r, 'approved')} />
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Decision confirmation with optional note */}
      <Dialog visible={decision != null} onClose={() => setDecision(null)}>
        <Txt w="extrabold" size={17} color={color.ink}>
          {decision?.kind === 'approved' ? s.adm.apprConfirmApprove : s.adm.apprConfirmReject}
        </Txt>
        {decision && (
          <Txt size={13} color={color.muted} style={{ marginTop: space.sm }}>
            {decision.req.employeeName} · {s.leave.kind[decision.req.type]} ·{' '}
            {rangeStr(decision.req.startDate, decision.req.endDate, lang)}
          </Txt>
        )}
        <Txt w="semibold" size={13} color={color.muted} style={{ marginTop: space.lg, marginBottom: space.sm }}>
          {s.adm.apprNote}
        </Txt>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder={s.adm.apprNotePh}
          placeholderTextColor={color.muted}
          multiline
          style={{
            fontFamily: interFamily('regular'),
            fontSize: 14,
            color: color.ink,
            backgroundColor: color.white,
            borderWidth: 1,
            borderColor: color.line,
            borderRadius: radius.sm,
            paddingHorizontal: space.md,
            paddingVertical: space.md,
            minHeight: 72,
            textAlignVertical: 'top',
          }}
        />
        <View style={{ flexDirection: 'row', gap: space.md, marginTop: space.lg }}>
          <View style={{ flex: 1 }}>
            <Button label={s.adm.cancel} variant="secondary" fullWidth onPress={() => setDecision(null)} />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={busy ? '…' : decision?.kind === 'approved' ? s.adm.approve : s.adm.reject}
              variant="primary"
              fullWidth
              disabled={busy}
              onPress={confirmDecision}
            />
          </View>
        </View>
      </Dialog>
    </View>
  );
}

/** Inline attachment: image shows as a thumbnail (tap to open full); PDF/other
 *  shows a link. Falls back to a loading hint until the signed URL resolves. */
function AttachmentPreview({ path, url, label, loadingLabel }: { path: string; url?: string; label: string; loadingLabel: string }) {
  const isImage = /\.(png|jpe?g|webp|gif|heic|bmp)$/i.test(path);
  if (!url) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, alignSelf: 'flex-start' }}>
        <Paperclip size={15} color={color.muted} strokeWidth={2} />
        <Txt size={13} color={color.muted}>
          {loadingLabel}
        </Txt>
      </View>
    );
  }
  if (isImage) {
    return (
      <Pressable accessibilityRole="button" onPress={() => Linking.openURL(url)} style={{ alignSelf: 'flex-start', gap: space.xs }}>
        <Image source={{ uri: url }} style={{ width: 220, height: 150, borderRadius: radius.sm, backgroundColor: color.line }} resizeMode="cover" />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
          <Paperclip size={13} color={color.anugrahBlue} strokeWidth={2} />
          <Txt w="semibold" size={12} color={color.anugrahBlue}>
            {label}
          </Txt>
        </View>
      </Pressable>
    );
  }
  return (
    <Pressable accessibilityRole="button" onPress={() => Linking.openURL(url)} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, alignSelf: 'flex-start' }}>
      <Paperclip size={15} color={color.anugrahBlue} strokeWidth={2} />
      <Txt w="semibold" size={13} color={color.anugrahBlue}>
        {label}
      </Txt>
    </Pressable>
  );
}

export default ApprovalScreen;
