'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/constants/storage-keys';

export type Locale = 'ko' | 'en' | 'zh' | 'ja';

interface LocaleStore {
  locale: Locale;
  previousLocale: Locale | null;
  setLocale: (locale: Locale) => void;
  setConsultationLocale: (locale: Locale) => void;
  restoreLocale: () => void;
}

export const useLocaleStore = create<LocaleStore>()(
  persist(
    (set, get) => ({
      locale: 'ko',
      previousLocale: null,
      setLocale: (locale) => set({ locale }),
      setConsultationLocale: (locale) =>
        set((state) => ({ previousLocale: state.locale, locale })),
      restoreLocale: () => {
        const prev = get().previousLocale;
        if (prev) {
          set({ locale: prev, previousLocale: null });
        }
      },
    }),
    {
      name: STORAGE_KEYS.locale,
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            },
      ),
    },
  ),
);
