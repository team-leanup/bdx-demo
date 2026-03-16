'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui';
import { formatPrice, formatRelativeDate } from '@/lib/format';
import { BODY_PART_LABEL, DESIGN_SCOPE_LABEL } from '@/lib/labels';
import type { ConsultationRecord } from '@/types/consultation';

interface RecentConsultationCardProps {
  records: ConsultationRecord[];
  onViewAll: () => void;
  onRecordClick: (recordId: string) => void;
  sectionTitle: string;
  viewAllLabel: string;
  itemVariants: {
    hidden: { opacity: number; y: number };
    visible: { opacity: number; y: number; transition: { duration: number; ease: number[] } };
  };
}

export function RecentConsultationCard({
  records,
  onViewAll,
  onRecordClick,
  sectionTitle,
  viewAllLabel,
  itemVariants,
}: RecentConsultationCardProps): React.ReactElement {
  return (
    <motion.div data-tour-id="tour-recent" variants={itemVariants} className="rounded-2xl bg-surface border border-border overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-text">{sectionTitle}</span>
        </div>
        <button
          onClick={onViewAll}
          className="min-h-[44px] px-2 text-xs font-semibold text-primary active:opacity-60"
        >
          {viewAllLabel}
        </button>
      </div>

      <div className="flex flex-col">
        {records.map((record, idx) => (
          <motion.div
            key={record.id}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRecordClick(record.id); } }}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + idx * 0.06, duration: 0.3 }}
            onClick={() => onRecordClick(record.id)}
            className="flex items-center gap-3 px-4 py-3 border-t border-border cursor-pointer hover:bg-surface-alt active:bg-surface-alt transition-colors"
          >
            {/* 이니셜 아바타 */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <span className="text-sm font-bold text-primary">
                {(record.consultation.customerName ?? '?').slice(0, 1)}
              </span>
            </div>
            {/* 이름 + 배지 */}
            <div className="flex flex-1 flex-col gap-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="truncate text-sm font-semibold text-text">
                  {record.consultation.customerName ?? ''}
                </span>
                <Badge variant="neutral" size="sm">
                  {BODY_PART_LABEL[record.consultation.bodyPart] ?? record.consultation.bodyPart}
                </Badge>
                <Badge variant="primary" size="sm">
                  {DESIGN_SCOPE_LABEL[record.consultation.designScope] ?? record.consultation.designScope}
                </Badge>
              </div>
              <span className="text-xs text-text-muted">
                {formatRelativeDate(record.createdAt)}
              </span>
            </div>
            {/* 금액 */}
            <div className="shrink-0 text-right">
              {record.finalizedAt ? (
                <span
                  className="text-sm font-bold text-primary"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {formatPrice(record.finalPrice)}
                </span>
              ) : (
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[10px] font-semibold text-text-muted">미확정</span>
                  <span
                    className="text-sm font-bold text-text-muted"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {formatPrice(record.finalPrice)}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
