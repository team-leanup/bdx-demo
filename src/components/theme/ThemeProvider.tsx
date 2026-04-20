'use client';

import { useEffect } from 'react';
import { MotionConfig } from 'framer-motion';
import { useThemeStore } from '@/store/theme-store';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const themeId = useThemeStore((s) => s.themeId);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeId);
  }, [themeId]);

  // 2026-04-20 R6: OS의 prefers-reduced-motion 설정을 모든 framer-motion 애니메이션에 전파
  // 전정기관 민감 사용자·고령층 접근성 개선
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
