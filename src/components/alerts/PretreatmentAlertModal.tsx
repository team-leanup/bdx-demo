'use client';

import { cn } from '@/lib/cn';
import { getSafetyTagMeta, sortSafetyTags } from '@/lib/tag-safety';
import { Modal } from '@/components/ui/Modal';
import type { CustomerTag } from '@/types/customer';

interface PretreatmentAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onQuickSale?: () => void;
  customerName: string;
  pinnedTags: CustomerTag[];
  /** 기본값: "시술 전 확인사항" */
  title?: string;
  /** 기본값: 시술 시작 문구. 리마인드 모드에서는 다른 문구로 교체 가능 */
  description?: string;
  /** 기본값: "확인하고 시작". 리마인드 모드에서는 "확인했어요" 등으로 교체 가능 */
  confirmLabel?: string;
  /** 기본값: "취소". 리마인드 모드에서는 "나중에" 등으로 교체 가능 */
  cancelLabel?: string;
}

export function PretreatmentAlertModal({
  isOpen,
  onClose,
  onConfirm,
  onQuickSale,
  customerName,
  pinnedTags,
  title = '시술 전 확인사항',
  description = '고객 특이사항을 먼저 확인하고 시술에 들어가면 실수를 줄일 수 있어요.',
  confirmLabel = '확인하고 시작',
  cancelLabel = '취소',
}: PretreatmentAlertModalProps): React.ReactElement {
  const displayTags = sortSafetyTags(pinnedTags).slice(0, 5);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="px-5 py-4 flex flex-col gap-5">
        <div className="text-center">
          <p className="text-xs text-text-muted mb-1">고객</p>
          <p className="text-lg font-bold text-text">{customerName}</p>
        </div>

        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-full bg-warning/10 flex items-center justify-center">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              className="text-warning"
            >
              <path
                d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <p className="text-sm text-text-secondary text-center leading-relaxed">
          {description}
        </p>

        <div className="flex flex-col gap-2">
          {displayTags.map((tag) => {
            const safety = getSafetyTagMeta(tag);

            return (
              <div
                key={tag.id}
                className={cn('rounded-2xl border px-4 py-3', safety.className)}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg leading-none">{safety.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold">{tag.value}</p>
                      <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold">
                        {safety.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed opacity-90">{safety.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:bg-surface-alt active:bg-surface-alt transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all"
            >
              {confirmLabel}
            </button>
          </div>
          {onQuickSale && (
            <button
              type="button"
              onClick={onQuickSale}
              className="w-full py-2.5 rounded-xl border border-border bg-surface-alt text-sm font-semibold text-text-secondary hover:bg-border active:scale-[0.98] transition-all"
            >
              확인 완료 (매출만 등록)
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
