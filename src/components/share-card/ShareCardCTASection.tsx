'use client';

import Link from 'next/link';
import { useT } from '@/lib/i18n';
import type { DesignScope } from '@/types/consultation';
import type { StyleCategory } from '@/types/portfolio';
import { designScopeToCategory as libDesignScopeToCategory } from '@/lib/category-mapping';

// solid_tone → simple 이므로 magnet을 원본 카테고리로 복원할 수 없음.
// designCategory prop이 있으면 우선 사용하여 magnet CTA 링크 정확도 보장.
function resolveCategory(designScope: DesignScope, designCategory?: string | null): StyleCategory {
  if (designCategory) {
    // 알려진 StyleCategory 값만 통과 (unknown custom 카테고리는 scope 폴백)
    const known: StyleCategory[] = ['simple', 'french', 'magnet', 'art'];
    if ((known as string[]).includes(designCategory)) return designCategory as StyleCategory;
  }
  return libDesignScopeToCategory(designScope) as StyleCategory;
}

interface Props {
  shopId: string;
  shareCardId: string;
  designScope: DesignScope;
  /** 원본 디자인 카테고리 — 있으면 scope 역변환보다 우선 사용 (magnet 복원) */
  designCategory?: string | null;
  /** 공유 상담 링크 ID — 있으면 고객이 가능한 시간 중 선택 */
  consultationLinkId?: string;
}

export function ShareCardCTASection({
  shopId,
  shareCardId: _shareCardId,
  designScope,
  designCategory,
  consultationLinkId,
}: Props): React.ReactElement {
  const t = useT();

  const category = resolveCategory(designScope, designCategory);

  // linkId가 있으면 그 링크로, 없으면 기본 사전상담으로
  const consultHref = consultationLinkId
    ? `/pre-consult/${shopId}?linkId=${consultationLinkId}`
    : `/pre-consult/${shopId}?from=share&designCategory=${category}`;

  return (
    <div className="flex flex-col gap-3">
      <Link
        href={consultHref}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white rounded-2xl font-bold text-base active:scale-[0.98] transition-transform"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {consultationLinkId ? t('shareCard.ctaBook') : t('shareCard.ctaConsult')}
      </Link>
      <p className="text-[11px] text-text-muted text-center">
        {consultationLinkId ? t('shareCard.ctaBookHint') : t('shareCard.ctaConsultHint')}
      </p>
    </div>
  );
}
