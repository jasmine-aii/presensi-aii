import { supabase } from './supabase';

/** Request types — mirror the reference diagram (cuti / sakit / izin / dinas luar). */
export type LeaveType = 'cuti_tahunan' | 'sakit' | 'izin' | 'dinas_luar';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export const LEAVE_TYPES: LeaveType[] = ['cuti_tahunan', 'sakit', 'izin', 'dinas_luar'];

export interface LeaveRequest {
  id: string;
  userId: string;
  type: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  days: number;
  reason: string | null;
  attachmentPath: string | null;
  status: LeaveStatus;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

/** A pending/decided request joined with the employee's display info (admin view). */
export interface AdminLeaveRequest extends LeaveRequest {
  employeeName: string;
  employeeId: string;
}

export interface LeaveBalance {
  quota: number; // annual entitlement (working days)
  taken: number; // approved cuti_tahunan days this year
  remaining: number;
}

/** Discriminated result so the UI can map a code to a localized message. */
export type SubmitResult =
  | { ok: true; id: string }
  | { ok: false; code: 'range' | 'past' | 'quota' | 'overlap' | 'db' };

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar day as YYYY-MM-DD. */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parse a YYYY-MM-DD string to a local Date at midnight. */
function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/**
 * Whole working days (Mon–Fri) between two dates, inclusive. Falls back to the
 * inclusive calendar-day count when the range is entirely weekend, so a request
 * always spans at least one day (satisfies the DB `days >= 1` check).
 */
export function workingDaysBetween(startISO: string, endISO: string): number {
  const start = parseISO(startISO);
  const end = parseISO(endISO);
  if (end < start) return 0;
  let work = 0;
  let cal = 0;
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    cal += 1;
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6) work += 1;
  }
  return work > 0 ? work : cal;
}

function mapRow(r: any): LeaveRequest {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    type: r.type as LeaveType,
    startDate: r.start_date as string,
    endDate: r.end_date as string,
    days: (r.days as number) ?? 1,
    reason: (r.reason as string) ?? null,
    attachmentPath: (r.attachment_path as string) ?? null,
    status: r.status as LeaveStatus,
    reviewNote: (r.review_note as string) ?? null,
    reviewedAt: (r.reviewed_at as string) ?? null,
    createdAt: r.created_at as string,
  };
}

// ── Employee ──────────────────────────────────────────────────────────────

export interface NewLeave {
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string | null;
  attachmentPath?: string | null;
}

/**
 * Create a pending request after client-side validation (dates, past, quota).
 * Overlap is enforced by a DB exclusion constraint and mapped to `overlap`.
 */
export async function submitLeave(userId: string, input: NewLeave): Promise<SubmitResult> {
  if (input.endDate < input.startDate) return { ok: false, code: 'range' };
  if (input.startDate < todayISO()) return { ok: false, code: 'past' };

  const days = workingDaysBetween(input.startDate, input.endDate);

  if (input.type === 'cuti_tahunan') {
    const bal = await fetchLeaveBalance(userId);
    if (days > bal.remaining) return { ok: false, code: 'quota' };
  }

  const { data, error } = await supabase
    .from('leave_requests')
    .insert({
      user_id: userId,
      type: input.type,
      start_date: input.startDate,
      end_date: input.endDate,
      days,
      reason: input.reason ?? null,
      attachment_path: input.attachmentPath ?? null,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    // 23P01 = exclusion_violation (overlapping active request).
    if ((error as any).code === '23P01') return { ok: false, code: 'overlap' };
    console.warn('[submitLeave]', error.message);
    return { ok: false, code: 'db' };
  }
  return { ok: true, id: data!.id as string };
}

/** Cancel a request the user owns (pending anytime; approved only before it starts). */
export async function cancelLeave(id: string): Promise<boolean> {
  const { error } = await supabase.from('leave_requests').update({ status: 'cancelled' }).eq('id', id);
  if (error) console.warn('[cancelLeave]', error.message);
  return !error;
}

/** The signed-in user's requests, newest start-date first. */
export async function fetchMyLeaves(userId: string, limit = 60): Promise<LeaveRequest[]> {
  const { data } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: false })
    .limit(limit);
  return (data ?? []).map(mapRow);
}

/** Annual-leave balance: quota minus approved cuti_tahunan days this calendar year. */
export async function fetchLeaveBalance(userId: string): Promise<LeaveBalance> {
  const year = new Date().getFullYear();
  const [{ data: prof }, { data: rows }] = await Promise.all([
    supabase.from('profiles').select('annual_leave_quota').eq('id', userId).maybeSingle(),
    supabase
      .from('leave_requests')
      .select('days')
      .eq('user_id', userId)
      .eq('type', 'cuti_tahunan')
      .eq('status', 'approved')
      .gte('start_date', `${year}-01-01`)
      .lte('start_date', `${year}-12-31`),
  ]);
  const quota = (prof?.annual_leave_quota as number) ?? 12;
  const taken = (rows ?? []).reduce((sum, r) => sum + ((r.days as number) ?? 0), 0);
  return { quota, taken, remaining: Math.max(0, quota - taken) };
}

// ── Admin ───────────────────────────────────────────────────────────────────

/**
 * Join leave rows with employee display info. leave_requests.user_id references
 * auth.users (not profiles), so we map by id in JS — same approach as admin.ts.
 */
async function attachEmployees(rows: LeaveRequest[]): Promise<AdminLeaveRequest[]> {
  if (rows.length === 0) return [];
  const ids = [...new Set(rows.map((r) => r.userId))];
  const { data: profs } = await supabase.from('profiles').select('id, full_name, employee_id').in('id', ids);
  const byId = new Map((profs ?? []).map((p) => [p.id as string, p]));
  return rows.map((r) => {
    const p = byId.get(r.userId);
    return {
      ...r,
      employeeName: (p?.full_name as string) || '—',
      employeeId: (p?.employee_id as string) || '—',
    };
  });
}

/** Pending requests awaiting an admin decision, oldest first (FIFO queue). */
export async function fetchPendingLeaves(): Promise<AdminLeaveRequest[]> {
  const { data } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('status', 'pending')
    .order('start_date', { ascending: true });
  return attachEmployees((data ?? []).map(mapRow));
}

/** Already-decided requests (approved/rejected/cancelled), newest first. */
export async function fetchDecidedLeaves(limit = 60): Promise<AdminLeaveRequest[]> {
  const { data } = await supabase
    .from('leave_requests')
    .select('*')
    .neq('status', 'pending')
    .order('reviewed_at', { ascending: false, nullsFirst: false })
    .limit(limit);
  return attachEmployees((data ?? []).map(mapRow));
}

/** Count of pending requests — for the approval-tab badge. */
export async function pendingLeaveCount(): Promise<number> {
  const { count } = await supabase
    .from('leave_requests')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');
  return count ?? 0;
}

/** Approve or reject a pending request (+optional note). reviewer/timestamp set by DB trigger. */
export async function reviewLeave(id: string, decision: 'approved' | 'rejected', note?: string): Promise<boolean> {
  const { error } = await supabase
    .from('leave_requests')
    .update({ status: decision, review_note: note?.trim() || null })
    .eq('id', id);
  if (error) console.warn('[reviewLeave]', error.message);
  return !error;
}

/** Employees on approved leave that covers today — for the admin dashboard. */
export async function fetchOnLeaveToday(): Promise<AdminLeaveRequest[]> {
  const today = todayISO();
  const { data } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('status', 'approved')
    .lte('start_date', today)
    .gte('end_date', today);
  return attachEmployees((data ?? []).map(mapRow));
}

/** Set an employee's annual-leave quota (admin only, enforced by RLS). */
export async function setLeaveQuota(userId: string, quota: number): Promise<boolean> {
  const { error } = await supabase.from('profiles').update({ annual_leave_quota: quota }).eq('id', userId);
  if (error) console.warn('[setLeaveQuota]', error.message);
  return !error;
}
