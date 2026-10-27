import type { ReactNode } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";

interface AdminEventSummarySectionProps {
  icon: LucideIcon;
  step: string;
  title: string;
  lead: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function AdminEventSummarySection({
  icon: Icon,
  step,
  title,
  lead,
  defaultOpen = false,
  children,
}: AdminEventSummarySectionProps) {
  return (
    <details
      open={defaultOpen}
      className="group overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-[var(--shadow-soft)]"
    >
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 hover:bg-[var(--color-muted)]/25 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-[var(--color-primary-foreground)]">
            {step}
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-2 text-base font-semibold text-[var(--color-foreground)]">
              <Icon className="h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />
              {title}
            </span>
            <span className="mt-0.5 block text-xs font-normal text-[var(--color-muted-foreground)]">
              {lead}
            </span>
          </span>
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)] transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="border-t border-[var(--color-border)] p-4 sm:p-5">{children}</div>
    </details>
  );
}
