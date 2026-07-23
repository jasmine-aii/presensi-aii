import React, { useEffect, type Ref } from 'react';
import { View, StyleSheet } from 'react-native';
import { MapPin, Camera, CameraOff } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { color } from '../theme';
import { Txt } from './Txt';

export interface CameraViewfinderProps {
  height: number;
  oval?: { w: number; h: number };
  /** Coordinate string for the glass overlay chip. */
  coord: string;
  /** Time string (HH:MM:SS) for the overlay chip. */
  time: string;
  /** Ref to the live camera, so the screen can call takePictureAsync on confirm. */
  cameraRef?: Ref<CameraView>;
  /** Render the live camera (false to keep it off, e.g. inactive screen). */
  active?: boolean;
  /** Caption under the "grant camera" placeholder. */
  permMessage?: string;
}

/**
 * Selfie viewfinder for Clock In / Clock Out. Shows the live FRONT camera
 * (expo-camera) behind a dashed oval face guide and a frosted overlay chip with
 * live coordinates + time. Falls back to a placeholder when the camera
 * permission isn't granted (or camera is unavailable, e.g. some web contexts).
 */
export function CameraViewfinder({
  height,
  oval = { w: 170, h: 210 },
  coord,
  time,
  cameraRef,
  active = true,
  permMessage = 'Izinkan akses kamera',
}: CameraViewfinderProps) {
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (active && permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [active, permission, requestPermission]);

  const showCamera = active && permission?.granted;

  return (
    <View style={{ width: '100%', height, borderRadius: 24, overflow: 'hidden', backgroundColor: color.deepNavy, alignItems: 'center', justifyContent: 'center' }}>
      {showCamera ? (
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" />
      ) : (
        <View style={{ alignItems: 'center', gap: 8, paddingHorizontal: 24 }}>
          {permission && !permission.granted && !permission.canAskAgain ? (
            <>
              <CameraOff size={30} color="rgba(255,255,255,0.5)" strokeWidth={1.75} />
              <Txt size={12} color="rgba(255,255,255,0.5)" style={{ textAlign: 'center' }}>
                {permMessage}
              </Txt>
            </>
          ) : (
            <>
              <Camera size={30} color="rgba(255,255,255,0.5)" strokeWidth={1.75} />
              <Txt size={12} color="rgba(255,255,255,0.5)">
                {permMessage}
              </Txt>
            </>
          )}
        </View>
      )}

      {/* Face-guide oval */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: oval.w,
          height: oval.h,
          marginLeft: -oval.w / 2,
          marginTop: -oval.h / 2,
          borderWidth: 2,
          borderColor: 'rgba(255,255,255,0.7)',
          borderStyle: 'dashed',
          borderRadius: oval.w,
        }}
      />

      {/* Coord + time chip */}
      <View
        style={{
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingVertical: 8,
          paddingHorizontal: 12,
          backgroundColor: 'rgba(14,17,22,0.55)',
          borderRadius: 12,
        }}
      >
        <MapPin size={15} color={color.humanAccent} strokeWidth={2} />
        <Txt mono tabular size={12} color={color.white}>
          {coord} · {time}
        </Txt>
      </View>
    </View>
  );
}

export default CameraViewfinder;
