'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useT, useKo, useLocale } from '@/lib/i18n';
import { usePreConsultStore } from '@/store/pre-consult-store';
import type { DesignCategory } from '@/types/pre-consultation';

interface CategoryConfig {
  key: DesignCategory;
  icon: string;
  tKey: string;
  tDescKey: string;
}

const CATEGORIES: CategoryConfig[] = [
  { key: 'simple', icon: '💅', tKey: 'preConsult.catSimple', tDescKey: 'preConsult.catSimpleDesc' },
  { key: 'french', icon: '🤍', tKey: 'preConsult.catFrench', tDescKey: 'preConsult.catFrenchDesc' },
  { key: 'magnet', icon: '✨', tKey: 'preConsult.catMagnet', tDescKey: 'preConsult.catMagnetDesc' },
  { key: 'art', icon: '🎨', tKey: 'preConsult.catArt', tDescKey: 'preConsult.catArtDesc' },
];

export function CategoryPicker(): React.ReactElement {
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();
  const selected = usePreConsultStore((s) => s.selectedCategory);
  const setSelected = usePreConsultStore((s) => s.setSelectedCategory);
  const setSelectedPhotoUrl = usePreConsultStore((s) => s.setSelectedPhotoUrl);
  const shopData = usePreConsultStore((s) => s.shopData);

  const getPriceHint = (cat: DesignCategory): string => {
    if (!shopData?.categoryPricing) return '';
    const price = shopData.categoryPricing[cat]?.price;
    if (!price) return '';
    return `${(price / 1000).toFixed(0)},000${t('preConsult.won')}~`;
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {CATEGORIES.map((cat) => {
        const isSelected = selected === cat.key;
        return (
          <motion.button
            key={cat.key}
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              if (selected !== cat.key) {
                setSelectedPhotoUrl(null);
              }
              setSelected(cat.key);
            }}
            className={[
              'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200',
              isSelected
                ? 'border-primary bg-primary/10'
                : 'border-border bg-surface hover:border-primary/40',
            ].join(' ')}
          >
            <span className="text-3xl">{cat.icon}</span>
            <div className="text-center">
              <p className={`font-semibold text-sm ${isSelected ? 'text-primary' : 'text-text'}`}>
                {t(cat.tKey)}
              </p>
              {locale !== 'ko' && (
                <p className="text-[10px] text-text-muted opacity-60">{tKo(cat.tKey)}</p>
              )}
              <p className="text-[11px] text-text-muted mt-0.5">{t(cat.tDescKey)}</p>
            </div>
            {shopData?.categoryPricing && (
              <span className="text-[10px] text-text-muted font-medium">{getPriceHint(cat.key)}</span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
