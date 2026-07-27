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
 * Extract the [start, end] window from a shift label like
 * "Reguler · 08:30–17:30". Falls back to the default 08:30–17:30.
 */
export function parseShiftWindow(label?: string | null): ShiftWindow {
  let startMin = 8 * 60 + 30;
  let endMin = 17 * 60 + 30;
  const m = label?.match(/(\d{1,2})[.:](\d{2}).*?(\d{1,2})[.:](\d{2})/);
  if (m) {
    startMin = Number(m[1]) * 60 + Number(m[2]);
    endMin = Number(m[3]) * 60 + Number(m[4]);
  }
  return { startMin, endMin, startStr: fmtMin(startMin), endStr: fmtMin(endMin) };
}
