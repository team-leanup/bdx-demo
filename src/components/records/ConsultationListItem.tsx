'use client';

import Image from 'next/image';
import { formatPrice } from '@/lib/format';
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
  const timeStr = record.createdAt.split('T')[1]?.substring(0, 5) ?? '';

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

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      {/* R-1: 썸네일 */}
      <div className="shrink-0 mt-0.5">
        {thumbnail ? (
          <div className="h-10 w-10 rounded-xl overflow-hidden border border-border">
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
        className="flex flex-1 flex-col gap-1 text-left hover:opacity-80 active:opacity-60 transition-opacity min-w-0"
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded px-1 py-0.5 text-[9px] font-bold bg-primary/10 text-primary shrink-0">상담</span>
          <span className="text-xs font-semibold text-primary shrink-0" style={{ fontVariantNumeric: 'tabular-nums' }}>{timeStr}</span>
          <span className="text-sm font-semibold text-text truncate">{c.customerName}</span>
          {/* R-4: 국기 아이콘 */}
          {isForeign && (
            <FlagIcon language={record.language!} size="sm" />
          )}
          <span className="text-xs text-text-muted shrink-0">· {getDesignerName(record.designerId)}</span>
          <span className="ml-auto shrink-0 text-right">
            {!record.finalizedAt && (
              <span className="block text-[10px] font-semibold text-text-muted">미확정</span>
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
          {c.expressions.map((exp) => (
            <span key={exp} className="inline-flex items-center rounded-md bg-surface-alt px-1.5 py-0.5 text-[10px] text-text-muted">
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
          <div className="flex flex-wrap gap-1 mt-0.5">
            {safetyTags.map((tag) => (
              <SafetyTag key={tag.id} tag={tag} size="xs" />
            ))}
          </div>
        )}
      </button>

      {/* R-3: 미리보기 버튼 */}
      {onPreview && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          className="shrink-0 mt-1 rounded-lg border border-border bg-surface-alt px-2.5 py-1.5 text-[10px] font-semibold text-text-secondary hover:bg-border active:scale-95 transition-all"
        >
          미리보기
        </button>
      )}
    </div>
  );
}
