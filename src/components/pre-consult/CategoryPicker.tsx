'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useT, useLocale } from '@/lib/i18n';
import { usePreConsultStore } from '@/store/pre-consult-store';
import { serviceTypeToCategory } from '@/lib/category-mapping';
import { resolveMenuCategoryLabelBilingual } from '@/lib/labels';
import type { DesignCategory } from '@/types/pre-consultation';

interface CategoryConfig {
  key: DesignCategory;
  icon: string;
  /** builtin → i18n key, custom → 직접 표시 */
  builtin: boolean;
  /** builtin인 경우 i18n key */
  tKey?: string;
  tDescKey?: string;
  /** custom인 경우 표시 라벨/설명 */
  label?: string;
  labelKo?: string;
  desc?: string;
}

const BUILTIN_CATEGORIES: CategoryConfig[] = [
  { key: 'simple', icon: '💅', builtin: true, tKey: 'preConsult.catSimple', tDescKey: 'preConsult.catSimpleDesc' },
  { key: 'french', icon: '🤍', builtin: true, tKey: 'preConsult.catFrench', tDescKey: 'preConsult.catFrenchDesc' },
  { key: 'magnet', icon: '✨', builtin: true, tKey: 'preConsult.catMagnet', tDescKey: 'preConsult.catMagnetDesc' },
  { key: 'art', icon: '🎨', builtin: true, tKey: 'preConsult.catArt', tDescKey: 'preConsult.catArtDesc' },
];

export function CategoryPicker(): React.ReactElement {
  const t = useT();
  const locale = useLocale();
  const selected = usePreConsultStore((s) => s.selectedCategory);
  const setSelected = usePreConsultStore((s) => s.setSelectedCategory);
  const setSelectedPhotoUrl = usePreConsultStore((s) => s.setSelectedPhotoUrl);
  const shopData = usePreConsultStore((s) => s.shopData);
  const portfolioPhotos = usePreConsultStore((s) => s.portfolioPhotos);

  // 사장님이 설정에서 OFF한 카테고리는 카드에서 숨김 (simple은 항상 노출)
  // 추가 카테고리는 항상 노출
  const visibleCategories = useMemo<CategoryConfig[]>(() => {
    const s = shopData?.serviceStructure;
    const builtinFiltered = BUILTIN_CATEGORIES.filter((c) => {
      if (!s) return true;
      if (c.key === 'simple') return true;
      if (c.key === 'french') return s.french !== false;
      if (c.key === 'magnet') return s.magnet !== false;
      if (c.key === 'art') return s.pointFullArt !== false;
      return true;
    });
    const customConfigs: CategoryConfig[] = (shopData?.customCategories ?? [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((c) => ({
        key: c.id,
        icon: '✨',
        builtin: false,
        label:
          locale === 'en' ? (c.nameEn?.trim() || c.name)
          : locale === 'zh' ? (c.nameZh?.trim() || c.name)
          : locale === 'ja' ? (c.nameJa?.trim() || c.name)
          : c.name,
        labelKo: c.name,
        desc: c.description ?? '',
      }));
    return [...builtinFiltered, ...customConfigs];
  }, [shopData?.serviceStructure, shopData?.customCategories, locale]);

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
      return `${menuMin.toLocaleString()}${t('preConsult.won')}~`;
    }
    if (!shopData) return '';
    // builtin: categoryPricing 조회 / custom: customCategories에서 직접
    const builtinPrice = shopData.categoryPricing?.[cat]?.price;
    const customPrice = shopData.customCategories?.find((c) => c.id === cat)?.price;
    const price = customPrice ?? builtinPrice;
    if (price == null) return '';
    return `${price.toLocaleString()}${t('preConsult.won')}~`;
  };

  // builtin 카테고리: locale===ko이면 한국어만, 비ko이면 '한국어(English)' 병기
  const resolveBuiltinLabel = (cat: CategoryConfig): string => {
    if (!cat.builtin || !cat.tKey) return cat.label ?? '';
    if (locale === 'ko') {
      const override = shopData?.categoryLabels?.[cat.key as string];
      return override ?? t(cat.tKey);
    }
    return resolveMenuCategoryLabelBilingual(
      cat.key as string,
      shopData?.categoryLabels ?? undefined,
      shopData?.customCategories ?? undefined,
      locale,
    );
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {visibleCategories.map((cat) => {
        const isSelected = selected === cat.key;
        const thumb = categoryThumbs[cat.key];
        const displayLabel = cat.builtin
          ? resolveBuiltinLabel(cat)
          : locale !== 'ko' && cat.labelKo
          ? resolveMenuCategoryLabelBilingual(cat.key as string, undefined, shopData?.customCategories ?? undefined, locale)
          : (cat.label ?? '');
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
                  alt={displayLabel}
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
                {displayLabel}
              </p>
              {(cat.builtin ? t(cat.tDescKey!) : cat.desc) && (
                <p className="text-xs text-text-muted leading-tight">
                  {cat.builtin ? t(cat.tDescKey!) : cat.desc}
                </p>
              )}
              {!!getPriceHint(cat.key) && (
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
