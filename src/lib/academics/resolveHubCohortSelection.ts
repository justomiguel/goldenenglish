export type HubCohortOption = {
  id: string;
  name: string;
  isCurrent: boolean;
  archivedAt: string | null;
};

export function orderHubCohorts(cohorts: readonly HubCohortOption[]): HubCohortOption[] {
  const active = cohorts.filter((c) => c.archivedAt == null);
  const archived = cohorts.filter((c) => c.archivedAt != null);
  const current = active.filter((c) => c.isCurrent);
  const rest = active.filter((c) => !c.isCurrent);
  return [...current, ...rest, ...archived];
}

export function resolveHubCohortId(
  cohorts: readonly HubCohortOption[],
  queryId: string | null | undefined,
): string | null {
  const id = queryId?.trim() ?? "";
  if (id.length > 0 && cohorts.some((c) => c.id === id)) return id;
  return cohorts.find((c) => c.isCurrent)?.id ?? null;
}

export function hubCohortHref(pathname: string, search: string, cohortId: string): string {
  const params = new URLSearchParams(search);
  params.set("cohort", cohortId);
  const q = params.toString();
  return q.length > 0 ? `${pathname}?${q}` : pathname;
}
