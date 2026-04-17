'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/cn';

interface DragConfirmModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  eventTitle: string;
  fromTime: string;
  toTime: string;
  fromDesigner?: string;
  toDesigner?: string;
}

export function DragConfirmModal({
  open,
  onConfirm,
  onCancel,
  eventTitle,
  fromTime,
  toTime,
  fromDesigner,
  toDesigner,
}: DragConfirmModalProps): React.ReactElement {
  const hasDesignerChange = fromDesigner !== undefined && toDesigner !== undefined && fromDesigner !== toDesigner;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-backdrop"
            onClick={onCancel}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-sm rounded-2xl bg-surface shadow-elevated p-6 flex flex-col gap-5"
          >
            {/* Title */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-text-muted tracking-widest uppercase">일정 변경 확인</span>
              <span className="text-base font-bold text-text truncate">{eventTitle}</span>
            </div>

            {/* Time change visualization */}
            <div className="flex items-center gap-3 rounded-xl bg-surface-alt px-4 py-3">
              <div className="flex flex-col items-center gap-0.5 flex-1">
                <span className="text-[10px] text-text-muted font-medium">이전</span>
                <span className="text-sm font-bold text-text">{fromTime}</span>
                {fromDesigner && (
                  <span className="text-xs text-text-muted">{fromDesigner}</span>
                )}
              </div>

              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div className="flex flex-col items-center gap-0.5 flex-1">
                <span className="text-[10px] text-text-muted font-medium">이후</span>
                <span className={cn('text-sm font-bold', toTime !== fromTime ? 'text-primary' : 'text-text')}>{toTime}</span>
                {toDesigner && (
                  <span className={cn('text-xs', hasDesignerChange ? 'text-primary font-semibold' : 'text-text-muted')}>
                    {toDesigner}
                  </span>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-3 rounded-xl bg-surface-alt text-text-secondary font-semibold text-sm"
              >
                취소
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-sm"
              >
                변경 확인
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default DragConfirmModal;
