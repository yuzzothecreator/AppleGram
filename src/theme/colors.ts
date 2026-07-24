/**
 * Applegram — Telegram iOS color tokens.
 */

export type ThemeName = 'light' | 'dark';

export interface Palette {
  background: string;
  surface: string;
  surfaceElevated: string;
  chatBackground: string;

  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  primary: string;
  primaryMuted: string;
  onPrimary: string;

  bubbleOut: string;
  bubbleOutText: string;
  bubbleIn: string;
  bubbleInText: string;

  success: string;
  danger: string;
  warning: string;
  online: string;

  border: string;
  separator: string;
  overlay: string;
  shadow: string;
}

const light: Palette = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#F1F1F1',
  chatBackground: '#B7C9DB',

  text: '#000000',
  textSecondary: '#3A3A3C',
  textMuted: '#8A8A8E',
  textInverse: '#FFFFFF',

  primary: '#3390EC',
  primaryMuted: '#E3F0FC',
  onPrimary: '#FFFFFF',

  bubbleOut: '#EEFFDE',
  bubbleOutText: '#000000',
  bubbleIn: '#FFFFFF',
  bubbleInText: '#000000',

  success: '#4FAE4E',
  danger: '#E53935',
  warning: '#F5A623',
  online: '#4FAE4E',

  border: '#D9D9D9',
  separator: '#D9D9D9',
  overlay: 'rgba(0,0,0,0.4)',
  shadow: 'rgba(0,0,0,0.18)',
};

const dark: Palette = {
  background: '#0E1621',
  surface: '#17212B',
  surfaceElevated: '#232E3C',
  chatBackground: '#0E1621',

  text: '#F5F5F5',
  textSecondary: '#B1C3D5',
  textMuted: '#6D7F8F',
  textInverse: '#0E1621',

  primary: '#6AB3F3',
  primaryMuted: '#1E3A5F',
  onPrimary: '#FFFFFF',

  bubbleOut: '#2B5278',
  bubbleOutText: '#FFFFFF',
  bubbleIn: '#182533',
  bubbleInText: '#FFFFFF',

  success: '#4FAE4E',
  danger: '#E53935',
  warning: '#F5A623',
  online: '#4FAE4E',

  border: '#0F1A24',
  separator: '#0F1A24',
  overlay: 'rgba(0,0,0,0.55)',
  shadow: 'rgba(0,0,0,0.45)',
};

export const palettes: Record<ThemeName, Palette> = { light, dark };

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 28, fontWeight: '700' as const },
  heading: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  tiny: { fontSize: 11, fontWeight: '500' as const },
};
