import type { DesignCategory } from '@/types/pre-consultation';

const VALID: ReadonlyArray<DesignCategory> = ['simple', 'french', 'magnet', 'art'];

/**
 * JSONB 등 알 수 없는 소스에서 온 값을 DesignCategory로 안전하게 변환한다.
 * 유효하지 않으면 `null` 반환 — 호출자는 `CATEGORY_LABELS[value]`가 undefined 되는
 * 런타임 버그를 피할 수 있다.
 */
export function asDesignCategory(value: unknown): DesignCategory | null {
  if (typeof value !== 'string') return null;
  return (VALID as ReadonlyArray<string>).includes(value) ? (value as DesignCategory) : null;
}
