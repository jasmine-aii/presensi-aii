import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { color, radius, space } from '../theme';
import { Txt } from './Txt';

export type BadgeTone = 'brand' | 'human' | 'neutral' | 'success' | 'danger' | 'warning';
export type BadgeVariant = 'solid' | 'soft' | 'outline';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  variant?: BadgeVariant;
  dot?: boolean;
}

const palette: Record<BadgeTone, { base: string; tint: string; onSolid: string; onSoft: string }> = {
  brand: { base: color.anugrahBlue, tint: color.skyTint, onSolid: color.white, onSoft: color.anugrahBlue },
  human: { base: color.humanAccent, tint: color.humanTint, onSolid: color.ink, onSoft: color.deepNavy },
  neutral: { base: color.muted, tint: color.paper, onSolid: color.white, onSoft: color.muted },
  success: { base: color.success, tint: color.successBg, onSolid: color.white, onSoft: color.success },
  danger: { base: color.danger, tint: color.dangerBg, onSolid: color.white, onSoft: color.danger },
  warning: { base: color.warning, tint: color.warningBg, onSolid: color.white, onSoft: color.warning },
};

/** Compact status / category pill. */
export function Badge({ label, tone = 'brand', variant = 'soft', dot }: BadgeProps) {
  const p = palette[tone];
  const container: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: radius.pill,
    ...(variant === 'solid'
      ? { backgroundColor: p.base }
      : variant === 'soft'
        ? { backgroundColor: p.tint }
        : { backgroundColor: 'transparent', borderWidth: 1, borderColor: p.base }),
  };
  const fg = variant === 'solid' ? p.onSolid : variant === 'soft' ? p.onSoft : p.base;
  return (
    <View style={container}>
      {dot && <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: p.base }} />}
      <Txt w="semibold" size={12} color={fg}>
        {label}
      </Txt>
    </View>
  );
}

export default Badge;
