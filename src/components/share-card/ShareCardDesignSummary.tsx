'use client';

import Image from 'next/image';
import { useT } from '@/lib/i18n';
import { DESIGN_SCOPE_LABEL, EXPRESSION_LABEL, BODY_PART_LABEL } from '@/lib/labels';
import type { ShareCardDesignInfo } from '@/types/share-card';
import { cn } from '@/lib/cn';

interface Props {
  design: ShareCardDesignInfo;
  shopName: string;
  shopLogoUrl?: string;
}

export function ShareCardDesignSummary({ design, shopName, shopLogoUrl }: Props): React.ReactElement {
  const t = useT();

  return (
    <div className="flex flex-col gap-4">
      {/* Shop info row */}
      <div className="flex items-center gap-3">
        {shopLogoUrl ? (
          <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-surface">
            <Image
              src={shopLogoUrl}
              alt={`${shopName} 로고`}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-primary font-bold text-sm">
              {shopName.charAt(0)}
            </span>
          </div>
        )}
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-base font-bold text-text truncate">{shopName}</span>
          <span className="text-xs text-text-muted">
            {t('shareCard.shopBadge')}
          </span>
        </div>
      </div>

      {/* Design info section */}
      <div className="bg-surface rounded-2xl p-4 flex flex-col gap-3">
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">
          {t('shareCard.designSummary')}
        </span>

        <div className="flex flex-wrap gap-2">
          {/* Body part badge */}
          <span className={cn(
            'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium',
            design.bodyPart === 'hand'
              ? 'bg-rose-50 text-rose-600'
              : 'bg-blue-50 text-blue-600'
          )}>
            {design.bodyPart === 'hand' ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.05 4.575a1.575 1.575 0 10-3.15 0v3m3.15-3v-1.5a1.575 1.575 0 013.15 0v1.5m-3.15 0l.075 5.925m3.075.75V4.575m0 0a1.575 1.575 0 013.15 0V15M6.9 7.575a1.575 1.575 0 10-3.15 0v8.175a6.75 6.75 0 006.75 6.75h2.018a5.25 5.25 0 003.712-1.538l1.732-1.732a5.25 5.25 0 001.538-3.712l.003-2.024a.668.668 0 01.198-.471 1.575 1.575 0 10-2.228-2.228 3.818 3.818 0 00-1.12 2.687M6.9 7.575V12m6.27 4.318A4.49 4.49 0 0116.35 15m.002 0h-.002" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
              </svg>
            )}
            {BODY_PART_LABEL[design.bodyPart] ?? design.bodyPart}
          </span>

          {/* Design scope badge */}
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-primary/10 text-primary">
            {DESIGN_SCOPE_LABEL[design.designScope] ?? design.designScope}
          </span>

          {/* Expression type tags */}
          {design.expressions.map((expr) => (
            <span
              key={expr}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-surface border border-border text-text-secondary"
            >
              {EXPRESSION_LABEL[expr] ?? expr}
            </span>
          ))}

          {/* Parts tag */}
          {design.hasParts && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-amber-50 text-amber-600">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              {/* TODO: i18n — add shareCard.parts key across all 4 locales */}
              파츠
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
