export function LandingScreenSkeleton() {
  const pulse =
    "animate-pulse rounded-[var(--layout-border-radius)] bg-[var(--color-border)]/80";

  return (
    <div
      className="min-h-screen bg-[var(--color-background)]"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="md:hidden">
        <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <div className={`h-11 flex-1 ${pulse}`} />
            <div className={`h-9 w-24 rounded-full ${pulse}`} />
            <div className={`h-11 w-11 shrink-0 ${pulse}`} />
          </div>
        </div>
        <div className="flex border-t border-[var(--color-border)]/60">
          <div className={`h-12 flex-1 ${pulse} rounded-none`} />
          <div className={`h-12 flex-1 ${pulse} rounded-none`} />
        </div>
        <div className="space-y-3 px-4 py-6">
          <div className={`h-48 w-full rounded-2xl ${pulse}`} />
          <div className={`h-32 w-full ${pulse}`} />
          <div className={`h-40 w-full ${pulse}`} />
        </div>
      </div>

      <div className="hidden md:block">
        <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5">
          <div className="mx-auto flex max-w-[var(--layout-max-width)] items-center justify-between">
            <div className={`h-12 w-48 ${pulse}`} />
            <div className={`h-9 w-72 ${pulse}`} />
          </div>
        </div>
        <div className="space-y-4 px-4 py-10">
          <div className={`mx-auto h-64 max-w-4xl ${pulse}`} />
          <div className={`mx-auto h-40 max-w-3xl ${pulse}`} />
          <div className={`mx-auto h-52 max-w-3xl ${pulse}`} />
        </div>
      </div>
    </div>
  );
}
