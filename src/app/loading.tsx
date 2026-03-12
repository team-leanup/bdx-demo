export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <img
          src="/bdx-logo/bdx-symbol.svg"
          alt="BDX"
          className="h-16 w-16 animate-pulse"
        />
      </div>
    </div>
  );
}
