/**
 * Teleprompt color tokens. Telegram-inspired but with our own accent.
 * Keep all color usage going through these palettes so theming stays consistent.
 */

export type ThemeName = 'light' | 'dark';

export interface Palette {
  // surfaces
  background: string;
  surface: string;
  surfaceElevated: string;
  chatBackground: string;

  // text
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // brand / accent
  primary: string;
  primaryMuted: string;
  onPrimary: string;

  // chat bubbles
  bubbleOut: string;
  bubbleOutText: string;
  bubbleIn: string;
  bubbleInText: string;

  // status & feedback
  success: string;
  danger: string;
  warning: string;
  online: string;

  // lines & misc
  border: string;
  separator: string;
  overlay: string;
  shadow: string;
}

const light: Palette = {
  background: '#FFFFFF',
  surface: '#F4F5F7',
  surfaceElevated: '#FFFFFF',
  chatBackground: '#E7EBF0',

  text: '#0E1621',
  textSecondary: '#3A4A5C',
  textMuted: '#8A98A6',
  textInverse: '#FFFFFF',

  primary: '#2E7CF6',
  primaryMuted: '#D7E6FE',
  onPrimary: '#FFFFFF',

  bubbleOut: '#2E7CF6',
  bubbleOutText: '#FFFFFF',
  bubbleIn: '#FFFFFF',
  bubbleInText: '#0E1621',

  success: '#2BB673',
  danger: '#E5484D',
  warning: '#F5A623',
  online: '#34C759',

  border: '#E2E6EB',
  separator: '#ECEFF3',
  overlay: 'rgba(14,22,33,0.45)',
  shadow: 'rgba(14,22,33,0.12)',
};

const dark: Palette = {
  background: '#0E1621',
  surface: '#17212B',
  surfaceElevated: '#1D2733',
  chatBackground: '#0B1620',

  text: '#FFFFFF',
  textSecondary: '#AEBAC6',
  textMuted: '#6E7C8A',
  textInverse: '#0E1621',

  primary: '#5AA0FF',
  primaryMuted: '#1E3A5F',
  onPrimary: '#FFFFFF',

  bubbleOut: '#2B5278',
  bubbleOutText: '#FFFFFF',
  bubbleIn: '#1D2733',
  bubbleInText: '#FFFFFF',

  success: '#4CD08A',
  danger: '#FF6168',
  warning: '#F7B955',
  online: '#3DDC84',

  border: '#22303C',
  separator: '#1A2730',
  overlay: 'rgba(0,0,0,0.55)',
  shadow: 'rgba(0,0,0,0.4)',
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
  md: 14,
  lg: 20,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 22, fontWeight: '700' as const },
  heading: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  tiny: { fontSize: 11, fontWeight: '500' as const },
};
