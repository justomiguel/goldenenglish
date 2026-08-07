import {
  cohortMatchesCalendarYear,
  type CohortYearCandidate,
} from "@/lib/admin-tutorials/findCohortForCalendarYear";

/** Cohort container for the create-section tour: current year cohort, preferring `is_current`. */
export function resolveTargetCohortForSectionTour(
  cohorts: readonly CohortYearCandidate[],
  year: number,
): CohortYearCandidate | null {
  const active = cohorts.filter((c) => !c.archived_at);
  const current = active.find((c) => c.is_current);
  if (current) return current;

  const yearMatches = active.filter((c) => cohortMatchesCalendarYear(c, year));
  if (yearMatches.length === 0) return null;
  return yearMatches.find((c) => c.is_current) ?? yearMatches[0] ?? null;
}
