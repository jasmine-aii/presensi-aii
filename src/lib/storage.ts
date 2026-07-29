import { Platform } from 'react-native';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';

export const PHOTO_BUCKET = 'attendance-photos';
export const LEAVE_BUCKET = 'leave-attachments';

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
  // A too-small payload means the camera returned a blank/absent frame — skip
  // the upload so History shows "no photo" rather than a blank grey image.
  if (!clean || clean.length < 1000) return null;
  const path = `${userId}/${todayKey()}-${kind}.jpg`;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, decode(clean), {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) {
    console.warn('[uploadClockPhoto] error:', error.message);
    return null;
  }
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

/**
 * Downscale + re-encode an image File on web (canvas) so a phone photo of a
 * document (surat dokter) doesn't upload at multiple MB. PDFs / non-images and
 * anything already smaller are returned untouched. Best-effort: falls back to
 * the original on any failure. No-op off web.
 */
async function compressImageWeb(file: any, maxWidth = 1400, quality = 0.6): Promise<any> {
  if (Platform.OS !== 'web') return file;
  const g: any = globalThis as any;
  if (!file?.type || !String(file.type).startsWith('image/') || !g?.document || !g?.URL) return file;
  try {
    const url = g.URL.createObjectURL(file);
    const img: any = await new Promise((res, rej) => {
      const i = new g.Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const scale = Math.min(1, maxWidth / img.width);
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas: any = g.document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    g.URL.revokeObjectURL(url);
    const blob: any = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality));
    if (!blob || blob.size >= file.size) return file; // keep original if not smaller
    const base = String(file.name || 'attachment').replace(/\.[^.]+$/, '');
    return new g.File([blob], `${base}.jpg`, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

/**
 * Upload a leave-request attachment (surat dokter, dsb.) to the private
 * leave-attachments bucket at `{userId}/{timestamp}.{ext}`. Accepts a web File
 * / Blob directly; image files are compressed first. Returns the object path,
 * or null on error.
 */
export async function uploadLeaveAttachment(userId: string, file: Blob & { name?: string; type?: string }): Promise<string | null> {
  const prepared = await compressImageWeb(file);
  const name = (prepared as { name?: string }).name ?? '';
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1).toLowerCase() : 'bin';
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(LEAVE_BUCKET).upload(path, prepared, {
    contentType: prepared.type || undefined,
    upsert: false,
  });
  if (error) {
    console.warn('[uploadLeaveAttachment] error:', error.message);
    return null;
  }
  return path;
}

/** Signed URLs (path → URL) for leave attachments in the private bucket. */
export async function signedLeaveUrls(paths: string[], expiresInSec = 60 * 60): Promise<Record<string, string>> {
  const unique = Array.from(new Set(paths.filter(Boolean)));
  if (unique.length === 0) return {};
  const { data, error } = await supabase.storage.from(LEAVE_BUCKET).createSignedUrls(unique, expiresInSec);
  if (error || !data) {
    if (error) console.warn('[signedLeaveUrls] error:', error.message);
    return {};
  }
  const map: Record<string, string> = {};
  for (const row of data) {
    if (row.signedUrl && row.path) map[row.path] = row.signedUrl;
  }
  return map;
}
