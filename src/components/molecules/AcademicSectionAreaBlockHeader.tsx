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
    <div className="flex items-start gap-2.5 border-b border-[var(--color-border)] pb-3 sm:gap-3 sm:pb-4">
      <span
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--layout-border-radius)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] sm:h-12 sm:w-12"
        aria-hidden
      >
        <Icon className="h-5 w-5 sm:h-7 sm:w-7" />
      </span>
      <div className="min-w-0">
        <h2 id={id} className="text-base font-semibold text-[var(--color-foreground)] sm:text-lg">
          {title}
        </h2>
        <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)] text-balance sm:mt-1 sm:text-sm">{lead}</p>
      </div>
    </div>
  );
}
