import type { ReactNode } from "react";

export interface DashboardGreetingHeroProps {
  kicker: string;
  greeting: string;
  firstName: string | null;
  fullDateLine: string;
  lead: string;
  children?: ReactNode;
  ariaLabel?: string;
}

/**
 * Server-friendly hero used at the top of every role dashboard. Uses brand tokens only
 * (no hex literals) and a subtle accent gradient so the first paint feels polished without
 * fighting the design system.
 */
export function DashboardGreetingHero({
  kicker,
  greeting,
  firstName,
  fullDateLine,
  lead,
  children,
  ariaLabel,
}: DashboardGreetingHeroProps) {
  const headline = firstName ? `${greeting}, ${firstName}` : greeting;
  return (
    <section
      aria-label={ariaLabel ?? kicker}
      className="relative overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in oklch, var(--color-primary) 10%, transparent) 0%, transparent 55%, color-mix(in oklch, var(--color-accent) 18%, transparent) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full opacity-40 blur-3xl"
        style={{ background: "color-mix(in oklch, var(--color-accent) 35%, transparent)" }}
      />
      <div className="relative px-5 py-6 sm:px-8 sm:py-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-secondary)]">
          {kicker}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-[var(--color-foreground)] sm:text-4xl">
          {headline}
        </h1>
        <p className="mt-2 text-sm font-medium text-[var(--color-muted-foreground)]">
          {fullDateLine}
        </p>
        <p className="mt-3 max-w-2xl text-sm text-[var(--color-foreground)]/80 sm:text-base">
          {lead}
        </p>
        {children ? <div className="mt-5">{children}</div> : null}
      </div>
    </section>
  );
}
