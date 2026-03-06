'use client';

import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/cn';
import type { CustomerTag } from '@/types/customer';

const ACCENT_BG: Record<string, string> = {
  rose: 'bg-rose-100 text-rose-700 border-rose-200',
  amber: 'bg-amber-100 text-amber-700 border-amber-200',
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  sky: 'bg-sky-100 text-sky-700 border-sky-200',
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
};

interface PretreatmentAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  customerName: string;
  pinnedTags: CustomerTag[];
}

export function PretreatmentAlertModal({
  isOpen,
  onClose,
  onConfirm,
  customerName,
  pinnedTags,
}: PretreatmentAlertModalProps): React.ReactElement {
  const displayTags = pinnedTags.slice(0, 5);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="시술 전 확인사항">
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
          이 고객에게 <span className="font-semibold text-text">주의가 필요한 특이사항</span>이 있습니다.<br />
          시술 전 반드시 확인해 주세요.
        </p>

        <div className="flex flex-wrap justify-center gap-2">
          {displayTags.map((tag) => (
            <span
              key={tag.id}
              className={cn(
                'px-3 py-1.5 text-sm font-semibold rounded-full border',
                tag.accent ? ACCENT_BG[tag.accent] : 'bg-surface-alt text-text-muted border-border'
              )}
            >
              {tag.value}
            </span>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:bg-surface-alt active:bg-surface-alt transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all"
          >
            확인하고 시작
          </button>
        </div>
      </div>
    </Modal>
  );
}
