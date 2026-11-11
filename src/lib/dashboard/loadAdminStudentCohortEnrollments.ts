import type { SupabaseClient } from "@supabase/supabase-js";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import {
  STUDENT_FICHA_COHORT_LIST_FAILED,
  type StudentFichaCohortEnrollment,
  type StudentFichaCohortStaff,
} from "@/lib/dashboard/studentFichaCohort";

const PAGE_SIZE = 1000;

type CohortCell = { id?: string | null; name?: string | null; is_current?: boolean | null };
type SectionCell = {
  name?: string | null;
  teacher_id?: string | null;
  academic_cohorts?: CohortCell | CohortCell[] | null;
};
type EnrollmentRow = {
  id: string;
  status: string;
  created_at: string | null;
  section_id: string;
  academic_sections: SectionCell | SectionCell[] | null;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

async function loadNameMap(
  supabase: SupabaseClient,
  ids: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .in("id", unique);
  if (error) {
    logSupabaseClientError("loadAdminStudentCohortOptions:names", error);
    return new Map();
  }
  return new Map(
    ((data ?? []) as Array<{ id: string; first_name: string | null; last_name: string | null }>).map(
      (row) => [row.id, formatProfileNameSurnameFirst(row.first_name, row.last_name, "—")],
    ),
  );
}

function staff(id: string | null | undefined, names: Map<string, string>): StudentFichaCohortStaff | null {
  if (!id) return null;
  return { id, name: names.get(id) ?? "—" };
}

export async function loadAdminStudentCohortEnrollments(
  supabase: SupabaseClient,
  studentId: string,
): Promise<{ enrollments: StudentFichaCohortEnrollment[]; code: string | null }> {
  const rows: EnrollmentRow[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("section_enrollments")
      .select(
        "id, status, created_at, section_id, academic_sections(name, teacher_id, academic_cohorts(id, name, is_current))",
      )
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) {
      logSupabaseClientError("loadAdminStudentCohortOptions", error, {
        studentId,
        code: STUDENT_FICHA_COHORT_LIST_FAILED,
      });
      return { enrollments: [], code: STUDENT_FICHA_COHORT_LIST_FAILED };
    }
    const page = (data ?? []) as EnrollmentRow[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  const sectionIds = [...new Set(rows.map((row) => row.section_id))];
  const assistantRows: Array<{ section_id: string; assistant_id: string }> = [];
  if (sectionIds.length > 0) {
    const { data, error } = await supabase
      .from("academic_section_assistants")
      .select("section_id, assistant_id")
      .in("section_id", sectionIds);
    if (error) {
      logSupabaseClientError("loadAdminStudentCohortOptions:assistants", error, { studentId });
    } else {
      assistantRows.push(...((data ?? []) as Array<{ section_id: string; assistant_id: string }>));
    }
  }

  const teacherIds = rows.flatMap((row) => {
    const section = one(row.academic_sections);
    return section?.teacher_id ? [section.teacher_id] : [];
  });
  const names = await loadNameMap(supabase, [
    ...teacherIds,
    ...assistantRows.map((row) => row.assistant_id),
  ]);
  const assistantsBySection = new Map<string, StudentFichaCohortStaff[]>();
  for (const row of assistantRows) {
    const person = staff(row.assistant_id, names);
    if (!person) continue;
    const list = assistantsBySection.get(row.section_id) ?? [];
    list.push(person);
    assistantsBySection.set(row.section_id, list);
  }

  const enrollments = rows.flatMap((row) => {
    const section = one(row.academic_sections);
    const cohort = one(section?.academic_cohorts);
    const cohortId = cohort?.id ? String(cohort.id) : "";
    if (!cohortId) return [];
    return [
      {
        enrollmentId: row.id,
        cohortId,
        cohortName: String(cohort?.name ?? ""),
        isCurrent: cohort?.is_current === true,
        sectionId: row.section_id,
        sectionName: String(section?.name ?? row.section_id),
        status: String(row.status ?? ""),
        createdAt: row.created_at ?? "",
        teacher: staff(section?.teacher_id, names),
        assistants: assistantsBySection.get(row.section_id) ?? [],
      },
    ];
  });

  return { enrollments, code: null };
}
