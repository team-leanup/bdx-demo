'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/store/theme-store';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const themeId = useThemeStore((s) => s.themeId);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeId);
  }, [themeId]);

  return <>{children}</>;
}
