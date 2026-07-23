import React from 'react';
import { View } from 'react-native';
import { type LucideIcon } from 'lucide-react-native';
import { color } from '../theme';

export interface IconTileProps {
  icon: LucideIcon;
  size?: number;
  radius?: number;
  iconSize?: number;
  bg?: string;
  fg?: string;
}

/** Rounded tinted box behind quick-menu, leave-type and list-row icons. */
export function IconTile({
  icon: Icon,
  size = 44,
  radius = 14,
  iconSize = 24,
  bg = color.skyTint,
  fg = color.anugrahBlue,
}: IconTileProps) {
  return (
    <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={iconSize} color={fg} strokeWidth={2} />
    </View>
  );
}

export default IconTile;
