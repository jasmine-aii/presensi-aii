import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { interFamily, monoFamily, type Weight } from '../theme';

export interface TxtProps extends TextProps {
  /** Inter weight → resolves the correct loaded font family. */
  w?: Weight;
  size?: number;
  color?: string;
  /** Use JetBrains Mono (technical numbers). */
  mono?: boolean;
  /** Tabular figures. */
  tabular?: boolean;
  children?: React.ReactNode;
}

/**
 * App text primitive. React Native selects a face by family name (not
 * `fontWeight`), so this resolves Inter's per-weight family for you.
 */
export function Txt({ w = 'regular', size, color, mono, tabular, style, children, ...rest }: TxtProps) {
  const base: TextStyle = {
    fontFamily: mono ? monoFamily : interFamily(w),
    ...(size != null ? { fontSize: size } : null),
    ...(color != null ? { color } : null),
    ...(tabular ? { fontVariant: ['tabular-nums'] } : null),
  };
  return (
    <Text style={[base, style]} {...rest}>
      {children}
    </Text>
  );
}

export default Txt;
