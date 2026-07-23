import React from 'react';
import { View, Image } from 'react-native';
import { color } from '../theme';
import { Txt } from './Txt';

export interface AvatarProps {
  name: string;
  src?: string;
  size?: number;
  /** Border ring — pass a colour (e.g. teal at 50%) or true for the human accent. */
  ring?: string | boolean;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Circular avatar — photo when available, sky-tint initials otherwise. */
export function Avatar({ name, src, size = 46, ring }: AvatarProps) {
  const ringColor = ring === true ? color.humanAccent : typeof ring === 'string' ? ring : undefined;
  const border = ringColor ? { borderWidth: size >= 64 ? 3 : 2, borderColor: ringColor } : {};
  const common = { width: size, height: size, borderRadius: size / 2, ...border };
  if (src) {
    return <Image accessibilityLabel={name} source={{ uri: src }} style={[common, { resizeMode: 'cover' }]} />;
  }
  return (
    <View
      accessibilityLabel={name}
      style={[common, { backgroundColor: color.skyTint, alignItems: 'center', justifyContent: 'center' }]}
    >
      <Txt w="bold" size={Math.round(size * 0.38)} color={color.anugrahBlue}>
        {initials(name)}
      </Txt>
    </View>
  );
}

export default Avatar;
