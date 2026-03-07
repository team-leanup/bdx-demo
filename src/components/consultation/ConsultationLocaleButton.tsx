'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocaleStore } from '@/store/locale-store';
import type { Locale } from '@/store/locale-store';

const LOCALES: { locale: Locale; flag: string; label: string; abbr: string }[] = [
  { locale: 'ko', flag: '🇰🇷', label: '한국어', abbr: 'KO' },
  { locale: 'en', flag: '🇺🇸', label: 'English', abbr: 'EN' },
  { locale: 'zh', flag: '🇨🇳', label: '中文', abbr: 'ZH' },
  { locale: 'ja', flag: '🇯🇵', label: '日本語', abbr: 'JA' },
];

export function ConsultationLocaleButton() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const current = LOCALES.find((l) => l.locale === locale) ?? LOCALES[0];

  return (
    <div ref={ref} className="fixed top-4 right-4 z-50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-border shadow-sm text-xs font-bold text-text hover:border-primary/40 hover:bg-surface-alt transition-all"
        aria-label="Change language"
      >
        <span>🌐</span>
        <span>{current.abbr}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-1.5 flex flex-col gap-1 bg-surface border border-border rounded-2xl shadow-lg p-1.5 min-w-[140px]"
          >
            {LOCALES.map((l) => (
              <button
                key={l.locale}
                type="button"
                onClick={() => {
                  setLocale(l.locale);
                  setOpen(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left ${
                  locale === l.locale
                    ? 'bg-surface-alt text-primary border border-primary'
                    : 'text-text hover:bg-surface-alt'
                }`}
              >
                <span>{l.flag}</span>
                <span>{l.label}</span>
                {locale === l.locale && (
                  <span className="ml-auto text-primary">✓</span>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
