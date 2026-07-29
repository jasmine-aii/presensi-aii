import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator, Linking } from 'react-native';
import { Plus, Sun, Thermometer, FileText, Briefcase, Star, Paperclip, type LucideIcon } from 'lucide-react-native';
import { color, space, radius } from '../theme';
import { Txt, IconTile, StatusBadge, Dialog, Button } from '../components';
import { useLang } from '../i18n/LangContext';
import { useAuth } from '../auth/AuthContext';
import { rangeStr } from '../lib/format';
import { signedLeaveUrls } from '../lib/storage';
import { supabase } from '../lib/supabase';
import {
  fetchMyLeaves,
  fetchLeaveBalance,
  cancelLeave,
  todayISO,
  type LeaveRequest,
  type LeaveType,
  type LeaveBalance,
} from '../lib/leave';

const typeIcon: Record<LeaveType, LucideIcon> = {
  cuti_tahunan: Sun,
  sakit: Thermometer,
  unpaid_leave: FileText,
  dinas_luar: Briefcase,
  izin_khusus: Star,
};

export interface LeaveScreenProps {
  onNew: () => void;
  /** Bump to force a reload (e.g. after submitting a request). */
  reloadKey?: number;
}

export function LeaveScreen({ onNew, reloadKey }: LeaveScreenProps) {
  const { s, lang } = useLang();
  const { session } = useAuth();
  const userId = session?.user.id ?? '';

  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [reqs, setReqs] = useState<LeaveRequest[]>([]);
  const [confirm, setConfirm] = useState<LeaveRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [attachUrls, setAttachUrls] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!userId) return;
    const [b, r] = await Promise.all([fetchLeaveBalance(userId), fetchMyLeaves(userId)]);
    setBalance(b);
    setReqs(r);
    setLoading(false);
    const paths = r.map((x) => x.attachmentPath).filter((x): x is string => !!x);
    if (paths.length) setAttachUrls(await signedLeaveUrls(paths));
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load, reloadKey]);

  // Live-refresh when an admin approves/rejects one of the employee's requests.
  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel(`leave-screen:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests', filter: `user_id=eq.${userId}` }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [userId, load]);

  const canCancel = (r: LeaveRequest) =>
    r.status === 'pending' || (r.status === 'approved' && r.startDate > todayISO());

  const doCancel = async () => {
    if (!confirm) return;
    setBusy(true);
    const ok = await cancelLeave(confirm.id);
    setBusy(false);
    setConfirm(null);
    if (ok) load();
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: space.lg,
          paddingVertical: space.lg,
          backgroundColor: color.white,
          borderBottomWidth: 1,
          borderBottomColor: color.line,
        }}
      >
        <Txt w="bold" size={17} color={color.ink}>
          {s.leave.title}
        </Txt>
        <Pressable
          accessibilityRole="button"
          onPress={onNew}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.xs,
            paddingVertical: space.sm,
            paddingHorizontal: space.md,
            backgroundColor: color.anugrahBlue,
            borderRadius: radius.pill,
          }}
        >
          <Plus size={14} color={color.white} strokeWidth={2.25} />
          <Txt w="semibold" size={13} color={color.white}>
            {s.leave.newReq}
          </Txt>
        </Pressable>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={color.anugrahBlue} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xl }}>
          {/* Annual-leave balance */}
          {balance && (
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: color.white,
                borderWidth: 1,
                borderColor: color.line,
                borderRadius: radius.md,
                padding: space.lg,
                marginBottom: space.xl,
              }}
            >
              {(
                [
                  [s.home.entitle, balance.quota, color.ink],
                  [s.home.taken, balance.taken, color.warning],
                  [s.home.balance, balance.remaining, color.success],
                ] as const
              ).map(([label, value, hex], i) => (
                <View
                  key={label}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    borderLeftWidth: i === 0 ? 0 : 1,
                    borderLeftColor: color.line,
                  }}
                >
                  <Txt w="extrabold" size={22} color={hex} tabular>
                    {value}
                  </Txt>
                  <Txt size={12} color={color.muted} style={{ marginTop: space.xs }}>
                    {label}
                  </Txt>
                </View>
              ))}
            </View>
          )}

          {/* Requests */}
          <Txt w="bold" size={14} color={color.ink} style={{ marginBottom: space.md }}>
            {s.leave.reqTitle}
          </Txt>
          {reqs.length === 0 ? (
            <Txt size={13} color={color.muted} style={{ paddingVertical: space.lg }}>
              {s.leave.empty}
            </Txt>
          ) : (
            <View style={{ gap: space.md }}>
              {reqs.map((r) => {
                const Icon = typeIcon[r.type];
                return (
                  <View
                    key={r.id}
                    style={{
                      backgroundColor: color.white,
                      borderWidth: 1,
                      borderColor: color.line,
                      borderRadius: radius.md,
                      padding: space.lg,
                      gap: space.md,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                      <IconTile icon={Icon} size={42} radius={12} iconSize={22} />
                      <View style={{ flex: 1 }}>
                        <Txt w="semibold" size={14} color={color.ink}>
                          {s.leave.kind[r.type]}
                        </Txt>
                        <Txt size={12} color={color.muted} tabular style={{ marginTop: space.xs }}>
                          {rangeStr(r.startDate, r.endDate, lang)} · {r.days} {s.leave.daysWork}
                        </Txt>
                      </View>
                      <StatusBadge status={r.status} />
                    </View>

                    {r.reviewNote ? (
                      <Txt size={12} color={color.muted} style={{ lineHeight: 17 }}>
                        {s.leave.reviewNote}: {r.reviewNote}
                      </Txt>
                    ) : null}

                    {r.attachmentPath ? (
                      <Pressable
                        accessibilityRole="button"
                        disabled={!attachUrls[r.attachmentPath]}
                        onPress={() => {
                          const url = attachUrls[r.attachmentPath!];
                          if (url) Linking.openURL(url);
                        }}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, alignSelf: 'flex-start' }}
                      >
                        <Paperclip size={15} color={color.anugrahBlue} strokeWidth={2} />
                        <Txt w="semibold" size={13} color={color.anugrahBlue}>
                          {s.leave.viewAttachment}
                        </Txt>
                      </Pressable>
                    ) : null}

                    {canCancel(r) && (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => setConfirm(r)}
                        style={{ alignSelf: 'flex-start' }}
                      >
                        <Txt w="semibold" size={13} color={color.danger}>
                          {s.leave.cancelReq}
                        </Txt>
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* Cancel confirmation */}
      <Dialog visible={confirm != null} onClose={() => setConfirm(null)}>
        <Txt w="extrabold" size={17} color={color.ink}>
          {s.leave.cancelTitle}
        </Txt>
        <Txt size={14} color={color.muted} style={{ marginTop: space.sm, lineHeight: 20 }}>
          {s.leave.cancelMsg}
        </Txt>
        <View style={{ flexDirection: 'row', gap: space.md, marginTop: space.lg }}>
          <View style={{ flex: 1 }}>
            <Button label={s.leave.keep} variant="secondary" fullWidth onPress={() => setConfirm(null)} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label={busy ? '…' : s.leave.cancelYes} variant="primary" fullWidth onPress={doCancel} disabled={busy} />
          </View>
        </View>
      </Dialog>
    </View>
  );
}

export default LeaveScreen;
