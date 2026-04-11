/**
 * Matches admin users list chrome until `SurfaceMountGate` hydrates (see LoginScreenSkeleton).
 */
export function AdminUsersSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="h-8 max-w-md rounded bg-[var(--color-muted)]" />
      <div className="h-4 max-w-xl rounded bg-[var(--color-muted)]" />
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="h-10 flex-1 rounded bg-[var(--color-muted)]" />
        <div className="h-10 w-full max-w-[10rem] rounded bg-[var(--color-muted)]" />
      </div>
      <div className="h-48 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]" />
    </div>
  );
}
