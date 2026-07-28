import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { fetchMyLeaves, type LeaveRequest } from './leave';

/**
 * In-app notification inbox for the signed-in employee: their leave requests
 * that an admin has approved or rejected, newest first. Tracks how many are
 * unseen (a red bell badge) using AsyncStorage, and refreshes live via Supabase
 * Realtime when a decision lands. Unlike browser notifications, this needs no
 * permission and survives a page reload.
 */
export function useLeaveInbox(userId: string, reloadKey?: number) {
  const [items, setItems] = useState<LeaveRequest[]>([]);
  const [lastSeen, setLastSeen] = useState('');

  const load = useCallback(async () => {
    if (!userId) return;
    const all = await fetchMyLeaves(userId);
    const decided = all
      .filter((r) => (r.status === 'approved' || r.status === 'rejected') && r.reviewedAt)
      .sort((a, b) => (b.reviewedAt ?? '').localeCompare(a.reviewedAt ?? ''));
    setItems(decided);
    setLastSeen((await AsyncStorage.getItem(`leave_seen:${userId}`)) ?? '');
  }, [userId]);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  // Live refresh when the employee's own request is decided.
  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel(`leave-inbox:${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'leave_requests', filter: `user_id=eq.${userId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [userId, load]);

  const unseen = items.filter((i) => (i.reviewedAt ?? '') > lastSeen).length;

  const markSeen = useCallback(async () => {
    const newest = items[0]?.reviewedAt ?? '';
    if (newest && newest !== lastSeen) {
      setLastSeen(newest);
      await AsyncStorage.setItem(`leave_seen:${userId}`, newest);
    }
  }, [items, lastSeen, userId]);

  return { items, unseen, markSeen };
}
