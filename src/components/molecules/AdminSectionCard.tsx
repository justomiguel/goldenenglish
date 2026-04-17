import Link from "next/link";
import { SectionCapacityBar } from "@/components/molecules/SectionCapacityBar";

export interface AdminSectionCardProps {
  href: string;
  name: string;
  activeCount: number;
  maxStudents: number;
  capacityLabel: string;
  /** When set, shows an archived badge next to the title (operational archive). */
  archivedLabel?: string;
  /** Preformatted section date range (locale-aware), shown under the title. */
  periodLine?: string;
}

export function AdminSectionCard({
  href,
  name,
  activeCount,
  maxStudents,
  capacityLabel,
  archivedLabel,
  periodLine,
}: AdminSectionCardProps) {
  return (
    <article className="flex flex-col gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Link href={href} className="text-base font-semibold text-[var(--color-primary)] hover:underline">
          {name}
        </Link>
        {archivedLabel ? (
          <span className="rounded-full bg-[var(--color-muted)] px-2 py-0.5 text-xs font-medium text-[var(--color-muted-foreground)]">
            {archivedLabel}
          </span>
        ) : null}
      </div>
      {periodLine ? (
        <p className="text-xs text-[var(--color-muted-foreground)]">{periodLine}</p>
      ) : null}
      <SectionCapacityBar
        activeCount={activeCount}
        maxStudents={maxStudents}
        label={capacityLabel}
      />
    </article>
  );
}
