import React from 'react';
import { View } from 'react-native';
import { MapPin, Camera } from 'lucide-react-native';
import { color } from '../theme';
import { Txt } from './Txt';

export interface CameraViewfinderProps {
  height: number;
  oval?: { w: number; h: number };
  coord: string;
  time: string;
  placeholder?: string;
}

/**
 * Selfie viewfinder for Clock In / Clock Out: navy camera surface, dashed oval
 * face guide, and a frosted overlay chip with live coordinates + time. Swap the
 * navy fill for an `expo-camera` <CameraView> in production.
 */
export function CameraViewfinder({
  height,
  oval = { w: 170, h: 210 },
  coord,
  time,
  placeholder = 'Kamera selfie',
}: CameraViewfinderProps) {
  return (
    <View
      style={{
        width: '100%',
        height,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: color.deepNavy,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Camera-feed placeholder */}
      <View style={{ alignItems: 'center', gap: 8 }}>
        <Camera size={30} color="rgba(255,255,255,0.5)" strokeWidth={1.75} />
        <Txt size={12} color="rgba(255,255,255,0.5)">
          {placeholder}
        </Txt>
      </View>

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
