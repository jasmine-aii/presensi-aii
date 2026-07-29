import type { Lang } from '../i18n/strings';

/**
 * Kantor AII — Wisma 46 (Kota BNI), Jl. Jend. Sudirman Kav. 1, Karet Tengsin,
 * Tanah Abang, Jakarta Pusat 10220. Koordinat dari Wikipedia (Wisma 46).
 * Clock in/out hanya diizinkan dalam `radiusM` meter dari titik ini (geofence).
 * 50 m adalah geofence total — divalidasi identik di klien (useLocation) dan di
 * server (trigger enforce_attendance_geofence di schema.sql). Ubah keduanya bila
 * angka ini diubah.
 */
export const OFFICE = {
  lat: -6.20361,
  lng: 106.82,
  radiusM: 50,
  floor: 39,
  name: {
    id: 'Kantor AII · Wisma 46',
    en: 'AII Office · Wisma 46',
  },
  address: {
    id: 'Wisma 46 Lt. 39, Jl. Jend. Sudirman Kav. 1, Karet Tengsin, Tanah Abang, Jakarta Pusat 10220',
    en: 'Wisma 46, 39th Fl., Jl. Jend. Sudirman Kav. 1, Karet Tengsin, Tanah Abang, Central Jakarta 10220',
  },
} as const;

const toRad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance (Haversine) in meters from a point to the office. */
export function distanceToOffice(lat: number, lng: number): number {
  const R = 6371000; // earth radius, m
  const dLat = toRad(lat - OFFICE.lat);
  const dLng = toRad(lng - OFFICE.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(OFFICE.lat)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** `-6.20361, 106.82000` — 5-decimal fixed, tabular-friendly. */
export function formatCoord(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

/** `120 m` or `1.2 km`. */
export function formatDistance(m: number, _lang: Lang): string {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}
