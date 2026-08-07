import type {
  ParentFocusCatalog,
  ParentFocusSearchParams,
  ParentFocusSectionOption,
  ParentFocusStudentOption,
  ResolvedParentFocus,
} from "@/lib/parent/parentFocusTypes";

const EMPTY: ResolvedParentFocus = {
  studentId: null,
  sectionId: null,
  student: null,
  sectionsForStudent: [],
  section: null,
};

function pickStudent(
  students: ParentFocusStudentOption[],
  studentId: string | null | undefined,
): ParentFocusStudentOption | null {
  if (students.length === 0) return null;
  if (studentId && students.some((s) => s.studentId === studentId)) {
    return students.find((s) => s.studentId === studentId) ?? null;
  }
  return students[0] ?? null;
}

function pickSection(
  sections: ParentFocusSectionOption[],
  sectionId: string | null | undefined,
): ParentFocusSectionOption | null {
  if (sections.length === 0) return null;
  if (sectionId && sections.some((s) => s.sectionId === sectionId)) {
    return sections.find((s) => s.sectionId === sectionId) ?? null;
  }
  return sections[0] ?? null;
}

/**
 * Resolve parent portal focus from a catalog + URL search params.
 * Invalid/missing student → first student; invalid/missing section → first
 * active section of that student (or null if none).
 */
export function resolveParentFocus(
  catalog: ParentFocusCatalog,
  params: ParentFocusSearchParams,
): ResolvedParentFocus {
  const student = pickStudent(catalog.students, params.studentId);
  if (!student) return EMPTY;

  const sectionsForStudent = catalog.sectionsByStudentId[student.studentId] ?? [];
  const section = pickSection(sectionsForStudent, params.sectionId);

  return {
    studentId: student.studentId,
    sectionId: section?.sectionId ?? null,
    student,
    sectionsForStudent,
    section,
  };
}
