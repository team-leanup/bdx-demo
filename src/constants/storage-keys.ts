export const STORAGE_KEYS = {
  theme: 'bdx-theme',
  locale: 'bdx-locale',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
