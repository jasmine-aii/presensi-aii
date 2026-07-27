import { useEffect } from 'react';
import { supabase } from './supabase';
import { useLang } from '../i18n/LangContext';

/** Web `Notification` if available in this runtime (undefined on native). */
const N: typeof Notification | undefined =
  typeof window !== 'undefined' && 'Notification' in window ? window.Notification : undefined;

/**
 * While the app is open, listens (via Supabase Realtime) for the signed-in
 * employee's own leave requests being approved or rejected and pops a browser
 * notification. Reuses the permission the Home reminders already request; if it
 * isn't granted, this silently does nothing. Same limitation as clock
 * reminders — no background push. Requires `leave_requests` to be in the
 * `supabase_realtime` publication (see schema.sql).
 */
export function useLeaveNotifications(userId: string | undefined) {
  const { s } = useLang();

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`leave:${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'leave_requests', filter: `user_id=eq.${userId}` },
        (payload) => {
          const status = (payload.new as { status?: string })?.status;
          // Only admin decisions are announced; the employee's own cancels aren't.
          if (status !== 'approved' && status !== 'rejected') return;
          if (!N || N.permission !== 'granted') return;
          const title = status === 'approved' ? s.leave.notifApprovedTitle : s.leave.notifRejectedTitle;
          try {
            new N(title, { body: s.leave.notifBody });
          } catch {
            // some browsers require a ServiceWorkerRegistration for notifications
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, s]);
}
