import React from 'react';
import { View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { color, space, radius } from '../theme';
import { Txt } from './Txt';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
}

/** Friendly empty-list placeholder: tinted icon badge + title + optional hint. */
export function EmptyState({ icon: Icon, title, subtitle }: EmptyStateProps) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: space['2xl'], gap: space.md }}>
      <View style={{ width: 56, height: 56, borderRadius: radius.pill, backgroundColor: color.skyTint, alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={26} color={color.anugrahBlue} strokeWidth={2} />
      </View>
      <View style={{ alignItems: 'center', gap: space.xs, paddingHorizontal: space.lg }}>
        <Txt w="semibold" size={14} color={color.ink} style={{ textAlign: 'center' }}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt size={12} color={color.muted} style={{ textAlign: 'center', lineHeight: 17 }}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
    </View>
  );
}

export default EmptyState;
