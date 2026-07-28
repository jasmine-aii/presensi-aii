import type { Lang } from '../i18n/strings';

const pad = (n: number) => String(n).padStart(2, '0');

/** HH:MM:SS — hero clock, camera overlays. */
export const timeStr = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

/** HH:MM — the Clock Out "Keluar" value. */
export const timeShort = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

const dNames: Record<Lang, string[]> = {
  id: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

const mNames: Record<Lang, string[]> = {
  id: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

/** e.g. id "Rabu, 23 Jul 2026" · en "Wednesday, 23 Jul 2026". */
export const dateStr = (d: Date, lang: Lang) =>
  `${dNames[lang][d.getDay()]}, ${d.getDate()} ${mNames[lang][d.getMonth()]} ${d.getFullYear()}`;

/** Parse a 'YYYY-MM-DD' key as a local date (avoids UTC off-by-one). */
export const parseYmd = (ymd: string) => new Date(`${ymd}T00:00:00`);

/** Short weekday, e.g. id "Rab" · en "Wed". */
export const weekdayShort = (d: Date, lang: Lang) => dNames[lang][d.getDay()].slice(0, 3);

/** Short month + year, e.g. id "Jul 2026" · en "Jul 2026". */
export const monthYear = (d: Date, lang: Lang) => `${mNames[lang][d.getMonth()]} ${d.getFullYear()}`;

/** Short month name by 0-based index, e.g. monthName(6,'id') → "Jul". */
export const monthName = (index: number, lang: Lang) => mNames[lang][index] ?? '';

/** Compact day + short month, e.g. "23 Jul". */
export const dayMonth = (d: Date, lang: Lang) => `${d.getDate()} ${mNames[lang][d.getMonth()]}`;

/** Inclusive date range from 'YYYY-MM-DD' strings, e.g. "23 Jul – 25 Jul 2026"
 *  (single day collapses to "23 Jul 2026"). */
export const rangeStr = (startYmd: string, endYmd: string, lang: Lang) => {
  const a = parseYmd(startYmd);
  const b = parseYmd(endYmd);
  const year = b.getFullYear();
  return startYmd === endYmd
    ? `${dayMonth(a, lang)} ${year}`
    : `${dayMonth(a, lang)} – ${dayMonth(b, lang)} ${year}`;
};
