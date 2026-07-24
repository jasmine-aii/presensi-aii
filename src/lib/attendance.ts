import { supabase } from './supabase';

export interface TodayAttendance {
  clockInTime: string | null; // HH:MM (local)
  clockOutTime: string | null;
}

export interface ClockPayload {
  time: string; // HH:MM as shown to the user
  lat: number | null;
  lng: number | null;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar day as YYYY-MM-DD — the natural key for one attendance row. */
function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** HH:MM in the device's local timezone from a stored ISO timestamp. */
function hhmm(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Today's clock-in / clock-out for the signed-in user (null if not yet clocked). */
export async function fetchToday(userId: string): Promise<TodayAttendance> {
  const { data } = await supabase
    .from('attendance')
    .select('clock_in_at, clock_out_at')
    .eq('user_id', userId)
    .eq('work_date', todayKey())
    .maybeSingle();
  return { clockInTime: hhmm(data?.clock_in_at), clockOutTime: hhmm(data?.clock_out_at) };
}

/** Insert (or overwrite) today's clock-in. Returns false on any DB error. */
export async function recordClockIn(userId: string, p: ClockPayload): Promise<boolean> {
  const { error } = await supabase.from('attendance').upsert(
    {
      user_id: userId,
      work_date: todayKey(),
      clock_in_at: new Date().toISOString(),
      clock_in_lat: p.lat,
      clock_in_lng: p.lng,
      clock_out_at: null,
      clock_out_lat: null,
      clock_out_lng: null,
    },
    { onConflict: 'user_id,work_date' },
  );
  return !error;
}

/** Stamp clock-out onto today's row. Returns false on any DB error. */
export async function recordClockOut(userId: string, p: ClockPayload): Promise<boolean> {
  const { error } = await supabase
    .from('attendance')
    .update({ clock_out_at: new Date().toISOString(), clock_out_lat: p.lat, clock_out_lng: p.lng })
    .eq('user_id', userId)
    .eq('work_date', todayKey());
  return !error;
}
