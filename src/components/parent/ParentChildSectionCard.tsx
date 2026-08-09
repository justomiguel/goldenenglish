import Link from "next/link";
import { ChevronRight, TriangleAlert } from "lucide-react";

export interface ParentChildPreviewItem {
  id: string;
  primary: string;
  secondary?: string;
  trailing?: string;
}

export interface ParentChildSectionCardProps {
  title: string;
  href: string;
  seeAllLabel: string;
  emptyLabel: string;
  items: ParentChildPreviewItem[];
  /** Renders the failure notice instead of the empty state, so a dead read never reads as "nothing here". */
  failed?: boolean;
  failedLabel: string;
}

export function ParentChildSectionCard({
  title,
  href,
  seeAllLabel,
  emptyLabel,
  items,
  failed = false,
  failedLabel,
}: ParentChildSectionCardProps) {
  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-2.5">
        <h2 className="font-display text-sm font-semibold text-[var(--color-foreground)]">
          {title}
        </h2>
        <Link
          href={href}
          className="inline-flex min-h-[32px] items-center gap-0.5 text-xs font-semibold text-[var(--color-primary)]"
        >
          {seeAllLabel}
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      {failed ? (
        <p
          role="status"
          className="flex items-center gap-2 px-4 py-4 text-sm text-[var(--color-muted-foreground)]"
        >
          <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden />
          {failedLabel}
        </p>
      ) : items.length === 0 ? (
        <p className="px-4 py-4 text-sm text-[var(--color-muted-foreground)]">{emptyLabel}</p>
      ) : (
        <ul className="m-0 divide-y divide-[var(--color-border)] p-0">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-[var(--color-foreground)]">
                  {item.primary}
                </span>
                {item.secondary ? (
                  <span className="block truncate text-xs text-[var(--color-muted-foreground)]">
                    {item.secondary}
                  </span>
                ) : null}
              </span>
              {item.trailing ? (
                <span className="shrink-0 text-xs font-semibold text-[var(--color-muted-foreground)]">
                  {item.trailing}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
