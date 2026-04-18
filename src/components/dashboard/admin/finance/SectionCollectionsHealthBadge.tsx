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
  return (
    <span
      role="status"
      aria-label={dict.health.ariaLabel}
      title={tooltip(health, dict)}
      className={`inline-flex items-center gap-1 rounded-full border font-semibold uppercase tracking-wide ${sizeClasses} ${tokenClasses(health)}`}
    >
      {label(health, dict)}
    </span>
  );
}
