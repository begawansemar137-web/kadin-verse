/**
 * PLACEHOLDER tokens. Not KADIN brand values and not derived from the legacy APK
 * (UIUX-ANALYSIS.md §5.3: real tokens are UNKNOWN). Replace only from an approved uiux.md.
 */
export const tokenStatus = 'PLACEHOLDER' as const;

export const color = {
  background: '#FFFFFF',
  surface: '#F4F5F7',
  textPrimary: '#1A1D21',
  textSecondary: '#4A5160',
  primary: '#1F4E8C',
  onPrimary: '#FFFFFF',
  danger: '#B3261E',
  border: '#C9CDD4',
} as const;

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 4, md: 8, lg: 16 } as const;
export const fontSize = { small: 14, body: 16, title: 22, heading: 28 } as const;
export const minTouchTarget = 48;

export { contrastRatio } from './contrast';
