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
  console.log('[uploadClockPhoto]', kind, 'base64 length:', base64?.length ?? 0);
  // A too-small payload means the camera returned a blank/absent frame — skip
  // the upload so History shows "no photo" rather than a blank grey image.
  if (!base64 || base64.length < 1000) {
    console.warn('[uploadClockPhoto] base64 empty/too small, skipping upload');
    return null;
  }
  const path = `${userId}/${todayKey()}-${kind}.jpg`;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, decode(base64), {
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
  return map;
}
