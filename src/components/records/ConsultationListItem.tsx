'use client';

import Image from 'next/image';
import { formatPrice, toKoreanTimeString } from '@/lib/format';
import { DESIGN_SCOPE_LABEL, BODY_PART_LABEL, EXPRESSION_LABEL, getDesignerName } from '@/lib/labels';
import { SafetyTag } from '@/components/ui/SafetyTag';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useCustomerStore } from '@/store/customer-store';
import { getSafetyTagMeta } from '@/lib/tag-safety';
import type { ConsultationRecord } from '@/types/consultation';

interface ConsultationListItemProps {
  record: ConsultationRecord;
  onClick: () => void;
  onPreview?: () => void;
}

export function ConsultationListItem({
  record,
  onClick,
  onPreview,
}: ConsultationListItemProps): React.ReactElement {
  const c = record.consultation;
  const timeStr = toKoreanTimeString(record.createdAt);

  const getByRecordId = usePortfolioStore((s) => s.getByRecordId);
  const getPinnedTags = useCustomerStore((s) => s.getPinnedTags);

  const photos = getByRecordId(record.id);
  const thumbnail = photos[0];

  const pinnedTags = record.customerId ? getPinnedTags(record.customerId) : [];
  const safetyTags = pinnedTags.filter((tag) => {
    const level = getSafetyTagMeta(tag).level;
    return level === 'high' || level === 'medium';
  });

  const isForeign = record.language && record.language !== 'ko';
  const mobileExpressions = c.expressions.slice(0, 2);
  const hiddenExpressionCount = Math.max(c.expressions.length - mobileExpressions.length, 0);

  return (
    <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start sm:gap-3">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {/* R-1: 썸네일 */}
        <div className="mt-0.5 shrink-0">
          {thumbnail ? (
            <div className="h-10 w-10 overflow-hidden rounded-xl border border-border">
              <Image
                src={thumbnail.imageDataUrl}
                alt=""
                width={40}
                height={40}
                className="h-full w-full object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <span className="text-sm font-bold text-primary">
                {(c.customerName ?? '?').slice(0, 1)}
              </span>
            </div>
          )}
        </div>

        {/* 메인 콘텐츠 */}
        <button
          onClick={onClick}
          className="flex min-w-0 flex-1 flex-col gap-1.5 text-left transition-opacity hover:opacity-80 active:opacity-60"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex shrink-0 items-center rounded bg-primary/10 px-1 py-0.5 text-[9px] font-bold text-primary">상담</span>
                <span className="shrink-0 text-xs font-semibold text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>{timeStr}</span>
              </div>
              <div className="mt-1 flex min-w-0 items-center gap-1.5">
                <span className="truncate text-sm font-semibold text-text">{c.customerName}</span>
                {isForeign && (
                  <span className="shrink-0">
                    <FlagIcon language={record.language!} size="sm" showLabel />
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-xs text-text-muted">
                {getDesignerName(record.designerId)}
              </p>
            </div>
            <span className="shrink-0 text-right">
              {!record.finalizedAt && (
                <span className="block text-[10px] font-semibold text-text-muted">결제 전</span>
              )}
              <span
                className={`text-sm font-bold ${record.finalizedAt ? 'text-primary' : 'text-text-muted'}`}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatPrice(record.finalPrice)}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center rounded-md bg-surface-alt px-1.5 py-0.5 text-[10px] font-semibold text-text-secondary">
              {BODY_PART_LABEL[c.bodyPart] ?? c.bodyPart}
            </span>
            <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              {DESIGN_SCOPE_LABEL[c.designScope] ?? c.designScope}
            </span>
            {mobileExpressions.map((exp) => (
              <span key={exp} className="inline-flex items-center rounded-md bg-surface-alt px-1.5 py-0.5 text-[10px] text-text-muted">
                {EXPRESSION_LABEL[exp] ?? exp}
              </span>
            ))}
            {hiddenExpressionCount > 0 && (
              <span className="inline-flex items-center rounded-md bg-surface-alt px-1.5 py-0.5 text-[10px] font-semibold text-text-muted sm:hidden">
                +{hiddenExpressionCount}
              </span>
            )}
            {c.expressions.slice(2).map((exp) => (
              <span key={`desktop-${exp}`} className="hidden items-center rounded-md bg-surface-alt px-1.5 py-0.5 text-[10px] text-text-muted sm:inline-flex">
                {EXPRESSION_LABEL[exp] ?? exp}
              </span>
            ))}
            {c.hasParts && c.partsSelections.length > 0 && (
              <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700">
                파츠 {c.partsSelections.reduce((sum, p) => sum + p.quantity, 0)}개
              </span>
            )}
          </div>

          {/* R-2: 세이프티 배지 */}
          {safetyTags.length > 0 && (
            <div className="mt-0.5 flex flex-wrap gap-1">
              {safetyTags.map((tag) => (
                <SafetyTag key={tag.id} tag={tag} size="xs" />
              ))}
            </div>
          )}
        </button>
      </div>

      {/* R-3: 미리보기 버튼 */}
      {onPreview && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          className="rounded-lg border border-border bg-surface-alt px-2.5 py-2 text-[10px] font-semibold text-text-secondary transition-all hover:bg-border active:scale-95 sm:mt-1 sm:shrink-0"
        >
          <span className="sm:hidden">미리보기</span>
          <span className="hidden sm:inline">기록 미리보기</span>
        </button>
      )}
    </div>
  );
}
