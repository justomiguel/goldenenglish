import type { ReactNode } from "react";

interface AdminEventPricingGroupProps {
  title?: string;
  lead?: string;
  children: ReactNode;
}

export function AdminEventPricingGroup({ title, lead, children }: AdminEventPricingGroupProps) {
  if (!title) return <>{children}</>;

  return (
    <section className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/20 p-4">
      <header className="space-y-1 border-b border-[var(--color-border)] pb-3">
        <h3 className="text-sm font-semibold text-[var(--color-foreground)]">{title}</h3>
        {lead ? <p className="text-xs text-[var(--color-muted-foreground)]">{lead}</p> : null}
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
