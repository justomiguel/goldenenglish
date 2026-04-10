export function AdminImportScreenSkeleton() {
  const pulse =
    "animate-pulse rounded-[var(--layout-border-radius)] bg-[var(--color-border)]/80";

  return (
    <div
      className="min-h-screen bg-[var(--color-muted)] px-4 py-10"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="mx-auto max-w-[var(--layout-max-width)] py-6">
        <div className="mb-4 flex justify-end">
          <div className={`h-9 w-36 rounded-full ${pulse}`} />
        </div>
        <div className={`mb-6 h-9 w-64 max-w-full ${pulse}`} />
        <div
          className={`min-h-64 max-w-xl space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-6`}
        >
          <div className={`h-6 w-48 ${pulse}`} />
          <div className={`h-20 w-full ${pulse}`} />
          <div className={`h-11 w-40 ${pulse}`} />
        </div>
      </div>
    </div>
  );
}
