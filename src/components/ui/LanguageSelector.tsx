'use client';

import { useLocaleStore } from '@/store/locale-store';
import type { Locale } from '@/store/locale-store';

const LANGUAGES: { locale: Locale; flag: string; label: string }[] = [
  { locale: 'ko', flag: '🇰🇷', label: '한국어' },
  { locale: 'en', flag: '🇺🇸', label: 'English' },
  { locale: 'zh', flag: '🇨🇳', label: '中文' },
  { locale: 'ja', flag: '🇯🇵', label: '日本語' },
];

export function LanguageSelector() {
  const { locale, setLocale } = useLocaleStore();

  return (
    <div className="flex flex-wrap gap-2">
      {LANGUAGES.map(({ locale: lang, flag, label }) => {
        const isActive = locale === lang;
        return (
          <button
            key={lang}
            onClick={() => setLocale(lang)}
            className={[
              'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface-alt border border-border text-text-secondary hover:border-primary/40 hover:text-text',
            ].join(' ')}
          >
            <span className="text-base leading-none">{flag}</span>
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
