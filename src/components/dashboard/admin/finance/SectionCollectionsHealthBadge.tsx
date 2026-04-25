import type { SectionCollectionsHealth } from "@/types/sectionCollections";
import type { Dictionary } from "@/types/i18n";

type CollectionsDict = Dictionary["admin"]["finance"]["collections"];

function tokenClasses(health: SectionCollectionsHealth): string {
  switch (health) {
    case "healthy":
      return "border-[var(--color-success)] bg-[var(--color-success)]/15 text-[var(--color-success)]";
    case "watch":
      return "border-[var(--color-warning)] bg-[var(--color-warning)]/20 text-[var(--color-foreground)]";
    case "critical":
    default:
      return "border-[var(--color-error)] bg-[var(--color-surface)] text-[var(--color-error)]";
  }
}

function label(health: SectionCollectionsHealth, dict: CollectionsDict): string {
  return dict.health[health];
}

function tooltip(health: SectionCollectionsHealth, dict: CollectionsDict): string {
  switch (health) {
    case "healthy":
      return dict.health.tooltipHealthy;
    case "watch":
      return dict.health.tooltipWatch;
    default:
      return dict.health.tooltipCritical;
  }
}

export interface SectionCollectionsHealthBadgeProps {
  health: SectionCollectionsHealth;
  dict: CollectionsDict;
  size?: "sm" | "md";
}

export function SectionCollectionsHealthBadge({
  health,
  dict,
  size = "md",
}: SectionCollectionsHealthBadgeProps) {
  const sizeClasses =
    size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  const labelText = label(health, dict);
  const tooltipText = tooltip(health, dict);
  return (
    <span
      role="status"
      tabIndex={0}
      aria-label={`${dict.health.ariaLabel}: ${labelText}. ${tooltipText}`}
      title={`${labelText}: ${tooltipText}`}
      className={`group relative inline-flex cursor-help items-center gap-1 rounded-full border font-semibold uppercase tracking-wide outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] ${sizeClasses} ${tokenClasses(health)}`}
    >
      {labelText}
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-72 -translate-x-1/2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-left text-xs normal-case leading-relaxed tracking-normal text-[var(--color-foreground)] shadow-lg group-hover:block group-focus-visible:block">
        <span className="block font-semibold text-[var(--color-primary)]">
          {labelText}
        </span>
        <span className="mt-1 block text-[var(--color-muted-foreground)]">
          {tooltipText}
        </span>
      </span>
    </span>
  );
}
