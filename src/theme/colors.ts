/**
 * Applegram color tokens — iPhone Messages inspired.
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
  background: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  chatBackground: '#FFFFFF',

  text: '#000000',
  textSecondary: '#3C3C43',
  textMuted: '#8E8E93',
  textInverse: '#FFFFFF',

  primary: '#007AFF',
  primaryMuted: '#E5F1FF',
  onPrimary: '#FFFFFF',

  bubbleOut: '#007AFF',
  bubbleOutText: '#FFFFFF',
  bubbleIn: '#E9E9EB',
  bubbleInText: '#000000',

  success: '#34C759',
  danger: '#FF3B30',
  warning: '#FF9500',
  online: '#34C759',

  border: '#C6C6C8',
  separator: '#C6C6C8',
  overlay: 'rgba(0,0,0,0.4)',
  shadow: 'rgba(0,0,0,0.12)',
};

const dark: Palette = {
  background: '#000000',
  surface: '#1C1C1E',
  surfaceElevated: '#2C2C2E',
  chatBackground: '#000000',

  text: '#FFFFFF',
  textSecondary: '#EBEBF5',
  textMuted: '#8E8E93',
  textInverse: '#000000',

  primary: '#0A84FF',
  primaryMuted: '#0A2847',
  onPrimary: '#FFFFFF',

  bubbleOut: '#0A84FF',
  bubbleOutText: '#FFFFFF',
  bubbleIn: '#3A3A3C',
  bubbleInText: '#FFFFFF',

  success: '#30D158',
  danger: '#FF453A',
  warning: '#FF9F0A',
  online: '#30D158',

  border: '#38383A',
  separator: '#38383A',
  overlay: 'rgba(0,0,0,0.55)',
  shadow: 'rgba(0,0,0,0.5)',
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
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 34, fontWeight: '700' as const },
  heading: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 17, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  tiny: { fontSize: 11, fontWeight: '500' as const },
};
