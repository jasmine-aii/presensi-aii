import React from 'react';
import { Pressable, View } from 'react-native';
import { color, radius } from '../theme';

export interface ToggleProps {
  on: boolean;
  onChange?: (on: boolean) => void;
  label?: string;
}

/** 40×24 pill switch — Anugrah blue when on. */
export function Toggle({ on, onChange, label }: ToggleProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      onPress={() => onChange?.(!on)}
      style={{
        width: 40,
        height: 24,
        borderRadius: radius.pill,
        backgroundColor: on ? color.anugrahBlue : color.line,
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: 3,
          left: on ? 19 : 3,
          width: 18,
          height: 18,
          borderRadius: radius.pill,
          backgroundColor: color.white,
        }}
      />
    </Pressable>
  );
}

export default Toggle;
