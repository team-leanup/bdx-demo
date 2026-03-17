'use client';

import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { SafetyTag } from '@/components/ui/SafetyTag';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useCustomerStore } from '@/store/customer-store';
import { getSafetyTagMeta } from '@/lib/tag-safety';
import { formatPrice, formatRelativeDate } from '@/lib/format';
import { BODY_PART_LABEL, DESIGN_SCOPE_LABEL } from '@/lib/labels';
import type { ConsultationRecord } from '@/types/consultation';

interface ConsultationPreviewModalProps {
  record: ConsultationRecord | null;
  onClose: () => void;
  onViewDetail: () => void;
}

export function ConsultationPreviewModal({
  record,
  onClose,
  onViewDetail,
}: ConsultationPreviewModalProps): React.ReactElement {
  const getByRecordId = usePortfolioStore((s) => s.getByRecordId);
  const getPinnedTags = useCustomerStore((s) => s.getPinnedTags);

  const photos = record ? getByRecordId(record.id) : [];
  const refImages = record?.consultation.referenceImages ?? [];
  const pinnedTags = record?.customerId ? getPinnedTags(record.customerId) : [];
  const safetyTags = pinnedTags.filter((tag) => {
    const level = getSafetyTagMeta(tag).level;
    return level === 'high' || level === 'medium';
  });

  return (
    <AnimatePresence>
      {record && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[88dvh] flex-col overflow-hidden rounded-t-2xl bg-background pt-5 pb-safe md:bottom-auto md:top-1/2 md:left-1/2 md:right-auto md:w-full md:max-h-[85vh] md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl"
          >
            {/* 헤더 */}
            <div className="mb-4 flex flex-shrink-0 items-start justify-between gap-2 px-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-text">{record.consultation.customerName ?? '고객'}</h3>
                  {record.language && record.language !== 'ko' && (
                    <FlagIcon language={record.language} size="sm" showLabel />
                  )}
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  {formatRelativeDate(record.createdAt)} · {BODY_PART_LABEL[record.consultation.bodyPart]} · {DESIGN_SCOPE_LABEL[record.consultation.designScope]}
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-alt text-text-muted"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-5 pb-8">
              {/* 세이프티 태그 */}
              {safetyTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {safetyTags.map((tag) => (
                    <SafetyTag key={tag.id} tag={tag} size="sm" />
                  ))}
                </div>
              )}

              {/* 참고 이미지 (사전상담) */}
              {refImages.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-text-secondary mb-2">요청 참고 이미지</p>
                  <div className="flex gap-2 flex-wrap">
                    {refImages.map((url, i) => (
                      <div key={i} className="h-20 w-20 rounded-xl overflow-hidden border border-border flex-shrink-0">
                        <Image src={url} alt="" width={80} height={80} className="h-full w-full object-cover" unoptimized />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 포트폴리오 사진 */}
              {photos.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-text-secondary mb-2">시술 사진</p>
                  <div className="flex gap-2 flex-wrap">
                    {photos.slice(0, 6).map((photo) => (
                      <div key={photo.id} className="h-20 w-20 rounded-xl overflow-hidden border border-border flex-shrink-0">
                        <Image src={photo.imageDataUrl} alt="" width={80} height={80} className="h-full w-full object-cover" unoptimized />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 요청 메모 */}
              {record.notes && (
                <div>
                  <p className="text-xs font-semibold text-text-secondary mb-1">메모</p>
                  <div className="rounded-xl bg-surface-alt p-3">
                    <p className="text-xs text-text-secondary whitespace-pre-line">{record.notes}</p>
                  </div>
                </div>
              )}

              {/* 가격 */}
              <div className="flex items-center justify-between rounded-xl bg-surface-alt px-4 py-3">
                <span className="text-sm text-text-secondary">최종 금액</span>
                <span className="text-base font-bold text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatPrice(record.finalPrice)}
                </span>
              </div>

              {/* 상세 보기 버튼 */}
              <button
                onClick={() => { onClose(); onViewDetail(); }}
                className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white active:scale-[0.98] transition-transform"
              >
                기록 상세보기
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
