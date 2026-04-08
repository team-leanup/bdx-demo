'use client';

export default function OnboardingError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 bg-background">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-error/10">
        <svg className="h-7 w-7 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <div className="text-center">
        <h2 className="text-lg font-bold text-text">설정 중 오류가 발생했어요</h2>
        <p className="mt-1 text-sm text-text-muted">다시 시도해주세요</p>
      </div>
      <button
        onClick={reset}
        className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
      >
        다시 시도
      </button>
    </div>
  );
}
