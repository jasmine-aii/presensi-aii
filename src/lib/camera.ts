import * as ImageManipulator from 'expo-image-manipulator';
import type { CameraView } from 'expo-camera';

/**
 * Capture the front-camera selfie and un-mirror it (flip horizontal) so the
 * saved photo reads naturally — text/badges aren't reversed — instead of the
 * mirror image the preview shows. Downscaled to 720px wide before upload: a
 * face-verification selfie needs no more, and it keeps storage tiny (~30–60KB
 * vs full-res). Returns bare base64 JPEG, or null on failure (capture is
 * best-effort; the geofence is the hard gate).
 */
export async function captureSelfie(cam: CameraView | null): Promise<string | null> {
  if (!cam?.takePictureAsync) return null;
  try {
    const shot = await cam.takePictureAsync({ quality: 0.6 });
    if (!shot?.uri) return null;
    const flipped = await ImageManipulator.manipulateAsync(
      shot.uri,
      [{ resize: { width: 720 } }, { flip: ImageManipulator.FlipType.Horizontal }],
      { base64: true, compress: 0.4, format: ImageManipulator.SaveFormat.JPEG },
    );
    return flipped.base64 ?? null;
  } catch {
    return null;
  }
}
