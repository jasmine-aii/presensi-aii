// Work-hours utilities for the single company flexi shift.
// (Multiple configurable shifts were removed — there is one fixed shift.)

export interface ShiftWindow {
  startMin: number; // minutes from midnight
  endMin: number;
  startStr: string; // "08:00"
  endStr: string; // "17:00"
}

const fmtMin = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/**
 * The single company shift (flexi time): clock in 08:00–09:00, clock out
 * 17:00–18:00, 8h net after a 1h break. Work-hours counting starts at 08:00
 * (arriving earlier isn't credited); clocking in after 09:00 is "late" (see
 * reports/admin).
 */
export function parseShiftWindow(): ShiftWindow {
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
