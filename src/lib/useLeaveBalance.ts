import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { fetchLeaveBalance, type LeaveBalance } from './leave';

/**
 * Live annual-leave balance for the signed-in employee. Loads on mount and
 * re-fetches whenever any of their leave requests change (e.g. an admin approves
 * one) via Supabase Realtime — so the card updates without a manual reload.
 */
export function useLeaveBalance(userId: string, reloadKey?: number) {
  const [balance, setBalance] = useState<LeaveBalance | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setBalance(await fetchLeaveBalance(userId));
  }, [userId]);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel(`leave-balance:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leave_requests', filter: `user_id=eq.${userId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [userId, load]);

  return { balance, reload: load };
}
