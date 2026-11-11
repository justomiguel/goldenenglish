"use client";

import { useMemo } from "react";
import { usePersistentPageTab } from "@/hooks/usePersistentPageTab";
import {
  buildStudentCohortOptions,
  defaultStudentCohortId,
  type StudentFichaCohortEnrollment,
} from "@/lib/dashboard/studentFichaCohort";

const NO_COHORT = "__none__";

export function useAdminStudentCohortSelection(
  enrollments: StudentFichaCohortEnrollment[] | undefined,
) {
  const options = useMemo(() => buildStudentCohortOptions(enrollments ?? []), [enrollments]);
  const allowed = useMemo(
    () => (options.length > 0 ? options.map((option) => option.id) : [NO_COHORT]),
    [options],
  );
  const fallback = defaultStudentCohortId(options) ?? NO_COHORT;
  const { value, setValue } = usePersistentPageTab({
    allowed,
    fallback,
    param: "cohort",
  });

  return {
    options,
    selectedCohortId: value === NO_COHORT ? null : value,
    setSelectedCohortId: setValue,
  };
}
