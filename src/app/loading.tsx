export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <svg width="28" height="28" viewBox="0 0 56 56" fill="none" className="text-primary animate-pulse">
            <rect x="19" y="28" width="18" height="22" rx="4" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2.5" />
            <rect x="22" y="20" width="12" height="10" rx="3" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="2" />
            <rect x="25" y="14" width="6" height="8" rx="2" fill="currentColor" fillOpacity="0.5" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
        <div className="h-1 w-16 overflow-hidden rounded-full bg-surface-alt">
          <div className="h-full w-1/2 animate-[shimmer_1.2s_ease-in-out_infinite] rounded-full bg-primary/40" />
        </div>
      </div>
    </div>
  );
}
