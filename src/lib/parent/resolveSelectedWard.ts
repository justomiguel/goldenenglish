import type { TutorStudentSummary } from "@/lib/auth/listTutorStudentsWithFinance";

/**
 * Resolve which linked student is selected from a search param,
 * falling back to the first student in the list.
 */
export function resolveSelectedWard(
  students: TutorStudentSummary[],
  paramValue: string | undefined,
): string | null {
  if (students.length === 0) return null;
  if (paramValue && students.some((s) => s.studentId === paramValue)) {
    return paramValue;
  }
  return students[0]?.studentId ?? null;
}
