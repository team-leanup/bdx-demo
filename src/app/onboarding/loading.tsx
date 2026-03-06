export default function OnboardingLoading(): React.ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
        <span className="text-sm text-text-muted">설정 불러오는 중...</span>
      </div>
    </div>
  );
}
