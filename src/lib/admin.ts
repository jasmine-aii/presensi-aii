import { supabase } from './supabase';
import type { RosterStatus } from './data';

const LATE_AFTER_MIN = 9 * 60; // 09:00 — clock-in after 9 counts as late (work hours still start 08:30)
const pad = (n: number) => String(n).padStart(2, '0');

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function hhmm(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export interface AdminMember {
  id: string; // auth user id
  name: string;
  email: string;
  employeeId: string;
  dept: string; // job title / position (profiles.department)
  role: 'employee' | 'admin'; // access role (profiles.role)
  st: RosterStatus; // present | late | not | leave
  in: string; // HH:MM or —
  out: string;
  excludeFromStats: boolean; // founder / flagged: shown in directory, omitted from stats
  geofenceExempt: boolean; // may clock in/out from anywhere (geofence skipped)
  birthDate: string | null; // YYYY-MM-DD
}

export interface AdminStats {
  present: number;
  late: number;
  notyet: number;
  leave: number;
  total: number;
}

/** All employees joined with today's attendance + approved leave, ordered by name. */
export async function fetchTeam(): Promise<AdminMember[]> {
  const today = todayKey();
  const [{ data: profiles }, { data: att }, { data: leave }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, employee_id, department, role, email, exclude_from_stats, geofence_exempt, birth_date').order('full_name'),
    supabase.from('attendance').select('user_id, clock_in_at, clock_out_at').eq('work_date', today),
    supabase.from('leave_requests').select('user_id').eq('status', 'approved').lte('start_date', today).gte('end_date', today),
  ]);

  const byUser = new Map<string, { clock_in_at: string | null; clock_out_at: string | null }>();
  for (const a of att ?? []) byUser.set(a.user_id as string, { clock_in_at: a.clock_in_at, clock_out_at: a.clock_out_at });
  const onLeave = new Set((leave ?? []).map((l) => l.user_id as string));

  return (profiles ?? []).map((p) => {
    const a = byUser.get(p.id as string);
    const inT = hhmm(a?.clock_in_at);
    const outT = hhmm(a?.clock_out_at);
    let st: RosterStatus = 'not';
    if (onLeave.has(p.id as string)) {
      st = 'leave';
    } else if (inT) {
      const [h, m] = inT.split(':').map(Number);
      st = h * 60 + m > LATE_AFTER_MIN ? 'late' : 'present';
    }
    return {
      id: p.id as string,
      name: (p.full_name as string) || '—',
      email: (p.email as string) ?? '',
      employeeId: (p.employee_id as string) ?? '—',
      dept: (p.department as string) ?? '—',
      role: (p.role as 'employee' | 'admin') ?? 'employee',
      st,
      in: inT ?? '—',
      out: outT ?? '—',
      excludeFromStats: (p.exclude_from_stats as boolean) ?? false,
      geofenceExempt: (p.geofence_exempt as boolean) ?? false,
      birthDate: (p.birth_date as string) ?? null,
    };
  });
}

/**
 * Preview the employee id the next created account will get: AII{max+1}, based
 * on the highest existing id. Matches the server-side next_employee_id().
 */
export async function nextEmployeeIdPreview(): Promise<string> {
  const { data } = await supabase.from('profiles').select('employee_id');
  const max = (data ?? []).reduce((m, r) => {
    const n = parseInt(String(r.employee_id ?? '').replace(/\D/g, ''), 10);
    return Number.isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return 'AII' + String(max + 1).padStart(3, '0');
}

/** Reset an employee's password (admin only, via the create-employee function). */
export async function resetMemberPassword(userId: string, password: string): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke('create-employee', {
    body: { action: 'reset-password', userId, password },
  });
  if (error) return error.message;
  if (data?.error) return data.error as string;
  return null;
}

/** Assign / change an employee's shift (admin only, enforced by RLS). */

/** Set / clear an employee's date of birth (admin only). '' clears it. */
export async function setMemberDept(userId: string, dept: string): Promise<boolean> {
  const { error } = await supabase.from('profiles').update({ department: dept }).eq('id', userId);
  if (error) console.warn('[setMemberDept]', error.message);
  return !error;
}
export async function setMemberRole(userId: string, role: 'employee' | 'admin'): Promise<boolean> {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
  if (error) console.warn('[setMemberRole]', error.message);
  return !error;
}
export async function setMemberBirthDate(userId: string, birthDate: string): Promise<boolean> {
  const { error } = await supabase.from('profiles').update({ birth_date: birthDate || null }).eq('id', userId);
  if (error) console.warn('[setMemberBirthDate]', error.message);
  return !error;
}

/** Include/exclude an employee from all statistics (admin only). */
export async function setExcludeFromStats(userId: string, exclude: boolean): Promise<boolean> {
  const { error } = await supabase.from('profiles').update({ exclude_from_stats: exclude }).eq('id', userId);
  if (error) console.warn('[setExcludeFromStats]', error.message);
  return !error;
}
export async function setMemberGeofenceExempt(userId: string, exempt: boolean): Promise<boolean> {
  const { error } = await supabase.from('profiles').update({ geofence_exempt: exempt }).eq('id', userId);
  if (error) console.warn('[setMemberGeofenceExempt]', error.message);
  return !error;
}

/** Headline counts derived from the team roster (flagged people excluded). */
export function deriveStats(members: AdminMember[]): AdminStats {
  const counted = members.filter((m) => !m.excludeFromStats);
  const present = counted.filter((m) => m.st === 'present').length;
  const late = counted.filter((m) => m.st === 'late').length;
  const notyet = counted.filter((m) => m.st === 'not').length;
  const leave = counted.filter((m) => m.st === 'leave').length;
  return { present, late, notyet, leave, total: counted.length };
}
