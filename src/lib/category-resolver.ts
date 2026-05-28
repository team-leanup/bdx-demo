/**
 * 0528 — 시술 종류 (DesignCategory) 라벨/메타 동적 조회 헬퍼
 *
 * 기본 4개(builtin) + 사장님이 추가한 customCategories를 통합 조회.
 * - builtin은 i18n 키로 다국어 처리
 * - custom은 한국어(필수) + 다른 언어 필드(선택, 미입력 시 한국어 fallback)
 */

import type { Locale } from '@/lib/i18n';
import type { CategoryPricingItem, CustomCategory, ShopExtendedSettings } from '@/types/shop';
import type {
  BuiltinDesignCategory,
  DesignCategory,
} from '@/types/pre-consultation';
import { BUILTIN_DESIGN_CATEGORIES } from '@/types/pre-consultation';

const BUILTIN_KO: Record<BuiltinDesignCategory, string> = {
  simple: '심플',
  french: '프렌치',
  magnet: '자석',
  art: '아트',
};

const BUILTIN_DESC_KO: Record<BuiltinDesignCategory, string> = {
  simple: '깔끔한 원컬러·그라데이션',
  french: '클래식한 프렌치 라인',
  magnet: '영롱한 캣아이·자석젤',
  art: '개성 넘치는 아트 디자인',
};

/** 카테고리 id가 builtin인지 */
export function isBuiltinCategory(category: string): category is BuiltinDesignCategory {
  return (BUILTIN_DESIGN_CATEGORIES as string[]).includes(category);
}

/**
 * 카테고리 라벨을 현재 locale로 조회.
 * - builtin: i18n preConsult.cat* 키 (호출자가 t로 처리 권장)
 * - custom: customCategories에서 직접 조회, locale별 nameXx 우선, 없으면 한국어 fallback
 *
 * UI 컴포넌트는 보통 `useT()` 로 builtin 라벨을 가져오므로,
 * 이 헬퍼는 주로 custom 카테고리 라벨/한국어 fallback 또는 비-i18n 컨텍스트(통계/필드모드 한국어 전용)에서 사용.
 */
export function resolveCategoryLabel(
  category: DesignCategory,
  locale: Locale,
  shopSettings?: ShopExtendedSettings | null,
): string {
  if (isBuiltinCategory(category)) {
    return BUILTIN_KO[category]; // 한국어 fallback (i18n은 호출자에서 t 사용)
  }
  const custom = shopSettings?.customCategories?.find((c) => c.id === category);
  if (!custom) return category; // 알 수 없는 id → 원본 그대로
  switch (locale) {
    case 'en': return custom.nameEn?.trim() || custom.name;
    case 'zh': return custom.nameZh?.trim() || custom.name;
    case 'ja': return custom.nameJa?.trim() || custom.name;
    default: return custom.name;
  }
}

/** 한국어 라벨만 — (main) 페이지·통계에서 사용 */
export function resolveCategoryLabelKo(
  category: DesignCategory,
  shopSettings?: ShopExtendedSettings | null,
): string {
  if (isBuiltinCategory(category)) return BUILTIN_KO[category];
  const custom = shopSettings?.customCategories?.find((c) => c.id === category);
  return custom?.name ?? category;
}

/** 카테고리 설명 (builtin: 고정 한국어, custom: description 필드) */
export function resolveCategoryDescriptionKo(
  category: DesignCategory,
  shopSettings?: ShopExtendedSettings | null,
): string {
  if (isBuiltinCategory(category)) return BUILTIN_DESC_KO[category];
  const custom = shopSettings?.customCategories?.find((c) => c.id === category);
  return custom?.description ?? '';
}

/**
 * 샵에서 활성화된 시술 종류 id 리스트 (builtin 4 + custom N).
 * UI 그리드/탭/드롭다운/유효성 검증에 사용.
 */
export function getAllCategoryIds(shopSettings?: ShopExtendedSettings | null): DesignCategory[] {
  const customs = (shopSettings?.customCategories ?? [])
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((c) => c.id);
  return [...BUILTIN_DESIGN_CATEGORIES, ...customs];
}

/** custom 카테고리만 (정렬됨) */
export function getCustomCategories(
  shopSettings?: ShopExtendedSettings | null,
): CustomCategory[] {
  return (shopSettings?.customCategories ?? []).slice().sort((a, b) => a.order - b.order);
}

/** 카테고리 가격 조회 (builtin은 categoryPricing, custom은 customCategories의 price) */
export function resolveCategoryPricing(
  category: DesignCategory,
  shopSettings?: ShopExtendedSettings | null,
): CategoryPricingItem | null {
  if (!shopSettings) return null;
  if (isBuiltinCategory(category)) {
    return shopSettings.categoryPricing?.[category] ?? null;
  }
  const custom = shopSettings.customCategories?.find((c) => c.id === category);
  if (!custom) return null;
  return { price: custom.price, time: custom.time };
}
