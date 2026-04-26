import type { SectionContentHealth } from "@/types/learningContent";

interface ContentPlanHealthSummaryProps {
  health: SectionContentHealth;
  labels: {
    healthTitle: string;
    healthOk: string;
    healthMissingObjectives: string;
    healthMissingEntry: string;
    healthMissingExit: string;
    healthNeedsSupport: string;
    healthTeacherOverride: string;
  };
}

export function ContentPlanHealthSummary({ health, labels }: ContentPlanHealthSummaryProps) {
  const items = [
    health.missingObjectives ? labels.healthMissingObjectives : null,
    health.missingEntryAssessment ? labels.healthMissingEntry : null,
    health.missingExitAssessment ? labels.healthMissingExit : null,
    health.needsSupportCount > 0
      ? labels.healthNeedsSupport.replace("{count}", String(health.needsSupportCount))
      : null,
    health.teacherOverrideCount > 0
      ? labels.healthTeacherOverride.replace("{count}", String(health.teacherOverrideCount))
      : null,
  ].filter((item): item is string => Boolean(item));

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {labels.healthTitle}
      </h2>
      {items.length === 0 ? (
        <p className="mt-3 rounded-full border border-[var(--color-success)] px-3 py-2 text-sm font-medium text-[var(--color-success)]">
          {labels.healthOk}
        </p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <li key={item} className="rounded-full border border-[var(--color-warning)] px-3 py-1 text-xs font-semibold text-[var(--color-warning)]">
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
