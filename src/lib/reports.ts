import { supabase } from './supabase';
import { fetchHolidaySet } from './holidays';
import { computeLeaveBalance, type ApprovedLeave } from './leave';

const LATE_AFTER_MIN = 9 * 60; // 09:00 — clock-in after 9 counts as late (work hours still start 08:30)
const pad = (n: number) => String(n).padStart(2, '0');

function isoOf(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
/** [start, end] of a month, with end clamped to today (never in the future). */
function monthBounds(year: number, month0: number): { start: string; end: string } {
  const start = `${year}-${pad(month0 + 1)}-01`;
  const lastDay = new Date(year, month0 + 1, 0).getDate();
  const monthEnd = `${year}-${pad(month0 + 1)}-${pad(lastDay)}`;
  const today = isoOf(new Date());
  return { start, end: today < monthEnd ? today : monthEnd };
}
function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}
const fmtMin = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

/** Working days in [fromISO, toISO] inclusive — excludes weekends and holidays. */
function weekdaysBetween(fromISO: string, toISO: string, holidays?: Set<string>): number {
  if (fromISO > toISO) return 0;
  let n = 0;
  for (const d = parseISO(fromISO), end = parseISO(toISO); d <= end; d.setDate(d.getDate() + 1)) {
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6 && !holidays?.has(isoOf(d))) n += 1;
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
 * Clock-in after 09:00 counts as late (work hours still start at 08:30). All derived live from the
 * attendance / leave tables — no stored aggregates.
 */
export async function fetchAttendanceInsights(year?: number, month0?: number): Promise<AttendanceInsights> {
  const now = new Date();
  const { start, end } = monthBounds(year ?? now.getFullYear(), month0 ?? now.getMonth());

  const [{ data: profs }, { data: att }, { data: leave }, { data: pend }, holidays] = await Promise.all([
    supabase.from('profiles').select('id, exclude_from_stats'),
    supabase.from('attendance').select('user_id, work_date, clock_in_at').gte('work_date', start).lte('work_date', end),
    supabase.from('leave_requests').select('user_id, start_date, end_date, days, status').eq('status', 'approved'),
    supabase.from('leave_requests').select('user_id').eq('status', 'pending'),
    fetchHolidaySet(),
  ]);

  // People flagged out of stats (e.g. the founder) never count anywhere here.
  const excluded = new Set((profs ?? []).filter((p) => p.exclude_from_stats).map((p) => p.id as string));
  const employees = (profs ?? []).filter((p) => !p.exclude_from_stats).length;
  const workingDays = weekdaysBetween(start, end, holidays);

  let present = 0;
  let late = 0;
  let sumMin = 0;
  for (const a of att ?? []) {
    if (!a.clock_in_at || excluded.has(a.user_id as string)) continue;
    present += 1;
    const d = new Date(a.clock_in_at as string);
    const m = d.getHours() * 60 + d.getMinutes();
    sumMin += m;
    if (m > LATE_AFTER_MIN) late += 1;
  }
  const onTime = present - late;
  const avgClockIn = present ? fmtMin(Math.round(sumMin / present)) : null;

  // Approved-leave man-days on weekdays within the window (reduce expected),
  // and leave-days for requests that started this month (a headline stat).
  let leaveManDays = 0;
  let leaveDays = 0;
  for (const l of leave ?? []) {
    if (excluded.has(l.user_id as string)) continue;
    const from = (l.start_date as string) > start ? (l.start_date as string) : start;
    const to = (l.end_date as string) < end ? (l.end_date as string) : end;
    leaveManDays += weekdaysBetween(from, to, holidays);
    if ((l.start_date as string) >= start && (l.start_date as string) <= end) leaveDays += (l.days as number) ?? 0;
  }

  const pending = (pend ?? []).filter((r) => !excluded.has(r.user_id as string)).length;
  const expected = Math.max(0, employees * workingDays - leaveManDays);
  const rate = expected ? Math.min(100, Math.round((present / expected) * 100)) : 0;
  const lateRate = present ? Math.round((late / present) * 100) : 0;

  return { rate, present, expected, onTime, late, lateRate, avgClockIn, leaveDays, pending, workingDays, employees };
}

// ── Per-employee monthly stats (attendance + leave balance) ─────────────────

export interface EmployeeMonthStats {
  rate: number; // present / workingDays, %
  present: number; // days clocked in
  onTime: number; // clock-in at or before 09:00
  late: number; // clock-in after 09:00
  absent: number; // workingDays − present − leaveDays (≥ 0)
  leaveDays: number; // approved-leave weekdays in window
  workingDays: number; // weekdays from max(join, monthStart) to end (holidays excluded)
}

/** Attendance split for one clocked-in set: late when clock-in is after 09:00. */
function splitOnTime(rows: Array<{ clock_in_at: string | null }>): { onTime: number; late: number } {
  let onTime = 0;
  let late = 0;
  for (const a of rows) {
    if (!a.clock_in_at) continue;
    const d = new Date(a.clock_in_at);
    const m = d.getHours() * 60 + d.getMinutes();
    if (m > LATE_AFTER_MIN) late += 1;
    else onTime += 1;
  }
  return { onTime, late };
}

/** Working days for an employee within [monthStart, end], starting no earlier than join. */
function employeeWorkingDays(joinDate: string | null, start: string, end: string, holidays: Set<string>): number {
  const from = joinDate && joinDate > start ? joinDate : start;
  return from <= end ? weekdaysBetween(from, end, holidays) : 0;
}

export interface EmployeeReport extends EmployeeMonthStats {
  id: string;
  name: string;
  employeeId: string;
  carryOver: number; // leave carried from the prior service year (0 once expired)
  remaining: number; // leave days still available
  pending: number; // pending leave requests
}

/**
 * Per-employee report for a given month: attendance rate (present / working days
 * since join), on-time / late / absent counts, and a simplified leave balance
 * (carry-over + remaining). Founder / flagged accounts are omitted.
 */
export async function fetchEmployeeReports(year?: number, month0?: number): Promise<EmployeeReport[]> {
  const now = new Date();
  const { start, end } = monthBounds(year ?? now.getFullYear(), month0 ?? now.getMonth());

  const [{ data: allProfs }, { data: att }, { data: leave }, holidays] = await Promise.all([
    supabase.from('profiles').select('id, full_name, employee_id, join_date, leave_quota_adjust, exclude_from_stats').order('full_name'),
    supabase.from('attendance').select('user_id, clock_in_at').gte('work_date', start).lte('work_date', end),
    supabase.from('leave_requests').select('user_id, type, status, days, start_date, end_date'),
    fetchHolidaySet(),
  ]);

  const profs = (allProfs ?? []).filter((p) => !p.exclude_from_stats);

  const attByUser = new Map<string, Array<{ clock_in_at: string | null }>>();
  for (const a of att ?? []) {
    const arr = attByUser.get(a.user_id as string) ?? [];
    arr.push({ clock_in_at: a.clock_in_at as string | null });
    attByUser.set(a.user_id as string, arr);
  }

  const leaveByUser = new Map<string, { approved: ApprovedLeave[]; manDays: number; pending: number }>();
  for (const p of profs) leaveByUser.set(p.id as string, { approved: [], manDays: 0, pending: 0 });
  for (const l of leave ?? []) {
    const e = leaveByUser.get(l.user_id as string);
    if (!e) continue;
    if (l.status === 'pending') e.pending += 1;
    if (l.status === 'approved') {
      const from = (l.start_date as string) > start ? (l.start_date as string) : start;
      const to = (l.end_date as string) < end ? (l.end_date as string) : end;
      e.manDays += weekdaysBetween(from, to, holidays);
      if (l.type === 'cuti_tahunan') e.approved.push({ startDate: l.start_date as string, days: (l.days as number) ?? 0 });
    }
  }

  return profs.map((p) => {
    const join = (p.join_date as string) ?? null;
    const workingDays = employeeWorkingDays(join, start, end, holidays);
    const { onTime, late } = splitOnTime(attByUser.get(p.id as string) ?? []);
    const present = onTime + late;
    const lv = leaveByUser.get(p.id as string)!;
    const leaveDays = Math.min(lv.manDays, Math.max(0, workingDays - present));
    const absent = Math.max(0, workingDays - present - leaveDays);
    const rate = workingDays > 0 ? Math.min(100, Math.round((present / workingDays) * 100)) : 0;
    const bal = computeLeaveBalance(join, (p.leave_quota_adjust as number) ?? 0, lv.approved, end);
    return {
      id: p.id as string,
      name: (p.full_name as string) || '—',
      employeeId: (p.employee_id as string) || '—',
      rate, present, onTime, late, absent, leaveDays, workingDays,
      carryOver: bal.carryOver,
      remaining: bal.remaining,
      pending: lv.pending,
    };
  });
}

/** Attendance-only monthly stats for a single employee (directory detail screen). */
export async function fetchEmployeeMonthStats(userId: string, year?: number, month0?: number): Promise<EmployeeMonthStats> {
  const now = new Date();
  const { start, end } = monthBounds(year ?? now.getFullYear(), month0 ?? now.getMonth());

  const [{ data: prof }, { data: att }, { data: leave }, holidays] = await Promise.all([
    supabase.from('profiles').select('join_date').eq('id', userId).maybeSingle(),
    supabase.from('attendance').select('clock_in_at').eq('user_id', userId).gte('work_date', start).lte('work_date', end),
    supabase.from('leave_requests').select('start_date, end_date').eq('user_id', userId).eq('status', 'approved'),
    fetchHolidaySet(),
  ]);

  const join = (prof?.join_date as string) ?? null;
  const workingDays = employeeWorkingDays(join, start, end, holidays);
  const { onTime, late } = splitOnTime((att ?? []) as Array<{ clock_in_at: string | null }>);
  const present = onTime + late;
  const from0 = join && join > start ? join : start;
  let manDays = 0;
  for (const l of leave ?? []) {
    const from = (l.start_date as string) > from0 ? (l.start_date as string) : from0;
    const to = (l.end_date as string) < end ? (l.end_date as string) : end;
    manDays += weekdaysBetween(from, to, holidays);
  }
  const leaveDays = Math.min(manDays, Math.max(0, workingDays - present));
  const absent = Math.max(0, workingDays - present - leaveDays);
  const rate = workingDays > 0 ? Math.min(100, Math.round((present / workingDays) * 100)) : 0;
  return { rate, present, onTime, late, absent, leaveDays, workingDays };
}
