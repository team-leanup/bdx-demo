'use client';

import { useEffect, useState } from 'react';

export default function PreConsultError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  const [backHref, setBackHref] = useState<string>('/');

  useEffect(() => {
    // pathname: /pre-consult/[shopId]/... → shopId 추출
    const segments = window.location.pathname.split('/').filter(Boolean);
    // segments[0] = 'pre-consult', segments[1] = shopId
    const shopId = segments[1];
    if (shopId) {
      setBackHref(`/pre-consult/${shopId}`);
    }
  }, []);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 bg-background">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-error/10">
        <svg
          className="h-8 w-8 text-error"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>

      <div className="text-center">
        {/* 중립 아이콘 + 다국어 무난한 문구 */}
        <p className="text-[32px] leading-none mb-3">⚠️</p>
        <h2 className="text-lg font-bold text-text">오류가 발생했어요</h2>
        <p className="mt-1 text-sm text-text-muted">Something went wrong</p>
        <p className="mt-0.5 text-sm text-text-muted">エラーが発生しました</p>
        <p className="mt-0.5 text-sm text-text-muted">出现了错误</p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-xl bg-surface-alt px-5 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-surface-alt/80"
        >
          다시 시도 / Retry
        </button>
        <a
          href={backHref}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
        >
          처음으로 / Home
        </a>
      </div>
    </div>
  );
}
