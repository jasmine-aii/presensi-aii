import { supabase } from './supabase';

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
}

/** All holidays, oldest first. */
export async function fetchHolidays(): Promise<Holiday[]> {
  const { data } = await supabase.from('holidays').select('holiday_date, name').order('holiday_date');
  return (data ?? []).map((r) => ({ date: r.holiday_date as string, name: r.name as string }));
}

/** Fast lookup set of holiday dates (YYYY-MM-DD). */
export async function fetchHolidaySet(): Promise<Set<string>> {
  const { data } = await supabase.from('holidays').select('holiday_date');
  return new Set((data ?? []).map((r) => r.holiday_date as string));
}

/** Map of date → holiday name (for showing which holiday a day is). */
export async function fetchHolidayMap(): Promise<Record<string, string>> {
  const { data } = await supabase.from('holidays').select('holiday_date, name');
  const map: Record<string, string> = {};
  for (const r of data ?? []) map[r.holiday_date as string] = r.name as string;
  return map;
}

/** Add or rename a holiday (admin only, enforced by RLS). */
export async function addHoliday(date: string, name: string): Promise<boolean> {
  const { error } = await supabase.from('holidays').upsert({ holiday_date: date, name }, { onConflict: 'holiday_date' });
  if (error) console.warn('[addHoliday]', error.message);
  return !error;
}

/** Remove a holiday (admin only). */
export async function deleteHoliday(date: string): Promise<boolean> {
  const { error } = await supabase.from('holidays').delete().eq('holiday_date', date);
  if (error) console.warn('[deleteHoliday]', error.message);
  return !error;
}
