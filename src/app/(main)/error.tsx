'use client';

export default function MainError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 bg-background">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-error/10">
        <svg className="h-7 w-7 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <div className="text-center">
        <h2 className="text-lg font-bold text-text">오류가 발생했어요</h2>
        <p className="mt-1 text-sm text-text-muted">잠시 후 다시 시도해주세요</p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-xl bg-surface-alt px-5 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-surface-alt/80"
        >
          다시 시도
        </button>
        <a
          href="/home"
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
        >
          홈으로
        </a>
      </div>
    </div>
  );
}
