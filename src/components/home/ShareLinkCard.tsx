'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';

function Link2Icon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M9 17H7A5 5 0 0 1 7 7h2" /><path d="M15 7h2a5 5 0 1 1 0 10h-2" /><line x1="8" x2="16" y1="12" y2="12" />
    </svg>
  );
}
function CopyIcon({ className }: { className?: string }): React.ReactElement {
  return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16V4a2 2 0 0 1 2-2h12" /></svg>);
}
function CheckIcon({ className }: { className?: string }): React.ReactElement {
  return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>);
}

export function ShareLinkCard(): React.ReactElement | null {
  const currentShopId = useAuthStore((s) => s.currentShopId);
  const [url, setUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!currentShopId) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    setUrl(`${origin}/pre-consult/${currentShopId}`);
  }, [currentShopId]);

  if (!currentShopId || !url) return null;

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* noop */
    }
  };

  const displayUrl = url.replace(/^https?:\/\//, '');

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl bg-surface border border-border px-4 py-5"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Link2Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-text-muted">손님 공유용</p>
          <h2 className="mt-0.5 text-base font-medium text-text">상담 링크</h2>
          <p className="mt-0.5 text-xs text-text-muted">손님이 날짜·시간과 정보를 직접 입력해요</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          readOnly
          value={displayUrl}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-text-secondary truncate"
        />
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="shrink-0 flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white active:scale-[0.97] transition-transform"
        >
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.span
                key="copied"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1"
              >
                <CheckIcon className="w-3.5 h-3.5" /> 복사됨
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1"
              >
                <CopyIcon className="w-3.5 h-3.5" /> 복사
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.div>
  );
}
