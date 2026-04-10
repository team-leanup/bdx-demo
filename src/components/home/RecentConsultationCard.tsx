'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div data-tour-id="tour-recent" variants={itemVariants} className="rounded-2xl bg-surface border border-border overflow-hidden">
      {/* 헤더 — 클릭으로 아코디언 토글 */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 pt-4 pb-3 active:bg-surface-alt transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text">{sectionTitle}</span>
          {records.length > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-primary/10 px-1.5 text-[10px] font-medium text-primary">
              {records.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            onClick={(e) => { e.stopPropagation(); onViewAll(); }}
            className="text-xs font-semibold text-primary active:opacity-60"
          >
            {viewAllLabel}
          </span>
          <svg
            className={`w-4 h-4 text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col">
              {records.map((record, idx) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.2 }}
                  onClick={() => onRecordClick(record.id)}
                  className="flex items-center gap-3 px-4 py-3 border-t border-border cursor-pointer hover:bg-surface-alt active:bg-surface-alt transition-colors"
                >
                  {/* 이니셜 아바타 */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <span className="text-sm font-semibold text-primary">
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
                        className="text-sm font-semibold text-primary"
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        {formatPrice(record.finalPrice)}
                      </span>
                    ) : (
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-[10px] font-semibold text-text-muted">미확정</span>
                        <span
                          className="text-sm font-semibold text-text-muted"
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
        )}
      </AnimatePresence>
    </motion.div>
  );
}
