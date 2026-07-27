import { supabase } from './supabase';

const SHIFT_START_MIN = 8 * 60 + 30; // 08:30 — on-time threshold (matches admin.ts)
const pad = (n: number) => String(n).padStart(2, '0');

function isoOf(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function monthStartISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
}
function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}
const fmtMin = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

/** Count Mon–Fri days in [fromISO, toISO] inclusive (0 if from is after to). */
function weekdaysBetween(fromISO: string, toISO: string): number {
  if (fromISO > toISO) return 0;
  let n = 0;
  for (const d = parseISO(fromISO), end = parseISO(toISO); d <= end; d.setDate(d.getDate() + 1)) {
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6) n += 1;
  }
  return n;
}

export interface AttendanceInsights {
  rate: number; // % attendance, month-to-date
  present: number; // man-days present
  expected: number; // man-days expected (working days × employees − approved leave)
  onTime: number;
  late: number;
  lateRate: number; // % of present that were late
  avgClockIn: string | null; // HH:MM
  leaveDays: number; // approved leave days starting this month
  pending: number; // pending leave requests
  workingDays: number; // weekdays month-to-date
  employees: number;
}

/**
 * Team attendance insights for the current month-to-date. "Present" counts one
 * man-day per employee per day they clocked in; "expected" is working days ×
 * employees minus approved-leave man-days (someone on leave isn't expected in).
 * The on-time threshold is the shift start (08:30). All derived live from the
 * attendance / leave tables — no stored aggregates.
 */
export async function fetchAttendanceInsights(): Promise<AttendanceInsights> {
  const start = monthStartISO();
  const today = isoOf(new Date());

  const [{ count: empCount }, { data: att }, { data: leave }, { count: pendingCount }] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('attendance').select('user_id, work_date, clock_in_at').gte('work_date', start).lte('work_date', today),
    supabase.from('leave_requests').select('start_date, end_date, days, status').eq('status', 'approved'),
    supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  const employees = empCount ?? 0;
  const workingDays = weekdaysBetween(start, today);

  let present = 0;
  let late = 0;
  let sumMin = 0;
  for (const a of att ?? []) {
    if (!a.clock_in_at) continue;
    present += 1;
    const d = new Date(a.clock_in_at as string);
    const m = d.getHours() * 60 + d.getMinutes();
    sumMin += m;
    if (m > SHIFT_START_MIN) late += 1;
  }
  const onTime = present - late;
  const avgClockIn = present ? fmtMin(Math.round(sumMin / present)) : null;

  // Approved-leave man-days on weekdays within the window (reduce expected),
  // and leave-days for requests that started this month (a headline stat).
  let leaveManDays = 0;
  let leaveDays = 0;
  for (const l of leave ?? []) {
    const from = (l.start_date as string) > start ? (l.start_date as string) : start;
    const to = (l.end_date as string) < today ? (l.end_date as string) : today;
    leaveManDays += weekdaysBetween(from, to);
    if ((l.start_date as string) >= start && (l.start_date as string) <= today) leaveDays += (l.days as number) ?? 0;
  }

  const expected = Math.max(0, employees * workingDays - leaveManDays);
  const rate = expected ? Math.min(100, Math.round((present / expected) * 100)) : 0;
  const lateRate = present ? Math.round((late / present) * 100) : 0;

  return { rate, present, expected, onTime, late, lateRate, avgClockIn, leaveDays, pending: pendingCount ?? 0, workingDays, employees };
}
