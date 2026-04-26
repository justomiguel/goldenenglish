export interface AcademicSectionStaffAssignedChipsDict {
  heading: string;
  leadBadge: string;
  assistantBadge: string;
  externalBadge: string;
  empty: string;
}

export interface AcademicSectionStaffAssignedChipsProps {
  leadTeacherLabel: string | null;
  assistantLabels: string[];
  externalLabels: string[];
  dict: AcademicSectionStaffAssignedChipsDict;
}

const chipBase =
  "inline-flex max-w-full items-center truncate rounded-full border px-2.5 py-1 text-xs font-medium";

export function AcademicSectionStaffAssignedChips({
  leadTeacherLabel,
  assistantLabels,
  externalLabels,
  dict,
}: AcademicSectionStaffAssignedChipsProps) {
  const hasLead = Boolean(leadTeacherLabel?.trim());
  const hasAssistants = assistantLabels.length > 0;
  const hasExternals = externalLabels.length > 0;
  const hasAny = hasLead || hasAssistants || hasExternals;

  const headingId = "academic-section-staff-assigned-chips-h";

  return (
    <section
      className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/20 p-4"
      aria-labelledby={headingId}
    >
      <h3 id={headingId} className="text-sm font-semibold text-[var(--color-foreground)]">
        {dict.heading}
      </h3>
      {!hasAny ? (
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{dict.empty}</p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label={dict.heading}>
          {hasLead ? (
            <li className="min-w-0 max-w-full">
              <span
                className={`${chipBase} border-[var(--color-primary)]/50 bg-[var(--color-primary)]/10 text-[var(--color-primary)]`}
                title={`${dict.leadBadge}: ${leadTeacherLabel}`}
              >
                <span className="mr-1.5 shrink-0 font-semibold">{dict.leadBadge}</span>
                <span className="truncate">{leadTeacherLabel}</span>
              </span>
            </li>
          ) : null}
          {assistantLabels.map((label, i) => (
            <li key={`a-${i}-${label}`} className="min-w-0 max-w-full">
              <span
                className={`${chipBase} border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)]`}
                title={`${dict.assistantBadge}: ${label}`}
              >
                <span className="mr-1.5 shrink-0 text-[var(--color-muted-foreground)]">{dict.assistantBadge}</span>
                <span className="truncate">{label}</span>
              </span>
            </li>
          ))}
          {externalLabels.map((label, i) => (
            <li key={`e-${i}-${label}`} className="min-w-0 max-w-full">
              <span
                className={`${chipBase} border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 text-[var(--color-accent)]`}
                title={`${dict.externalBadge}: ${label}`}
              >
                <span className="mr-1.5 shrink-0 font-semibold">{dict.externalBadge}</span>
                <span className="truncate">{label}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
