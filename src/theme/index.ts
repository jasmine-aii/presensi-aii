import { Platform, type ViewStyle, type TextStyle } from 'react-native';
import { shadow, type ShadowName } from './tokens';

export * from './tokens';

/**
 * Inter weight → the exact family name registered by `@expo-google-fonts/inter`
 * (loaded in App.tsx). React Native picks the face by family name, not
 * `fontWeight`, so we resolve it explicitly.
 */
export type Weight = 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';

const interByWeight: Record<Weight, string> = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
  black: 'Inter_900Black',
};

export const interFamily = (w: Weight = 'regular') => interByWeight[w];

/** JetBrains Mono for technical numbers (coordinates, ids). */
export const monoFamily = 'JetBrainsMono_500Medium';

/** Tabular figures for clocks, durations, coordinates. */
export const tabular: TextStyle = { fontVariant: ['tabular-nums'] };

/** Map a structural shadow token to a React Native style (iOS shadow + Android elevation). */
export function elevation(name: ShadowName): ViewStyle {
  const s = shadow[name];
  return Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#14215E',
      shadowOffset: { width: s.x, height: s.y },
      shadowOpacity: s.opacity,
      shadowRadius: s.blur / 2,
    },
    android: { elevation: s.elevation },
    default: {},
  })!;
}
