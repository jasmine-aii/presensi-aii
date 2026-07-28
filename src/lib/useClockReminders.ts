import { useEffect, useRef, useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { parseShiftWindow, FULL_DAY_MIN, BREAK_MIN } from './shifts';

export type NotifPermission = 'unsupported' | 'default' | 'granted' | 'denied';

const REMIND_OFFSET = 10; // minutes before & after the scheduled time
const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export interface ReminderItem {
  kind: 'in' | 'out';
  before: string; // HH:MM (10 min before)
  after: string; // HH:MM (10 min after)
  done: boolean;
}

/** Web `Notification` if available in this runtime (undefined on native). */
const N: typeof Notification | undefined = typeof window !== 'undefined' && 'Notification' in window ? window.Notification : undefined;

/**
 * Fires browser reminders 10 minutes before & after the shift start (clock-in)
 * and shift end (clock-out) — but only for actions not yet done, and only once
 * each per day. Notifications only appear while the app tab is open (no
 * background push). No-op on platforms without the Notification API.
 */
export function useClockReminders(
  shift: string | null | undefined,
  clockInTime: string | null | undefined,
  clockOutTime: string | null | undefined,
  enabled: boolean = true,
) {
  const { s } = useLang();
  const [permission, setPermission] = useState<NotifPermission>(N ? (N.permission as NotifPermission) : 'unsupported');
  const fired = useRef<Set<string>>(new Set());

  const win = parseShiftWindow(shift);

  // Clock-out reminder is based on completing 8 *working* hours from the actual
  // clock-in (8h work + 1h break = 9h elapsed), not the fixed shift end — so a
  // late clock-in pushes the reminder later. Falls back to shift end until the
  // employee has clocked in.
  const clockInMin = clockInTime ? toMin(clockInTime) : null;
  const outMin = clockInMin != null ? clockInMin + FULL_DAY_MIN + BREAK_MIN : win.endMin;

  const items: ReminderItem[] = [
    { kind: 'in', before: fmt(win.startMin - REMIND_OFFSET), after: fmt(win.startMin + REMIND_OFFSET), done: !!clockInTime },
    { kind: 'out', before: fmt(outMin - REMIND_OFFSET), after: fmt(outMin + REMIND_OFFSET), done: !!clockOutTime },
  ];

  const requestPermission = async () => {
    if (!N) return;
    const p = await N.requestPermission();
    setPermission(p as NotifPermission);
  };

  useEffect(() => {
    if (!N || permission !== 'granted' || !enabled) return;

    const schedule = [
      { min: win.startMin - REMIND_OFFSET, kind: 'in' as const },
      { min: win.startMin + REMIND_OFFSET, kind: 'in' as const },
      { min: outMin - REMIND_OFFSET, kind: 'out' as const },
      { min: outMin + REMIND_OFFSET, kind: 'out' as const },
    ];

    const tick = () => {
      const d = new Date();
      const nowMin = d.getHours() * 60 + d.getMinutes();
      const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      for (const r of schedule) {
        if (r.kind === 'in' && clockInTime) continue;
        if (r.kind === 'out' && clockOutTime) continue;
        const fk = `${dayKey}:${r.kind}:${r.min}`;
        // fire within a ~1 minute window so a 30s poll always catches it
        if (!fired.current.has(fk) && nowMin >= r.min && nowMin <= r.min + 1) {
          fired.current.add(fk);
          const title = r.kind === 'in' ? s.home.notifInTitle : s.home.notifOutTitle;
          const body = r.kind === 'in' ? s.home.notifInBody : s.home.notifOutBody;
          try {
            new N(title, { body });
          } catch {
            // some browsers require a ServiceWorkerRegistration for notifications
          }
        }
      }
    };

    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [permission, win.startMin, outMin, clockInTime, clockOutTime, s]);

  return { supported: !!N, permission, requestPermission, items };
}
