export type RegistrationCohortMembershipInput = {
  selectedCohortId: string;
  openCohortId: string;
  status: string;
  preferredSectionCohortId: string | null;
  activeSectionCohortIds: readonly string[];
};

export function resolveRegistrationCohortId(
  raw: string | undefined,
  cohorts: readonly { id: string }[],
  openCohortId: string | null,
): string | null {
  const trimmed = raw?.trim() ?? "";
  if (trimmed && cohorts.some((cohort) => cohort.id === trimmed)) return trimmed;
  return openCohortId;
}

export function registrationBelongsToCohort(input: RegistrationCohortMembershipInput): boolean {
  if (input.status === "enrolled") {
    return input.activeSectionCohortIds.includes(input.selectedCohortId);
  }
  if (input.preferredSectionCohortId) {
    return input.preferredSectionCohortId === input.selectedCohortId;
  }
  return input.selectedCohortId === input.openCohortId;
}
