'use client';

import { formatPrice } from '@/lib/format';
import { DESIGN_SCOPE_LABEL, BODY_PART_LABEL, EXPRESSION_LABEL, getDesignerName } from '@/lib/labels';
import type { ConsultationRecord } from '@/types/consultation';

interface ConsultationListItemProps {
  record: ConsultationRecord;
  onClick: () => void;
}

export function ConsultationListItem({
  record,
  onClick,
}: ConsultationListItemProps): React.ReactElement {
  const c = record.consultation;
  const timeStr = record.createdAt.split('T')[1]?.substring(0, 5) ?? '';

  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-1.5 px-4 py-3 text-left hover:bg-surface-alt active:bg-surface-alt transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center rounded px-1 py-0.5 text-[9px] font-bold bg-primary/10 text-primary shrink-0">상담</span>
        <span className="text-xs font-semibold text-primary shrink-0" style={{ fontVariantNumeric: 'tabular-nums' }}>{timeStr}</span>
        <span className="text-sm font-semibold text-text truncate">{c.customerName}</span>
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
    </button>
  );
}
