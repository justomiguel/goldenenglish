export type CohortYearCandidate = {
  id: string;
  name: string;
  slug: string | null;
  starts_on: string | null;
  ends_on: string | null;
  archived_at: string | null;
  is_current?: boolean;
};

/** True when the cohort name/slug/dates reference the given calendar year. */
export function cohortMatchesCalendarYear(cohort: CohortYearCandidate, year: number): boolean {
  if (cohort.archived_at) return false;
  const yearStr = String(year);
  if (cohort.name.includes(yearStr)) return true;
  if (cohort.slug?.includes(yearStr)) return true;
  if (cohort.starts_on?.slice(0, 4) === yearStr) return true;
  if (cohort.ends_on?.slice(0, 4) === yearStr) return true;
  return false;
}

/** Prefer the current cohort when multiple rows match the same calendar year. */
export function findCohortForCalendarYear(
  cohorts: readonly CohortYearCandidate[],
  year: number,
): CohortYearCandidate | null {
  const matches = cohorts.filter((c) => cohortMatchesCalendarYear(c, year));
  if (matches.length === 0) return null;
  return matches.find((c) => c.is_current) ?? matches[0] ?? null;
}
