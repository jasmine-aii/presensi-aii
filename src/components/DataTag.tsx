import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { color, radius, space } from '../theme';
import { Txt } from './Txt';

export type DataTagTone = 'default' | 'brand' | 'human' | 'navy';

export interface DataTagProps {
  label?: string;
  value: string;
  tone?: DataTagTone;
}

const tones: Record<DataTagTone, { bg: string; fg: string; label: string; border: string }> = {
  default: { bg: color.paper, fg: color.ink, label: color.muted, border: color.line },
  brand: { bg: color.skyTint, fg: color.anugrahBlue, label: '#5B6BB0', border: '#DDE3FA' },
  human: { bg: color.humanTint, fg: color.deepNavy, label: '#3E7D79', border: '#C9F0ED' },
  navy: { bg: color.deepNavy, fg: color.white, label: 'rgba(255,255,255,0.6)', border: 'rgba(255,255,255,0.14)' },
};

/** Monospace data chip for coordinates, times, ids — the JetBrains Mono counterpart to Badge. */
export function DataTag({ label, value, tone = 'default' }: DataTagProps) {
  const t = tones[tone];
  const container: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    alignSelf: 'flex-start',
    backgroundColor: t.bg,
    borderWidth: 1,
    borderColor: t.border,
    borderRadius: radius.sm,
    paddingVertical: space[5],
    paddingHorizontal: space[10],
  };
  return (
    <View style={container}>
      {label != null && (
        <Txt w="medium" size={12} color={t.label}>
          {label}
        </Txt>
      )}
      <Txt mono tabular size={13} color={t.fg}>
        {value}
      </Txt>
    </View>
  );
}

export default DataTag;
