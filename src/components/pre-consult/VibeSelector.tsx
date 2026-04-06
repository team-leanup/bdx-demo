'use client';

import { motion } from 'framer-motion';
import { useT, useKo, useLocale } from '@/lib/i18n';
import { usePreConsultStore } from '@/store/pre-consult-store';
import type { DesignFeel } from '@/types/pre-consultation';

interface VibeSelectorProps {
  onComplete: () => void;
}

interface VibeConfig {
  key: DesignFeel;
  icon: string;
  tKey: string;
}

const VIBES: VibeConfig[] = [
  { key: 'natural', icon: '🌿', tKey: 'preConsult.feelNatural' },
  { key: 'french', icon: '🤍', tKey: 'preConsult.feelFrench' },
  { key: 'trendy', icon: '✨', tKey: 'preConsult.feelTrendy' },
  { key: 'fancy', icon: '💫', tKey: 'preConsult.feelFancy' },
];

export function VibeSelector({ onComplete }: VibeSelectorProps): React.ReactElement {
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();
  const store = usePreConsultStore();

  const handleSelect = (feel: DesignFeel): void => {
    store.setDesignFeel(feel);
    onComplete();
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-base font-bold text-text">
          {t('preConsult.feelTitle')}
        </h3>
        {locale !== 'ko' && (
          <p className="text-xs text-text-muted opacity-60 mt-0.5">
            {tKo('preConsult.feelTitle')}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {VIBES.map((vibe) => {
          const isSelected = store.designFeel === vibe.key;
          return (
            <motion.button
              key={vibe.key}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelect(vibe.key)}
              className={[
                'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200',
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-surface hover:border-primary/40',
              ].join(' ')}
            >
              <span className="text-3xl">{vibe.icon}</span>
              <div className="text-center">
                <p className={`font-semibold text-sm ${isSelected ? 'text-primary' : 'text-text'}`}>
                  {t(vibe.tKey)}
                </p>
                {locale !== 'ko' && (
                  <p className="text-[10px] text-text-muted opacity-60 mt-0.5">
                    {tKo(vibe.tKey)}
                  </p>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
