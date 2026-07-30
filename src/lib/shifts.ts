// Work-hours utilities for the single company flexi shift.
// (Multiple configurable shifts were removed — there is one fixed shift.)

export interface ShiftWindow {
  startMin: number; // minutes from midnight
  endMin: number;
  startStr: string; // "08:00"
  endStr: string; // "17:00"
  inWindow: string; // flexi clock-in range, e.g. "08:00 – 09:00"
  outWindow: string; // flexi clock-out range, e.g. "17:00 – 18:00"
}

const fmtMin = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/** Flexi grace after the shift start (on-time window) / end (clock-out window). */
const FLEXI_GRACE_MIN = 60;

/**
 * The single company shift (flexi time): clock in 08:00–09:00, clock out
 * 17:00–18:00, 8h net after a 1h break. Work-hours counting starts at 08:00
 * (arriving earlier isn't credited); clocking in after 09:00 is "late" (see
 * reports/admin).
 */
export function parseShiftWindow(): ShiftWindow {
  const startMin = 8 * 60; // 08:00 — flexi in-window start & work-hours floor
  const endMin = 17 * 60; // 17:00 — nominal end (clock-out is flexi up to 18:00)
  return {
    startMin,
    endMin,
    startStr: fmtMin(startMin),
    endStr: fmtMin(endMin),
    inWindow: `${fmtMin(startMin)} – ${fmtMin(startMin + FLEXI_GRACE_MIN)}`,
    outWindow: `${fmtMin(endMin)} – ${fmtMin(endMin + FLEXI_GRACE_MIN)}`,
  };
}

/** Unpaid midday break window (12:00–13:00). */
export const BREAK_START_MIN = 12 * 60;
export const BREAK_END_MIN = 13 * 60;
/** Total break length (minutes) — used by the clock-out reminder. */
export const BREAK_MIN = BREAK_END_MIN - BREAK_START_MIN;

/** Full-day net work target after the break (8h). */
export const FULL_DAY_MIN = 8 * 60;

/**
 * Net worked minutes (flexi): count from max(clock-in, 08:00) — early arrival
 * isn't credited — to the actual clock-out (no fixed end cap). The 1h break is
 * only subtracted for the part of the 12:00–13:00 window actually spanned, so
 * before noon the running total counts straight from 08:00 (not "from 09:00").
 * e.g. in 08:00 / out 17:00 → 9h − 1h break = 8h; at 09:44 → 1h44m (no break yet).
 */
export function netWorkedMin(clockInMin: number, endMin: number, win: ShiftWindow): number {
  const start = Math.max(clockInMin, win.startMin);
  const end = Math.max(start, endMin);
  const worked = end - start;
  const breakTaken = Math.max(0, Math.min(end, BREAK_END_MIN) - Math.max(start, BREAK_START_MIN));
  return Math.max(0, worked - breakTaken);
}

/** "8j 0m" / "8h 0m" from minutes. */
export const durationStr = (mins: number, lang: 'id' | 'en') => `${Math.floor(mins / 60)}${lang === 'id' ? 'j' : 'h'} ${mins % 60}m`;
