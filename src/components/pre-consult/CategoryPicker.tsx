'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useT, useKo, useLocale } from '@/lib/i18n';
import { usePreConsultStore } from '@/store/pre-consult-store';
import { serviceTypeToCategory } from '@/lib/category-mapping';
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
  const portfolioPhotos = usePreConsultStore((s) => s.portfolioPhotos);

  // Minimum price per category from menu (isFeatured) photos
  const menuMinPrices = useMemo(() => {
    const result: Partial<Record<DesignCategory, number>> = {};
    for (const p of portfolioPhotos) {
      if (!p.isFeatured || p.price == null) continue;
      const cat: DesignCategory | null =
        p.styleCategory ?? serviceTypeToCategory(p.serviceType);
      if (!cat) continue;
      if (result[cat] == null || p.price < result[cat]!) {
        result[cat] = p.price;
      }
    }
    return result;
  }, [portfolioPhotos]);

  // Representative thumbnail per category (첫 번째 featured 사진)
  const categoryThumbs = useMemo(() => {
    const result: Partial<Record<DesignCategory, string>> = {};
    for (const p of portfolioPhotos) {
      if (!p.isFeatured || !p.imageDataUrl) continue;
      const cat: DesignCategory | null =
        p.styleCategory ?? serviceTypeToCategory(p.serviceType);
      if (!cat) continue;
      if (!result[cat]) {
        result[cat] = p.imageDataUrl;
      }
    }
    return result;
  }, [portfolioPhotos]);

  const getPriceHint = (cat: DesignCategory): string => {
    const menuMin = menuMinPrices[cat];
    if (menuMin != null) {
      return `${menuMin.toLocaleString()}원~`;
    }
    if (!shopData?.categoryPricing) return '';
    const price = shopData.categoryPricing[cat]?.price;
    if (!price) return '';
    return `${(price / 1000).toFixed(0)},000${t('preConsult.won')}~`;
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {CATEGORIES.map((cat) => {
        const isSelected = selected === cat.key;
        const thumb = categoryThumbs[cat.key];
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
              'flex flex-col items-stretch overflow-hidden rounded-2xl border-2 transition-all duration-200',
              isSelected
                ? 'border-primary bg-primary/10'
                : 'border-border bg-surface hover:border-primary/40',
            ].join(' ')}
          >
            {/* 썸네일 (있으면) / 이모지 폴백 */}
            <div className="relative aspect-[4/3] w-full bg-surface-alt flex items-center justify-center overflow-hidden">
              {thumb ? (
                <Image
                  src={thumb}
                  alt={t(cat.tKey)}
                  fill
                  unoptimized
                  sizes="(max-width: 420px) 48vw, 200px"
                  className="object-cover"
                />
              ) : (
                <span className="text-4xl" aria-hidden>{cat.icon}</span>
              )}
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
            {/* 텍스트/가격 영역 */}
            <div className="flex flex-col items-center gap-0.5 px-3 py-3 text-center">
              <p className={`font-semibold text-sm ${isSelected ? 'text-primary' : 'text-text'}`}>
                {t(cat.tKey)}
              </p>
              {locale !== 'ko' && (
                <p className="text-xs text-text-muted opacity-60">{tKo(cat.tKey)}</p>
              )}
              <p className="text-xs text-text-muted leading-tight">{t(cat.tDescKey)}</p>
              {(menuMinPrices[cat.key] != null || shopData?.categoryPricing) && (
                <span className="mt-1 text-xs font-semibold text-primary tabular-nums">
                  {getPriceHint(cat.key)}
                </span>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
