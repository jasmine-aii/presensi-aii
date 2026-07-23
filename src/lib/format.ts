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
