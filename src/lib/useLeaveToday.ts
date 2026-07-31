import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { todayISO } from './leave';

/**
 * True if the signed-in user has an active (pending or approved) leave request
 * covering today — used to block clock-in while on leave.
 */
export function useLeaveToday(userId: string): boolean {
  const [onLeave, setOnLeave] = useState(false);
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    const today = todayISO();
    supabase
      .from('leave_requests')
      .select('id')
      .eq('user_id', userId)
      .in('status', ['pending', 'approved'])
      .lte('start_date', today)
      .gte('end_date', today)
      .limit(1)
      .then(({ data }) => {
        if (alive) setOnLeave((data?.length ?? 0) > 0);
      });
    return () => {
      alive = false;
    };
  }, [userId]);
  return onLeave;
}
