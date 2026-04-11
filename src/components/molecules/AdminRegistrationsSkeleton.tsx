/**
 * Matches admin registrations list chrome until `SurfaceMountGate` hydrates.
 */
export function AdminRegistrationsSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="h-10 max-w-md rounded bg-[var(--color-muted)]" />
      <div className="h-4 max-w-xl rounded bg-[var(--color-muted)]" />
      <div className="h-10 w-full max-w-xl rounded bg-[var(--color-muted)]" />
      <div className="h-48 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]" />
    </div>
  );
}
