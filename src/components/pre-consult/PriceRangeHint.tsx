'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useT, useKo, useLocale } from '@/lib/i18n';
import { usePreConsultStore } from '@/store/pre-consult-store';
import { Button } from '@/components/ui/Button';

interface PriceRangeHintProps {
  onNext: () => void;
}

export function PriceRangeHint({ onNext }: PriceRangeHintProps): React.ReactElement | null {
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();
  const category = usePreConsultStore((s) => s.selectedCategory);
  const shopData = usePreConsultStore((s) => s.shopData);

  if (!category || !shopData?.categoryPricing) return null;

  const pricing = shopData.categoryPricing[category];
  const minPrice = pricing.price;
  const maxPrice = Math.round((pricing.price * 1.3) / 1000) * 1000;
  const minTime = pricing.time;
  const maxTime = pricing.time + 30;

  const formatPrice = (n: number): string => n.toLocaleString('ko-KR');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 p-5 rounded-2xl bg-surface-alt border border-border"
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary font-medium">
            {t('preConsult.priceRange')}
          </span>
          <span className="text-lg font-bold text-text">
            {formatPrice(minPrice)} ~ {formatPrice(maxPrice)}{t('preConsult.won')}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary font-medium">
            {t('preConsult.timeRange')}
          </span>
          <span className="text-lg font-bold text-text">
            {minTime} ~ {maxTime}{t('preConsult.min')}
          </span>
        </div>
      </div>

      <p className="text-xs text-text-muted text-center">
        {t('preConsult.guideSuffix')}
        {locale !== 'ko' && (
          <span className="block text-xs opacity-60 mt-0.5">
            {tKo('preConsult.guideSuffix')}
          </span>
        )}
      </p>

      <Button fullWidth onClick={onNext}>
        {t('preConsult.next')}
      </Button>
    </motion.div>
  );
}
