export type ThemeId =
  | 'pastel-pink'
  | 'rose-pink'
  | 'pure-ivory'
  | 'soft-ivory'
  | 'clean-black'
  | 'olive-green'
  | 'pastel-blue'
  | 'pastel-lilac';

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
