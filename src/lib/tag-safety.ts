import type { CustomerTag } from '@/types/customer';

export type SafetyLevel = 'high' | 'medium' | 'reference' | 'preferred';

export interface SafetyTagMeta {
  level: SafetyLevel;
  icon: string;
  iconEmoji: string;
  label: string;
  description: string;
  className: string;
}

const SAFETY_LEVEL_META: Record<SafetyLevel, Omit<SafetyTagMeta, 'description'>> = {
  high: {
    level: 'high',
    icon: '🔴',
    iconEmoji: '🚨',
    label: '높음',
    className: 'border-red-200 bg-red-50 text-red-700',
  },
  medium: {
    level: 'medium',
    icon: '🟠',
    iconEmoji: '⚠️',
    label: '중간',
    className: 'border-orange-200 bg-orange-50 text-orange-700',
  },
  reference: {
    level: 'reference',
    icon: '🟡',
    iconEmoji: '📌',
    label: '참고',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  preferred: {
    level: 'preferred',
    icon: '🟢',
    iconEmoji: '✨',
    label: '선호',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
};

const SAFETY_RULES: Record<string, { level: SafetyLevel; description: string; iconEmoji: string }> = {
  큐티클민감: { level: 'high', description: '푸시백과 케어 강도를 낮춰서 진행해 주세요.', iconEmoji: '⚡' },
  알러지주의: { level: 'high', description: '사용 제품과 이전 반응 여부를 먼저 확인해 주세요.', iconEmoji: '⚠️' },
  손톱얇음: { level: 'medium', description: '베이스 보강 또는 오버레이를 우선 제안해 주세요.', iconEmoji: '🪶' },
  손톱약함: { level: 'medium', description: '두께감과 유지력을 고려해 보강 위주로 진행해 주세요.', iconEmoji: '💔' },
  손톱잘부러짐: { level: 'medium', description: '길이와 파츠 무게를 줄이고 보강 코트를 권장해 주세요.', iconEmoji: '🔨' },
  리페어자주함: { level: 'medium', description: '손상 부위와 들뜸 이력을 먼저 체크해 주세요.', iconEmoji: '🔧' },
  연장이력있음: { level: 'reference', description: '현재 손톱 컨디션과 제거 이력을 함께 확인해 주세요.', iconEmoji: '📋' },
  오른손잡이: { level: 'reference', description: '우세손 마모가 빠른지 확인해 주세요.', iconEmoji: '✋' },
  왼손잡이: { level: 'reference', description: '우세손 마모가 빠른지 확인해 주세요.', iconEmoji: '🤚' },
  젤알러지없음: { level: 'preferred', description: '기존 젤 시술 특이사항이 없는 고객입니다.', iconEmoji: '✅' },
};

function inferSafetyRule(tag: Pick<CustomerTag, 'value' | 'category'>): { level: SafetyLevel; description: string; iconEmoji: string } {
  const rule = SAFETY_RULES[tag.value];
  if (rule) return rule;

  if (tag.value.includes('민감') || tag.value.includes('알러지')) {
    return { level: 'high', description: '자극 가능성이 있어 시술 강도와 제품을 먼저 확인해 주세요.', iconEmoji: SAFETY_LEVEL_META.high.iconEmoji };
  }

  if (
    tag.value.includes('얇')
    || tag.value.includes('약함')
    || tag.value.includes('부러')
    || tag.value.includes('리페어')
  ) {
    return { level: 'medium', description: '손상과 유지력을 고려해 보강 중심으로 상담해 주세요.', iconEmoji: SAFETY_LEVEL_META.medium.iconEmoji };
  }

  if (tag.value.includes('선호') || tag.value.includes('좋아함') || tag.value.includes('없음')) {
    return { level: 'preferred', description: '고객 선호에 맞춰 우선 제안하면 만족도가 높습니다.', iconEmoji: SAFETY_LEVEL_META.preferred.iconEmoji };
  }

  if (tag.category !== 'etc') {
    return { level: 'preferred', description: '평소 선호 데이터로 상담 제안의 우선순위를 맞춰 주세요.', iconEmoji: SAFETY_LEVEL_META.preferred.iconEmoji };
  }

  return { level: 'reference', description: '시술 전 한 번 더 확인하면 도움이 되는 참고 정보입니다.', iconEmoji: SAFETY_LEVEL_META.reference.iconEmoji };
}

export function getSafetyTagMeta(tag: Pick<CustomerTag, 'value' | 'category'>): SafetyTagMeta {
  const rule = inferSafetyRule(tag);
  const levelMeta = SAFETY_LEVEL_META[rule.level];

  return {
    ...levelMeta,
    iconEmoji: rule.iconEmoji,
    description: rule.description,
  };
}

export function sortSafetyTags(tags: CustomerTag[]): CustomerTag[] {
  const priority: Record<SafetyLevel, number> = {
    high: 0,
    medium: 1,
    reference: 2,
    preferred: 3,
  };

  return [...tags].sort((a, b) => {
    const aMeta = getSafetyTagMeta(a);
    const bMeta = getSafetyTagMeta(b);
    return priority[aMeta.level] - priority[bMeta.level];
  });
}
