import type { ReactNode } from "react";

export interface PwaGroupedSectionProps {
  title?: string;
  footer?: string;
  children: ReactNode;
  className?: string;
}

export function PwaGroupedSection({ title, footer, children, className = "" }: PwaGroupedSectionProps) {
  return (
    <section className={`px-4 py-2.5 ${className}`.trim()}>
      {title ? (
        <h2 className="mb-2 px-1 text-[0.6875rem] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
          {title}
        </h2>
      ) : null}
      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-soft)]">
        {children}
      </div>
      {footer ? (
        <p className="mt-2 px-1 text-xs leading-relaxed text-[var(--color-muted-foreground)]">{footer}</p>
      ) : null}
    </section>
  );
}
