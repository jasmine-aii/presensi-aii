import { supabase } from './supabase';

export interface TodayAttendance {
  clockInTime: string | null; // HH:MM (local)
  clockOutTime: string | null;
}

export interface ClockPayload {
  time: string; // HH:MM as shown to the user
  lat: number | null;
  lng: number | null;
  photo?: string | null; // storage object path of the selfie, if uploaded
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

/**
 * Record today's clock-in. Refuses if the user has already clocked in today
 * (one clock-in per day). Only writes clock-in columns, so an existing
 * clock-out is preserved. Returns false if already clocked in or on DB error.
 */
export async function recordClockIn(userId: string, p: ClockPayload): Promise<boolean> {
  const { data: existing } = await supabase
    .from('attendance')
    .select('clock_in_at')
    .eq('user_id', userId)
    .eq('work_date', todayKey())
    .maybeSingle();
  if (existing?.clock_in_at) return false; // already clocked in today

  const { error } = await supabase.from('attendance').upsert(
    {
      user_id: userId,
      work_date: todayKey(),
      clock_in_at: new Date().toISOString(), // stamped server-side with now() (trigger stamp_attendance_times)
      clock_in_lat: p.lat,
      clock_in_lng: p.lng,
      clock_in_photo: p.photo ?? null,
    },
    { onConflict: 'user_id,work_date' },
  );
  if (error) console.warn('[clockIn] Supabase error:', error.message);
  return !error;
}

/**
 * Record today's clock-out. Can be repeated — the latest clock-out overwrites
 * the stored one (e.g. surprise overtime after already clocking out). Upserts
 * so it persists even without a prior clock-in row; only clock-out columns are
 * written, so the clock-in is preserved. Returns false on DB error.
 */
export async function recordClockOut(userId: string, p: ClockPayload): Promise<boolean> {
  const { error } = await supabase.from('attendance').upsert(
    {
      user_id: userId,
      work_date: todayKey(),
      clock_out_at: new Date().toISOString(), // stamped server-side with now() (trigger stamp_attendance_times)
      clock_out_lat: p.lat,
      clock_out_lng: p.lng,
      clock_out_photo: p.photo ?? null,
    },
    { onConflict: 'user_id,work_date' },
  );
  if (error) console.warn('[clockOut] Supabase error:', error.message, error);
  return !error;
}

export interface HistoryEntry {
  date: string; // YYYY-MM-DD
  clockInTime: string | null; // HH:MM (local)
  clockOutTime: string | null;
  clockInPhoto: string | null; // storage object path
  clockOutPhoto: string | null;
  correctedBy: string | null; // admin user id if this day was manually corrected
}

/** Attendance rows for a user, newest day first. Optionally scoped to a date range. */
export async function fetchHistory(userId: string, limit = 60, fromISO?: string, toISO?: string): Promise<HistoryEntry[]> {
  let q = supabase
    .from('attendance')
    .select('work_date, clock_in_at, clock_out_at, clock_in_photo, clock_out_photo, corrected_by')
    .eq('user_id', userId);
  if (fromISO) q = q.gte('work_date', fromISO);
  if (toISO) q = q.lte('work_date', toISO);
  const { data } = await q.order('work_date', { ascending: false }).limit(limit);
  return (data ?? []).map((r) => ({
    date: r.work_date as string,
    clockInTime: hhmm(r.clock_in_at),
    clockOutTime: hhmm(r.clock_out_at),
    clockInPhoto: (r.clock_in_photo as string) ?? null,
    clockOutPhoto: (r.clock_out_photo as string) ?? null,
    correctedBy: (r.corrected_by as string) ?? null,
  }));
}

/**
 * Admin: create or correct an employee's attendance for a day. Writes the given
 * clock-in/out times (null clears) plus the audit trail. Editing another
 * employee's row bypasses the server-time + geofence triggers (see schema.sql),
 * so the admin-set times are kept as-is.
 */
export async function saveAttendanceCorrection(p: {
  userId: string;
  workDate: string; // YYYY-MM-DD
  clockInAt: string | null; // ISO or null
  clockOutAt: string | null; // ISO or null
  correctedBy: string;
  note: string | null;
}): Promise<string | null> {
  const { error } = await supabase.from('attendance').upsert(
    {
      user_id: p.userId,
      work_date: p.workDate,
      clock_in_at: p.clockInAt,
      clock_out_at: p.clockOutAt,
      corrected_by: p.correctedBy,
      corrected_at: new Date().toISOString(),
      correction_note: p.note,
    },
    { onConflict: 'user_id,work_date' },
  );
  if (error) console.warn('[saveAttendanceCorrection]', error.message);
  return error?.message ?? null;
}

/** Admin: delete an employee's attendance row for a day. Returns an error message or null. */
export async function deleteAttendanceDay(userId: string, workDate: string): Promise<string | null> {
  const { error } = await supabase.from('attendance').delete().eq('user_id', userId).eq('work_date', workDate);
  if (error) console.warn('[deleteAttendanceDay]', error.message);
  return error?.message ?? null;
}
