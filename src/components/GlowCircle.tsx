import React from 'react';
import { View, type DimensionValue } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';

export interface GlowCircleProps {
  size: number;
  top: number;
  right?: number;
  left?: number;
  /** Center colour of the radial glow. */
  color?: string;
}

/**
 * Decorative radial glow behind the navy hero surfaces (Home clock card,
 * Profile header). react-native has no CSS radial-gradient, so we draw one.
 */
export function GlowCircle({ size, top, right, left, color = '#1F46DE' }: GlowCircleProps) {
  const pos =
    right != null
      ? { right: right as DimensionValue }
      : left != null
        ? { left: left as DimensionValue }
        : {};
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top, width: size, height: size, ...pos }}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={0.55} />
            <Stop offset="68%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#glow)" />
      </Svg>
    </View>
  );
}

export default GlowCircle;
