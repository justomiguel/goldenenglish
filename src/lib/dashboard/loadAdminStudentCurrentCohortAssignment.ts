import type { SupabaseClient } from "@supabase/supabase-js";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { getDefaultSectionMaxStudents } from "@/lib/academics/getDefaultSectionMaxStudents";
import { loadCurrentCohort } from "@/lib/academics/currentCohort";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export type AdminStudentCurrentCohortSectionOption = {
  id: string;
  name: string;
  teacherName: string;
  activeCount: number;
  maxStudents: number;
};

export type AdminStudentCurrentCohortEnrollment = {
  enrollmentId: string;
  sectionId: string;
  sectionName: string;
};

export type AdminStudentCurrentCohortAssignment = {
  cohortId: string | null;
  cohortName: string | null;
  sections: AdminStudentCurrentCohortSectionOption[];
  /** @deprecated Use `currentSections` instead. Kept for backward compat. */
  current: AdminStudentCurrentCohortEnrollment | null;
  /** All active enrollments for this student in the current cohort. */
  currentSections: AdminStudentCurrentCohortEnrollment[];
  hasMultipleCurrentAssignments: boolean;
};

type SectionRow = {
  id: string;
  name: string;
  max_students: number | null;
  teacher_id: string | null;
};

async function loadTeacherNameMap(
  supabase: SupabaseClient,
  teacherIds: string[],
): Promise<Map<string, string>> {
  const ids = [...new Set(teacherIds.filter(Boolean))];
  if (ids.length === 0) return new Map();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .in("id", ids);

  if (error) {
    logSupabaseClientError("loadAdminStudentCurrentCohortAssignment:teachers", error);
    return new Map();
  }

  return new Map(
    ((data ?? []) as Array<{ id: string; first_name: string | null; last_name: string | null }>).map((row) => [
      row.id,
      formatProfileNameSurnameFirst(row.first_name, row.last_name, "—"),
    ]),
  );
}

export async function loadAdminStudentCurrentCohortAssignment(
  supabase: SupabaseClient,
  studentId: string,
): Promise<AdminStudentCurrentCohortAssignment> {
  const cohort = await loadCurrentCohort(supabase);
  if (!cohort) {
    return {
      cohortId: null,
      cohortName: null,
      sections: [],
      current: null,
      currentSections: [],
      hasMultipleCurrentAssignments: false,
    };
  }

  const { data: sectionRows, error: sectionError } = await supabase
    .from("academic_sections")
    .select("id, name, max_students, teacher_id")
    .eq("cohort_id", cohort.id)
    .is("archived_at", null)
    .order("name", { ascending: true });

  if (sectionError) {
    logSupabaseClientError("loadAdminStudentCurrentCohortAssignment:sections", sectionError, {
      cohortId: cohort.id,
    });
  }

  const sectionsRaw = (sectionRows ?? []) as SectionRow[];
  const sectionIds = sectionsRaw.map((section) => section.id);
  if (sectionIds.length === 0) {
    return {
      cohortId: cohort.id,
      cohortName: cohort.name,
      sections: [],
      current: null,
      currentSections: [],
      hasMultipleCurrentAssignments: false,
    };
  }

  const [countResult, studentResult, teacherNameMap] = await Promise.all([
    supabase
      .from("section_enrollments")
      .select("section_id")
      .in("section_id", sectionIds)
      .eq("status", "active"),
    supabase
      .from("section_enrollments")
      .select("id, section_id")
      .in("section_id", sectionIds)
      .eq("student_id", studentId)
      .eq("status", "active"),
    loadTeacherNameMap(
      supabase,
      sectionsRaw.map((section) => section.teacher_id ?? ""),
    ),
  ]);

  const countMap = new Map<string, number>();
  for (const row of (countResult.data ?? []) as Array<{ section_id: string }>) {
    countMap.set(row.section_id, (countMap.get(row.section_id) ?? 0) + 1);
  }

  const defaultMax = getDefaultSectionMaxStudents();
  const sections = sectionsRaw.map((section) => ({
    id: section.id,
    name: section.name,
    teacherName: section.teacher_id ? (teacherNameMap.get(section.teacher_id) ?? "—") : "—",
    activeCount: countMap.get(section.id) ?? 0,
    maxStudents: section.max_students ?? defaultMax,
  }));
  const sectionNameById = new Map(sections.map((section) => [section.id, section.name]));
  const activeRows = (studentResult.data ?? []) as Array<{ id: string; section_id: string }>;
  const currentSections: AdminStudentCurrentCohortEnrollment[] = activeRows.map((row) => ({
    enrollmentId: row.id,
    sectionId: row.section_id,
    sectionName: sectionNameById.get(row.section_id) ?? row.section_id,
  }));

  return {
    cohortId: cohort.id,
    cohortName: cohort.name,
    sections,
    current: currentSections[0] ?? null,
    currentSections,
    hasMultipleCurrentAssignments: activeRows.length > 1,
  };
}
