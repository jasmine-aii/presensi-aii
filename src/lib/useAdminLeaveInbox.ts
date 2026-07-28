import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { fetchPendingLeaves, type AdminLeaveRequest } from './leave';

/**
 * Admin notification inbox: leave requests awaiting review, newest first, with
 * an unseen count (red bell badge) tracked in AsyncStorage and refreshed live
 * via Supabase Realtime when employees submit or requests get decided.
 */
export function useAdminLeaveInbox(userId: string, reloadKey?: number) {
  const [items, setItems] = useState<AdminLeaveRequest[]>([]);
  const [lastSeen, setLastSeen] = useState('');

  const load = useCallback(async () => {
    if (!userId) return;
    const pending = await fetchPendingLeaves();
    pending.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
    setItems(pending);
    setLastSeen((await AsyncStorage.getItem(`admin_leave_seen:${userId}`)) ?? '');
  }, [userId]);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  // Live refresh on any leave-request change (new submissions / decisions).
  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel(`admin-leave-inbox:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [userId, load]);

  const unseen = items.filter((i) => (i.createdAt ?? '') > lastSeen).length;

  const markSeen = useCallback(async () => {
    const newest = items[0]?.createdAt ?? '';
    if (newest && newest !== lastSeen) {
      setLastSeen(newest);
      await AsyncStorage.setItem(`admin_leave_seen:${userId}`, newest);
    }
  }, [items, lastSeen, userId]);

  return { items, unseen, markSeen };
}
