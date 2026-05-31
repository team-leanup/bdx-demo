import { useShopStore } from '@/store/shop-store';

export const BODY_PART_LABEL: Record<string, string> = {
  hand: '핸드',
  foot: '페디큐어',
};

export const DESIGN_SCOPE_LABEL: Record<string, string> = {
  solid_tone: '원컬러',
  solid_point: '단색+포인트',
  full_art: '풀아트',
  monthly_art: '이달의 아트',
};

export const EXPRESSION_LABEL: Record<string, string> = {
  solid: '기본',
  gradient: '그라데이션',
  french: '프렌치',
  magnetic: '마그네틱/캣아이',
};

export const CATEGORY_LABELS: Record<string, string> = {
  simple: '심플 / 원컬러',
  french: '프렌치',
  magnet: '자석 / 마그넷',
  art: '아트',
};

export const CATEGORY_LABELS_EN: Record<string, string> = {
  simple: 'Simple',
  french: 'French',
  magnet: 'Magnet',
  art: 'Art',
};

/**
 * 원장측 카테고리 라벨 단일 해석 헬퍼.
 * overrides(shop.settings.categoryLabels)가 있으면 우선, 없으면 CATEGORY_LABELS 기본값, 그것도 없으면 key 그대로.
 */
export function resolveMenuCategoryLabel(key: string, overrides?: Record<string, string>): string {
  return overrides?.[key] ?? CATEGORY_LABELS[key] ?? key;
}

/**
 * 손님 화면(사전상담)용 병기 라벨 헬퍼.
 * - builtin(simple/french/magnet/art): `${한국어}(${영어})` 형태
 *   - 한국어: overrides 우선 → CATEGORY_LABELS 기본값
 *   - 영어: CATEGORY_LABELS_EN 고정
 * - custom-*: customCategories에서 name + (nameEn 있으면 `(${nameEn})`).
 *   못 찾으면 key 그대로.
 */
export function resolveMenuCategoryLabelBilingual(
  key: string,
  overrides?: Record<string, string>,
  customCategories?: Array<{ id: string; name: string; nameEn?: string }>,
): string {
  if (key in CATEGORY_LABELS) {
    const ko = overrides?.[key] ?? CATEGORY_LABELS[key];
    const en = CATEGORY_LABELS_EN[key];
    return `${ko}(${en})`;
  }
  const custom = customCategories?.find((c) => c.id === key);
  if (custom) {
    return custom.nameEn?.trim() ? `${custom.name}(${custom.nameEn.trim()})` : custom.name;
  }
  return key;
}

export const OFF_TYPE_LABEL: Record<string, string> = {
  none: '없음',
  same_shop: '자샵오프',
  other_shop: '타샵오프',
};

export function getDesignerName(designerId: string): string {
  return useShopStore.getState().getDesignerName(designerId);
}
