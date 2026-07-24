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

/** Create a shift (admin only, enforced by RLS). */
export async function addShift(s: ShiftInput): Promise<boolean> {
  const { error } = await supabase.from('shifts').insert(s);
  if (error) console.warn('[addShift]', error.message);
  return !error;
}

/** Update a shift (admin only). */
export async function updateShift(id: string, s: ShiftInput): Promise<boolean> {
  const { error } = await supabase.from('shifts').update(s).eq('id', id);
  if (error) console.warn('[updateShift]', error.message);
  return !error;
}

/** Delete a shift (admin only). */
export async function deleteShift(id: string): Promise<boolean> {
  const { error } = await supabase.from('shifts').delete().eq('id', id);
  if (error) console.warn('[deleteShift]', error.message);
  return !error;
}

/** "Nama · 08:30–17:30" label for dropdowns. */
export const shiftLabel = (s: Shift) => `${s.name} · ${s.start_time}–${s.end_time}`;
