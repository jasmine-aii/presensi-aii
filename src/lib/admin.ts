import { supabase } from './supabase';
import type { RosterStatus } from './data';

const SHIFT_START_MIN = 8 * 60 + 30; // 08:30
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
  dept: string;
  st: RosterStatus; // present | late | not (leave needs a leave table — not modelled yet)
  in: string; // HH:MM or —
  out: string;
}

export interface AdminStats {
  present: number;
  late: number;
  notyet: number;
  leave: number;
  total: number;
}

/** All employees joined with today's attendance, ordered by name. */
export async function fetchTeam(): Promise<AdminMember[]> {
  const [{ data: profiles }, { data: att }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, employee_id, department, email').order('full_name'),
    supabase.from('attendance').select('user_id, clock_in_at, clock_out_at').eq('work_date', todayKey()),
  ]);

  const byUser = new Map<string, { clock_in_at: string | null; clock_out_at: string | null }>();
  for (const a of att ?? []) byUser.set(a.user_id as string, { clock_in_at: a.clock_in_at, clock_out_at: a.clock_out_at });

  return (profiles ?? []).map((p) => {
    const a = byUser.get(p.id as string);
    const inT = hhmm(a?.clock_in_at);
    const outT = hhmm(a?.clock_out_at);
    let st: RosterStatus = 'not';
    if (inT) {
      const [h, m] = inT.split(':').map(Number);
      st = h * 60 + m > SHIFT_START_MIN ? 'late' : 'present';
    }
    return {
      id: p.id as string,
      name: (p.full_name as string) || '—',
      email: (p.email as string) ?? '',
      employeeId: (p.employee_id as string) ?? '—',
      dept: (p.department as string) ?? '—',
      st,
      in: inT ?? '—',
      out: outT ?? '—',
    };
  });
}

/** Headline counts derived from the team roster. */
export function deriveStats(members: AdminMember[]): AdminStats {
  const present = members.filter((m) => m.st === 'present').length;
  const late = members.filter((m) => m.st === 'late').length;
  const notyet = members.filter((m) => m.st === 'not').length;
  return { present, late, notyet, leave: 0, total: members.length };
}
