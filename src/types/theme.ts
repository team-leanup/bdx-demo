export type ThemeId =
  | 'rose-pink'
  | 'soft-ivory'
  | 'clean-black'
  | 'olive-green'
  | 'pastel-blue'
  | 'pastel-lilac'
  | 'pastel-pink'
  | 'pastel-mint'
  | 'pastel-yellow'
  | 'pastel-mix';

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

export interface ThemePreset {
  id: ThemeId;
  name: string;
  nameEn: string;
  description: string;
  emoji: string;
  isDark: boolean;
  colors: ThemeColors;
}
