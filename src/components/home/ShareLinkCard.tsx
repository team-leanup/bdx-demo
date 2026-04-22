'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import { ToastContainer, type ToastData } from '@/components/ui';

function Link2Icon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M9 17H7A5 5 0 0 1 7 7h2" /><path d="M15 7h2a5 5 0 1 1 0 10h-2" /><line x1="8" x2="16" y1="12" y2="12" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function ShareLinkCard(): React.ReactElement | null {
  const currentShopId = useAuthStore((s) => s.currentShopId);
  const [url, setUrl] = useState<string>('');
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    if (!currentShopId) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    setUrl(`${origin}/pre-consult/${currentShopId}`);
  }, [currentShopId]);

  if (!currentShopId || !url) return null;

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(url);
      setToasts((prev) => [
        ...prev,
        { id: `${Date.now()}-copy`, type: 'success', message: '링크가 복사되었어요' },
      ]);
    } catch {
      setToasts((prev) => [
        ...prev,
        { id: `${Date.now()}-copy-err`, type: 'error', message: '복사에 실패했어요' },
      ]);
    }
  };

  const handleDismissToast = (id: string): void => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      <motion.button
        type="button"
        onClick={() => void handleCopy()}
        whileTap={{ scale: 0.98 }}
        className="w-full relative overflow-hidden rounded-2xl bg-surface border border-border px-4 py-5 text-left hover:bg-surface-alt transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Link2Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text-muted">손님 공유용</p>
            <h2 className="mt-0.5 text-base font-semibold text-text">상담 링크 복사</h2>
            <p className="mt-0.5 text-xs text-text-muted">손님이 날짜·시간과 정보를 직접 입력해요</p>
          </div>
          <ChevronRightIcon className="h-5 w-5 flex-shrink-0 text-text-muted" />
        </div>
      </motion.button>

      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </>
  );
}
