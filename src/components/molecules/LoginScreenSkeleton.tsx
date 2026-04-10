/**
 * Login loading shell — mirrors responsive layout (narrow vs two-column) using CSS only,
 * so first paint aligns with the real screen before `useAppSurface` hydrates.
 */
export function LoginScreenSkeleton() {
  const pulse = "animate-pulse rounded-[var(--layout-border-radius)] bg-[var(--color-border)]/80";
  const pulseDark = "animate-pulse rounded-[var(--layout-border-radius)] bg-white/10";

  return (
    <div
      className="min-h-screen bg-[var(--color-background)]"
      aria-busy="true"
      aria-label="Loading"
    >
      {/* Mobile / narrow — matches LoginScreenNarrow structure */}
      <div className="flex min-h-dvh flex-col md:hidden">
        <div className="flex items-center justify-between gap-3 px-4 pt-3">
          <div className={`h-11 w-24 ${pulse}`} />
          <div className={`h-9 w-36 rounded-full ${pulse}`} />
        </div>
        <div className="mx-4 mt-4 overflow-hidden rounded-2xl bg-[var(--color-primary-dark)] px-5 py-6">
          <div className="flex items-center gap-4">
            <div className={`h-14 w-14 shrink-0 rounded-[var(--layout-border-radius)] ${pulseDark}`} />
            <div className="min-w-0 flex-1 space-y-2">
              <div className={`h-4 w-3/4 max-w-[12rem] ${pulseDark}`} />
              <div className={`h-3 w-full max-w-[14rem] ${pulseDark}`} />
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col px-4 pb-6 pt-8">
          <div className="mx-auto w-full max-w-[22rem] space-y-6">
            <div className="space-y-3">
              <div className={`h-3 w-24 ${pulse}`} />
              <div className={`h-8 w-4/5 max-w-[14rem] ${pulse}`} />
              <div className={`h-4 w-full ${pulse}`} />
            </div>
            <div className="space-y-5">
              <div className="space-y-2">
                <div className={`h-3 w-16 ${pulse}`} />
                <div className={`h-11 w-full ${pulse}`} />
              </div>
              <div className="space-y-2">
                <div className={`h-3 w-20 ${pulse}`} />
                <div className={`h-11 w-full ${pulse}`} />
              </div>
            </div>
            <div className={`h-12 w-full ${pulse}`} />
            <div className={`h-4 w-40 ${pulse}`} />
          </div>
        </div>
      </div>

      {/* Desktop — matches LoginScreenDesktop two-column grid */}
      <div className="hidden min-h-screen md:grid md:grid-cols-2">
        <aside className="relative flex flex-col justify-center bg-[var(--color-primary-dark)] px-8 py-12 md:px-12 lg:px-16">
          <div className="mx-auto w-full max-w-lg space-y-6 md:mx-0">
            <div className={`mx-auto h-24 w-24 rounded-[var(--layout-border-radius)] md:mx-0 ${pulseDark}`} />
            <div className={`mx-auto h-8 w-3/5 max-w-xs md:mx-0 ${pulseDark}`} />
            <div className="mx-auto space-y-2 md:mx-0">
              <div className={`h-4 w-full max-w-md ${pulseDark}`} />
              <div className={`h-4 w-4/5 max-w-sm ${pulseDark}`} />
            </div>
          </div>
        </aside>
        <section className="flex flex-col border-l border-[var(--color-border)] bg-[var(--color-background)]">
          <header className="flex items-center justify-between gap-4 px-8 pt-7">
            <div className={`h-9 w-28 ${pulse}`} />
            <div className={`h-9 w-36 rounded-full ${pulse}`} />
          </header>
          <div className="flex flex-1 flex-col justify-center px-8 py-14 lg:px-12">
            <div className="mx-auto w-full max-w-md space-y-6">
              <div className="space-y-3">
                <div className={`h-3 w-28 ${pulse}`} />
                <div className={`h-9 w-2/3 ${pulse}`} />
                <div className={`h-4 w-full ${pulse}`} />
              </div>
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className={`h-3 w-14 ${pulse}`} />
                  <div className={`h-11 w-full ${pulse}`} />
                </div>
                <div className="space-y-2">
                  <div className={`h-3 w-24 ${pulse}`} />
                  <div className={`h-11 w-full ${pulse}`} />
                </div>
              </div>
              <div className={`h-12 w-full ${pulse}`} />
              <div className={`h-4 w-44 ${pulse}`} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
