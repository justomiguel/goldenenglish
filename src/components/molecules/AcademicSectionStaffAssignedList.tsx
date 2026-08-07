import { AcademicSectionStaffPersonCard } from "@/components/molecules/AcademicSectionStaffPersonCard";
import type { SectionStaffAssignedPerson } from "@/lib/academics/sectionStaffAssignedPerson";

export interface AcademicSectionStaffAssignedListDict {
  heading: string;
  leadBadge: string;
  assistantBadge: string;
  assistantBadgeTeacher: string;
  assistantBadgeStudent: string;
  assistantBadgePortalAssistant: string;
  externalBadge: string;
  empty: string;
  openProfileAria: string;
  phoneLabel: string;
  documentLabel: string;
  emailLabel: string;
}

export interface AcademicSectionStaffAssignedListProps {
  locale: string;
  people: SectionStaffAssignedPerson[];
  externalLabels: string[];
  dict: AcademicSectionStaffAssignedListDict;
  /** When true, omits outer card chrome (used inside summary band). */
  embedded?: boolean;
}

export function AcademicSectionStaffAssignedList({
  locale,
  people,
  externalLabels,
  dict,
  embedded = false,
}: AcademicSectionStaffAssignedListProps) {
  const hasPeople = people.length > 0;
  const hasExternals = externalLabels.length > 0;
  const hasAny = hasPeople || hasExternals;
  const headingId = "academic-section-staff-assigned-list-h";
  const Wrapper = embedded ? "div" : "section";

  return (
    <Wrapper
      className={
        embedded
          ? undefined
          : "rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/20 p-4"
      }
      aria-labelledby={headingId}
    >
      <h3 id={headingId} className="text-sm font-semibold text-[var(--color-foreground)]">
        {dict.heading}
      </h3>
      {!hasAny ? (
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{dict.empty}</p>
      ) : (
        <div className="mt-3 space-y-3">
          {hasPeople ? (
            <ul className="space-y-2" aria-label={dict.heading}>
              {people.map((person) => (
                <AcademicSectionStaffPersonCard
                  key={`${person.kind}-${person.id}`}
                  locale={locale}
                  person={person}
                  dict={dict}
                />
              ))}
            </ul>
          ) : null}
          {hasExternals ? (
            <ul className="flex flex-wrap gap-2" aria-label={dict.externalBadge}>
              {externalLabels.map((label, i) => (
                <li key={`e-${i}-${label}`} className="min-w-0 max-w-full">
                  <span
                    className="inline-flex max-w-full items-center truncate rounded-full border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 px-2.5 py-1 text-xs font-medium text-[var(--color-accent)]"
                    title={`${dict.externalBadge}: ${label}`}
                  >
                    <span className="mr-1.5 shrink-0 font-semibold">{dict.externalBadge}</span>
                    <span className="truncate">{label}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </Wrapper>
  );
}
