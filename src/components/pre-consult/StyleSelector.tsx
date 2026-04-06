'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useT, useKo, useLocale } from '@/lib/i18n';
import { usePreConsultStore } from '@/store/pre-consult-store';
import { SelectCard } from '@/components/ui/SelectCard';
import { Button } from '@/components/ui/Button';
import type { StylePreference, StyleKeyword } from '@/types/pre-consultation';

interface StyleSelectorProps {
  onComplete: () => void;
}

interface StylePrefConfig {
  key: StylePreference;
  tKey: string;
  icon: string;
}

interface KeywordConfig {
  key: StyleKeyword;
  tKey: string;
  icon: string;
}

const STYLE_PREFS: StylePrefConfig[] = [
  { key: 'photo_match', tKey: 'preConsult.stylePhotoMatch', icon: '📸' },
  { key: 'natural_fit', tKey: 'preConsult.styleNaturalFit', icon: '🌸' },
  { key: 'clean_subtle', tKey: 'preConsult.styleCleanSubtle', icon: '🕊️' },
];

const KEYWORDS: KeywordConfig[] = [
  { key: 'office_friendly', tKey: 'preConsult.kwOffice', icon: '💼' },
  { key: 'slim_fingers', tKey: 'preConsult.kwSlim', icon: '✋' },
  { key: 'tidy_look', tKey: 'preConsult.kwTidy', icon: '🪄' },
  { key: 'subtle_point', tKey: 'preConsult.kwPoint', icon: '💡' },
  { key: 'more_fancy', tKey: 'preConsult.kwFancy', icon: '💎' },
];

export function StyleSelector({ onComplete }: StyleSelectorProps): React.ReactElement {
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();
  const store = usePreConsultStore();
  const [stylePrefSelected, setStylePrefSelected] = useState(store.stylePreference !== null);

  const handleStylePref = (pref: StylePreference): void => {
    store.setStylePreference(pref);
    setStylePrefSelected(true);
  };

  const handleKeywordToggle = (kw: StyleKeyword): void => {
    store.toggleStyleKeyword(kw);
  };

  const handleNext = (): void => {
    onComplete();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Section 1: Single select style preference */}
      <div>
        <h3 className="text-base font-bold text-text">
          {t('preConsult.styleTitle')}
        </h3>
        {locale !== 'ko' && (
          <p className="text-xs text-text-muted opacity-60 mt-0.5">
            {tKo('preConsult.styleTitle')}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {STYLE_PREFS.map((pref) => (
          <SelectCard
            key={pref.key}
            selected={store.stylePreference === pref.key}
            onSelect={() => handleStylePref(pref.key)}
            icon={<span>{pref.icon}</span>}
            title={t(pref.tKey)}
            subLabel={locale !== 'ko' ? tKo(pref.tKey) : undefined}
          />
        ))}
      </div>

      {/* Section 2: Multi select keywords — reveal after style pref selected */}
      {stylePrefSelected && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col gap-3 pt-2"
        >
          <div>
            <p className="text-sm font-semibold text-text">
              {t('preConsult.keywordTitle')}
            </p>
            {locale !== 'ko' && (
              <p className="text-xs text-text-muted opacity-60">
                {tKo('preConsult.keywordTitle')}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {KEYWORDS.map((kw) => {
              const isSelected = store.styleKeywords.includes(kw.key);
              return (
                <button
                  key={kw.key}
                  type="button"
                  onClick={() => handleKeywordToggle(kw.key)}
                  className={[
                    'w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 text-left',
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-surface hover:border-primary/40',
                  ].join(' ')}
                >
                  <span className="text-lg flex-shrink-0">{kw.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${isSelected ? 'text-primary' : 'text-text'}`}>
                      {t(kw.tKey)}
                    </p>
                    {locale !== 'ko' && (
                      <p className="text-xs text-text-muted opacity-60">
                        {tKo(kw.tKey)}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <svg className="w-5 h-5 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          <Button fullWidth onClick={handleNext} className="mt-2">
            {t('preConsult.next')}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
