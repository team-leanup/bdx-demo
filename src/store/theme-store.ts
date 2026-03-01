'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ThemeId } from '@/types/theme';
import { DEFAULT_THEME_ID } from '@/config/themes';

interface ThemeStore {
  themeId: ThemeId;
  setTheme: (id: ThemeId) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      themeId: DEFAULT_THEME_ID as ThemeId,
      setTheme: (id) => set({ themeId: id }),
    }),
    {
      name: 'bdx-theme',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      ),
    },
  ),
);
