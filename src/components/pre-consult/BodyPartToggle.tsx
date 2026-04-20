'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useT, useKo, useLocale } from '@/lib/i18n';
import { usePreConsultStore } from '@/store/pre-consult-store';
import type { BodyPart } from '@/types/pre-consultation';

interface BodyPartOption {
  key: BodyPart;
  icon: string;
  tKey: string;
}

const OPTIONS: BodyPartOption[] = [
  { key: 'hand', icon: '🖐️', tKey: 'preConsult.bodyPartHand' },
  { key: 'foot', icon: '🦶', tKey: 'preConsult.bodyPartFoot' },
];

export function BodyPartToggle(): React.ReactElement {
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();
  const bodyPart = usePreConsultStore((s) => s.bodyPart);
  const setBodyPart = usePreConsultStore((s) => s.setBodyPart);

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-sm font-semibold text-text">
        {t('preConsult.bodyPartTitle')}
        {locale !== 'ko' && (
          <span className="ml-1.5 text-xs text-text-muted opacity-60">
            {tKo('preConsult.bodyPartTitle')}
          </span>
        )}
      </p>
      <div
        role="tablist"
        aria-label={t('preConsult.bodyPartTitle')}
        className="inline-flex rounded-full border border-border bg-surface p-1 shadow-sm"
      >
        {OPTIONS.map((opt) => {
          const isSelected = bodyPart === opt.key;
          return (
            <motion.button
              key={opt.key}
              type="button"
              role="tab"
              aria-selected={isSelected}
              whileTap={{ scale: 0.96 }}
              onClick={() => setBodyPart(opt.key)}
              className={[
                'flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium transition-colors',
                isSelected
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text',
              ].join(' ')}
            >
              <span className="text-base leading-none">{opt.icon}</span>
              <span>{t(opt.tKey)}</span>
              {locale !== 'ko' && !isSelected && (
                <span className="text-xs opacity-50">{tKo(opt.tKey)}</span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
