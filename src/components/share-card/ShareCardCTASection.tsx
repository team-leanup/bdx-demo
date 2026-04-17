'use client';

import Link from 'next/link';
import { useT } from '@/lib/i18n';
import type { DesignScope } from '@/types/consultation';
import type { StyleCategory } from '@/types/portfolio';

function designScopeToCategory(scope: DesignScope): StyleCategory {
  switch (scope) {
    case 'solid_tone': return 'simple';
    case 'solid_point': return 'french';
    case 'full_art': return 'art';
    case 'monthly_art': return 'art';
  }
}

interface Props {
  shopId: string;
  shareCardId: string;
  designScope: DesignScope;
  /** 공유 상담 링크 ID — 있으면 고객이 가능한 시간 중 선택 */
  consultationLinkId?: string;
}

export function ShareCardCTASection({
  shopId,
  shareCardId: _shareCardId,
  designScope,
  consultationLinkId,
}: Props): React.ReactElement {
  const t = useT();

  // linkId가 있으면 그 링크로, 없으면 기본 사전상담으로
  const consultHref = consultationLinkId
    ? `/pre-consult/${shopId}?linkId=${consultationLinkId}`
    : `/pre-consult/${shopId}?from=share&designCategory=${designScopeToCategory(designScope)}`;

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
