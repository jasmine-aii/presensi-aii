import { supabase } from './supabase';

export interface Shift {
  id: string;
  name: string;
  start_time: string; // "08:30"
  end_time: string; // "17:30"
}

export type ShiftInput = Omit<Shift, 'id'>;

/** All shift options, earliest start first. Readable by any signed-in user. */
export async function fetchShifts(): Promise<Shift[]> {
  const { data } = await supabase.from('shifts').select('id, name, start_time, end_time').order('start_time');
  return (data ?? []) as Shift[];
}

/** Create a shift (admin only, enforced by RLS). Returns an error message or null. */
export async function addShift(s: ShiftInput): Promise<string | null> {
  const { error } = await supabase.from('shifts').insert(s);
  if (error) console.warn('[addShift]', error.message);
  return error?.message ?? null;
}

/** Update a shift (admin only). Returns an error message or null. */
export async function updateShift(id: string, s: ShiftInput): Promise<string | null> {
  const { error } = await supabase.from('shifts').update(s).eq('id', id);
  if (error) console.warn('[updateShift]', error.message);
  return error?.message ?? null;
}

/** Delete a shift (admin only). Returns an error message or null. */
export async function deleteShift(id: string): Promise<string | null> {
  const { error } = await supabase.from('shifts').delete().eq('id', id);
  if (error) console.warn('[deleteShift]', error.message);
  return error?.message ?? null;
}

/** "Nama · 08:30–17:30" label for dropdowns. */
export const shiftLabel = (s: Shift) => `${s.name} · ${s.start_time}–${s.end_time}`;

export interface ShiftWindow {
  startMin: number; // minutes from midnight
  endMin: number;
  startStr: string; // "08:30"
  endStr: string; // "17:30"
}

const fmtMin = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/**
 * The single company shift (flexi time): clock in 08:00–09:00, clock out
 * 17:00–18:00, 8h net after a 1h break. Work-hours counting starts at 08:00
 * (arriving earlier isn't credited); clocking in after 09:00 is "late" (see
 * reports/admin). There is only one shift, so the `label` arg is ignored.
 */
export function parseShiftWindow(_label?: string | null): ShiftWindow {
  const startMin = 8 * 60; // 08:00 — flexi in-window start & work-hours floor
  const endMin = 17 * 60; // 17:00 — nominal end (clock-out is flexi up to 18:00)
  return { startMin, endMin, startStr: fmtMin(startMin), endStr: fmtMin(endMin) };
}

/** Unpaid break deducted from each full workday (minutes). */
export const BREAK_MIN = 60;

/** Full-day net work target after the break (8h). */
export const FULL_DAY_MIN = 8 * 60;

/**
 * Net worked minutes (flexi): count from max(clock-in, 08:00) — early arrival
 * isn't credited — to the actual clock-out (no fixed end cap, since clock-out is
 * flexi), minus the unpaid break. e.g. in 09:00 / out 18:00 → 9h − 1h = 8h.
 */
export function netWorkedMin(clockInMin: number, endMin: number, win: ShiftWindow): number {
  const gross = Math.max(0, endMin - Math.max(clockInMin, win.startMin));
  return Math.max(0, gross - BREAK_MIN);
}

/** "8j 0m" / "8h 0m" from minutes. */
export const durationStr = (mins: number, lang: 'id' | 'en') => `${Math.floor(mins / 60)}${lang === 'id' ? 'j' : 'h'} ${mins % 60}m`;
