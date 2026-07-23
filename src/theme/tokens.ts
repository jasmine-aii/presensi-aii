/**
 * Design tokens (vendored copy of `@anugrah/tokens`).
 *
 * These are the platform-neutral brand values. Once `@anugrah/tokens` is
 * published to npm, delete this file and change `src/theme/index.ts` to:
 *   export * from '@anugrah/tokens';
 * The values below are identical to that package's `src/index.ts`.
 */

export const color = {
  anugrahBlue: '#1F46DE',
  deepNavy: '#16215E',
  ink: '#0E1116',
  humanAccent: '#95FCF6',
  humanTint: '#E4FAF8',
  skyTint: '#EDF0FF',
  paper: '#F6F7F9',
  white: '#FFFFFF',
  line: '#E4E7EE',
  muted: '#5B6474',
  success: '#1F9D55',
  danger: '#D23F3F',
  warning: '#B7791F',
  warningBg: '#FFF4E5',
  successBg: '#E7F6EE',
  dangerBg: '#FBE9E9',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 18,
  xl: 22,
  '2xl': 44,
  '3xl': 78,
  '4xl': 96,
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 22,
  pill: 999,
} as const;

export const fontSize = {
  display: 82,
  displaySm: 46,
  h2: 28,
  h3: 24,
  h4: 20,
  body: 17,
  bodySm: 15,
  caption: 13,
  micro: 12,
} as const;

export const shadow = {
  soft: { x: 0, y: 6, blur: 18, color: 'rgba(20,33,94,0.06)', opacity: 0.06, elevation: 2 },
  card: { x: 0, y: 12, blur: 30, color: 'rgba(20,33,94,0.12)', opacity: 0.12, elevation: 6 },
  raised: { x: 0, y: 18, blur: 44, color: 'rgba(20,33,94,0.18)', opacity: 0.18, elevation: 12 },
} as const;

export type ShadowName = keyof typeof shadow;
