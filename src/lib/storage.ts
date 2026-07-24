import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';

export const PHOTO_BUCKET = 'attendance-photos';

const pad = (n: number) => String(n).padStart(2, '0');
function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Upload a clock selfie (raw base64, no data: prefix) to the private
 * attendance-photos bucket at `{userId}/{date}-{kind}.jpg`. Best-effort:
 * returns the object path on success, or null on any error (photo must never
 * block the clock-in/out itself). `upsert` overwrites a re-take for the day.
 */
export async function uploadClockPhoto(userId: string, kind: 'in' | 'out', base64: string): Promise<string | null> {
  // Web cameras often hand back a full data URL ("data:image/jpeg;base64,AAAA…").
  // decode() needs the bare base64, so strip any "…," prefix (base64 itself
  // never contains a comma). Native returns bare base64 already — no-op there.
  const clean = base64 && base64.includes(',') ? base64.slice(base64.indexOf(',') + 1) : base64;
  console.log('[uploadClockPhoto]', kind, 'raw len:', base64?.length ?? 0, 'clean len:', clean?.length ?? 0);
  // A too-small payload means the camera returned a blank/absent frame — skip
  // the upload so History shows "no photo" rather than a blank grey image.
  if (!clean || clean.length < 1000) {
    console.warn('[uploadClockPhoto] base64 empty/too small, skipping upload');
    return null;
  }
  const path = `${userId}/${todayKey()}-${kind}.jpg`;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, decode(clean), {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) {
    console.warn('[uploadClockPhoto] error:', error.message);
    return null;
  }
  console.log('[uploadClockPhoto] uploaded →', path);
  return path;
}

/**
 * Resolve a batch of storage object paths to temporary signed URLs
 * (private bucket). Returns a path → URL map; unresolved paths are omitted.
 */
export async function signedUrlsFor(paths: string[], expiresInSec = 60 * 60): Promise<Record<string, string>> {
  const unique = Array.from(new Set(paths.filter(Boolean)));
  if (unique.length === 0) return {};
  const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(unique, expiresInSec);
  if (error || !data) return {};
  const map: Record<string, string> = {};
  for (const row of data) {
    if (row.signedUrl && row.path) map[row.path] = row.signedUrl;
  }
  console.log('[signedUrlsFor] resolved', Object.keys(map).length, 'of', unique.length, '→', map);
  return map;
}
