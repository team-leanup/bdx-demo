import type { DesignCategory } from '@/types/pre-consultation';
import type { DesignScope } from '@/types/consultation';

const CATEGORY_TO_SCOPE: Record<DesignCategory, DesignScope> = {
  simple: 'solid_tone',
  french: 'solid_point',  // 프렌치는 단색+포인트에 해당
  magnet: 'solid_tone',   // 마그네틱은 기본 + expression으로 처리
  art: 'full_art',
};

const SCOPE_TO_CATEGORY: Record<DesignScope, DesignCategory> = {
  solid_tone: 'simple',
  solid_point: 'french',
  full_art: 'art',
  monthly_art: 'art',
};

export function designCategoryToScope(category: DesignCategory): DesignScope {
  return CATEGORY_TO_SCOPE[category];
}

export function designScopeToCategory(scope: DesignScope): DesignCategory {
  return SCOPE_TO_CATEGORY[scope];
}

/** 포트폴리오 service_type → style_category 매핑 */
const SERVICE_TYPE_TO_CATEGORY: Record<string, DesignCategory> = {
  '원컬러': 'simple',
  '그라데이션': 'simple',
  '마그네틱': 'magnet',
  '자석젤': 'magnet',
  '캣아이': 'magnet',
  '프렌치': 'french',
  '아트': 'art',
  '풀아트': 'art',
  '포인트아트': 'art',
};

export function serviceTypeToCategory(serviceType: string | null | undefined): DesignCategory | null {
  if (!serviceType) return null;
  return SERVICE_TYPE_TO_CATEGORY[serviceType] ?? null;
}
