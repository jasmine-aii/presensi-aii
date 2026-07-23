import React from 'react';
import { Pressable, View, StyleSheet, type ViewStyle } from 'react-native';
import { color, radius, space, elevation } from '../theme';
import { Txt } from './Txt';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  leading?: React.ReactNode;
  onPress?: () => void;
}

const sizes: Record<ButtonSize, { fontSize: number; padV: number; padH: number; radius: number }> = {
  sm: { fontSize: 13, padV: space.sm, padH: space.md, radius: radius.sm },
  md: { fontSize: 15, padV: space.md, padH: space.xl, radius: radius.sm },
  lg: { fontSize: 17, padV: 16, padH: space['2xl'], radius: radius.md },
};

const fills: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: color.anugrahBlue, fg: color.white },
  secondary: { bg: color.white, fg: color.anugrahBlue, border: color.anugrahBlue },
  ghost: { bg: 'transparent', fg: color.deepNavy },
};

export function Button({ label, variant = 'primary', size = 'md', fullWidth, disabled, leading, onPress }: ButtonProps) {
  const sz = sizes[size];
  const f = fills[variant];
  const style: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    backgroundColor: f.bg,
    borderRadius: sz.radius,
    borderWidth: f.border ? 1 : 0,
    borderColor: f.border,
    paddingVertical: sz.padV,
    paddingHorizontal: sz.padH,
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
    opacity: disabled ? 0.45 : 1,
    ...(variant === 'primary' && !disabled ? elevation('soft') : null),
  };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [style, pressed && !disabled ? styles.pressed : null]}
    >
      {leading != null && <View>{leading}</View>}
      <Txt w="semibold" size={sz.fontSize} color={f.fg}>
        {label}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },
});

export default Button;
