export type StudentFichaCohortStaff = {
  id: string;
  name: string;
};

export type StudentFichaCohortEnrollment = {
  enrollmentId: string;
  cohortId: string;
  cohortName: string;
  isCurrent: boolean;
  sectionId: string;
  sectionName: string;
  status: string;
  createdAt: string;
  teacher: StudentFichaCohortStaff | null;
  assistants: StudentFichaCohortStaff[];
};

export type StudentFichaCohortOption = {
  id: string;
  name: string;
  isCurrent: boolean;
  latestEnrollmentAt: string;
};

export const STUDENT_FICHA_COHORT_LIST_FAILED = "cohort_list_failed";

export function buildStudentCohortOptions(
  rows: StudentFichaCohortEnrollment[],
): StudentFichaCohortOption[] {
  const byId = new Map<string, StudentFichaCohortOption>();
  for (const row of rows) {
    if (!row.cohortId) continue;
    const current = byId.get(row.cohortId);
    if (!current) {
      byId.set(row.cohortId, {
        id: row.cohortId,
        name: row.cohortName || row.cohortId,
        isCurrent: row.isCurrent,
        latestEnrollmentAt: row.createdAt,
      });
      continue;
    }
    if (row.createdAt > current.latestEnrollmentAt) {
      current.latestEnrollmentAt = row.createdAt;
    }
    if (row.isCurrent) current.isCurrent = true;
    if (row.cohortName) current.name = row.cohortName;
  }

  return [...byId.values()].sort((left, right) => {
    if (left.isCurrent !== right.isCurrent) return left.isCurrent ? -1 : 1;
    if (left.latestEnrollmentAt !== right.latestEnrollmentAt) {
      return left.latestEnrollmentAt < right.latestEnrollmentAt ? 1 : -1;
    }
    return left.name.localeCompare(right.name);
  });
}

export function defaultStudentCohortId(options: StudentFichaCohortOption[]): string | null {
  return options.find((option) => option.isCurrent)?.id ?? options[0]?.id ?? null;
}

export function resolveStudentCohortId(
  options: StudentFichaCohortOption[],
  requested: string | null | undefined,
): string | null {
  if (requested && options.some((option) => option.id === requested)) return requested;
  return defaultStudentCohortId(options);
}

export function filterPaymentsForCohort<T extends { section_id: string | null }>(
  payments: readonly T[],
  sectionIds: ReadonlySet<string>,
): T[] {
  return payments.filter(
    (payment) => payment.section_id != null && sectionIds.has(payment.section_id),
  );
}

type SectionBenefitPick = {
  sectionId: string;
  enrollmentStatus?: string | null;
  enrollmentCreatedAt?: string | null;
};

function prefersEnrollment(next: SectionBenefitPick, previous: SectionBenefitPick): boolean {
  const nextActive = next.enrollmentStatus === "active";
  const previousActive = previous.enrollmentStatus === "active";
  if (nextActive !== previousActive) return nextActive;
  return (next.enrollmentCreatedAt ?? "") > (previous.enrollmentCreatedAt ?? "");
}

export function preferActiveSectionBenefits<T extends SectionBenefitPick>(rows: readonly T[]): T[] {
  const order: string[] = [];
  const best = new Map<string, T>();
  for (const row of rows) {
    const previous = best.get(row.sectionId);
    if (!previous) {
      order.push(row.sectionId);
      best.set(row.sectionId, row);
      continue;
    }
    if (prefersEnrollment(row, previous)) best.set(row.sectionId, row);
  }
  return order.map((sectionId) => best.get(sectionId)!);
}
