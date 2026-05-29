import type { BuiltinDesignCategory, DesignCategory } from '@/types/pre-consultation';
import type { DesignScope } from '@/types/consultation';

// builtin 4개만 키로 (custom id는 fallback 처리)
const CATEGORY_TO_SCOPE: Record<BuiltinDesignCategory, DesignScope> = {
  simple: 'solid_tone',
  french: 'solid_point',  // 프렌치는 단색+포인트에 해당
  magnet: 'solid_tone',   // 마그네틱은 기본 + expression으로 처리
  art: 'full_art',
};

const SCOPE_TO_CATEGORY: Record<DesignScope, BuiltinDesignCategory> = {
  solid_tone: 'simple',
  solid_point: 'french',
  full_art: 'art',
  monthly_art: 'art',
};

// magnet → solid_tone 단방향이라 역매핑에서 유실됨.
// styleCategory가 있으면 그걸 우선 사용해야 하므로, scope 역변환보다 category 직접 전달을 권장.
// 이 함수는 scope만 있고 원본 category가 없는 경우의 최선 추정.
// 주의: magnet의 경우 solid_tone → simple로 매핑되어 magnet 복원 불가 — category를 보존해야 함.

const BUILTIN_KEYS = new Set<string>(['simple', 'french', 'magnet', 'art']);

export function designCategoryToScope(category: DesignCategory): DesignScope {
  // custom 카테고리는 'solid_tone'으로 매핑 (포트폴리오/시술 기록에 안전한 기본값)
  if (!BUILTIN_KEYS.has(category)) return 'solid_tone';
  return CATEGORY_TO_SCOPE[category as BuiltinDesignCategory];
}

export function designScopeToCategory(scope: DesignScope): DesignCategory {
  return SCOPE_TO_CATEGORY[scope];
}

/** 포트폴리오 service_type → style_category 매핑 */
const SERVICE_TYPE_TO_CATEGORY: Record<string, DesignCategory> = {
  // 한국어 레이블
  '원컬러': 'simple',
  '그라데이션': 'simple',
  '마그네틱': 'magnet',
  '자석젤': 'magnet',
  '캣아이': 'magnet',
  '프렌치': 'french',
  '아트': 'art',
  '풀아트': 'art',
  '포인트아트': 'art',
  // 카테고리 값 자체 (service_type에 잘못 저장된 경우 안전장치)
  'simple': 'simple',
  'french': 'french',
  'magnet': 'magnet',
  'art': 'art',
};

export function serviceTypeToCategory(serviceType: string | null | undefined): DesignCategory | null {
  if (!serviceType) return null;
  // 사장님 추가 카테고리 id ('custom-xxx')는 그대로 통과
  if (serviceType.startsWith('custom-')) return serviceType;
  return SERVICE_TYPE_TO_CATEGORY[serviceType] ?? null;
}
