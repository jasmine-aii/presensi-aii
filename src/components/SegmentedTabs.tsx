import React from 'react';
import { View, Pressable } from 'react-native';
import { color, space } from '../theme';
import { Txt } from './Txt';

export interface SegmentedTab {
  key: string;
  label: string;
}

export interface SegmentedTabsProps {
  tabs: SegmentedTab[];
  active: string;
  onChange: (key: string) => void;
}

/** Underlined segmented control (e.g. Approval queue's Pending · 3 / History). */
export function SegmentedTabs({ tabs, active, onChange }: SegmentedTabsProps) {
  return (
    <View style={{ flexDirection: 'row', gap: space.xl }}>
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <Pressable key={t.key} onPress={() => onChange(t.key)} style={{ paddingBottom: space.md, borderBottomWidth: 2, borderBottomColor: isActive ? color.anugrahBlue : 'transparent' }}>
            <Txt w={isActive ? 'bold' : 'semibold'} size={14} color={isActive ? color.anugrahBlue : color.muted}>
              {t.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export default SegmentedTabs;
