import React from 'react';
import { View, Pressable } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { color, space, radius } from '../theme';
import { Txt } from './Txt';

export interface TopAppBarProps {
  title: string;
  onBack?: () => void;
  trailing?: React.ReactNode;
}

/** Pushed-view app bar: back chevron + title + optional trailing node. */
export function TopAppBar({ title, onBack, trailing }: TopAppBarProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        paddingVertical: space.md,
        paddingHorizontal: space.md,
        backgroundColor: color.white,
        borderBottomWidth: 1,
        borderBottomColor: color.line,
      }}
    >
      {onBack && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          style={{ width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={22} color={color.ink} strokeWidth={2} />
        </Pressable>
      )}
      <Txt w="bold" size={20} color={color.ink} style={{ flex: 1 }}>
        {title}
      </Txt>
      {trailing}
    </View>
  );
}

export default TopAppBar;
