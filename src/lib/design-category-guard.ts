import type { DesignCategory } from '@/types/pre-consultation';
import { BUILTIN_DESIGN_CATEGORIES } from '@/types/pre-consultation';
import type { ShopExtendedSettings } from '@/types/shop';

/**
 * JSONB 등 알 수 없는 소스에서 온 값을 DesignCategory로 안전하게 변환한다.
 * 유효하지 않으면 `null` 반환 — 호출자는 라벨 lookup이 undefined 되는 런타임 버그를 피할 수 있다.
 *
 * 0528 — 사장님 customCategories도 허용해야 하므로 shopSettings를 옵션으로 받는다.
 * 미전달 시 builtin 4개만 허용 (하위호환).
 */
export function asDesignCategory(
  value: unknown,
  shopSettings?: ShopExtendedSettings | null,
): DesignCategory | null {
  if (typeof value !== 'string') return null;
  if ((BUILTIN_DESIGN_CATEGORIES as ReadonlyArray<string>).includes(value)) {
    return value as DesignCategory;
  }
  if (shopSettings?.customCategories?.some((c) => c.id === value)) {
    return value;
  }
  return null;
}
