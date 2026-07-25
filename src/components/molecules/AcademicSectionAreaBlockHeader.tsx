import type { LucideIcon } from "lucide-react";

export interface AcademicSectionAreaBlockHeaderProps {
  id: string;
  title: string;
  lead: string;
  icon: LucideIcon;
}

export function AcademicSectionAreaBlockHeader({
  id,
  title,
  lead,
  icon: Icon,
}: AcademicSectionAreaBlockHeaderProps) {
  return (
    <div className="flex items-start gap-3 border-b border-[var(--color-border)] pb-4">
      <span
        className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--layout-border-radius)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
        aria-hidden
      >
        <Icon className="h-7 w-7" />
      </span>
      <div className="min-w-0">
        <h2 id={id} className="text-lg font-semibold text-[var(--color-foreground)]">
          {title}
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)] text-balance">{lead}</p>
      </div>
    </div>
  );
}
