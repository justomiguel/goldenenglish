import type { SupabaseClient } from "@supabase/supabase-js";
import { listTutorStudentsWithFinance } from "@/lib/auth/listTutorStudentsWithFinance";
import type {
  ParentFocusCatalog,
  ParentFocusSectionOption,
} from "@/lib/parent/parentFocusTypes";

type CohortCell = { name: string } | { name: string }[] | null;

function cohortName(raw: CohortCell): string {
  if (!raw) return "";
  return Array.isArray(raw) ? (raw[0]?.name ?? "") : raw.name;
}

function classLabelFor(sectionName: string, cohort: CohortCell): string {
  const name = sectionName.trim();
  const cn = cohortName(cohort).trim();
  return cn ? `${cn} — ${name}` : name;
}

/**
 * Linked wards + their active academic sections for parent focus chrome.
 */
export async function loadParentFocusCatalog(
  supabase: SupabaseClient,
  tutorId: string,
): Promise<ParentFocusCatalog> {
  if (!tutorId) {
    return { students: [], sectionsByStudentId: {} };
  }

  const wards = await listTutorStudentsWithFinance(supabase, tutorId);
  const students = wards.map((w) => ({
    studentId: w.studentId,
    displayName: w.displayName,
  }));
  if (students.length === 0) {
    return { students: [], sectionsByStudentId: {} };
  }

  const studentIds = students.map((s) => s.studentId);
  const { data: enr } = await supabase
    .from("section_enrollments")
    .select("student_id, section_id")
    .in("student_id", studentIds)
    .eq("status", "active");

  const sectionIds = [...new Set((enr ?? []).map((e) => e.section_id as string))];
  const sectionMeta = new Map<string, { name: string; cohort: CohortCell }>();
  if (sectionIds.length > 0) {
    const { data: secs } = await supabase
      .from("academic_sections")
      .select("id, name, academic_cohorts(name)")
      .in("id", sectionIds);
    for (const s of secs ?? []) {
      sectionMeta.set(s.id as string, {
        name: (s.name as string) ?? "",
        cohort: s.academic_cohorts as CohortCell,
      });
    }
  }

  const sectionsByStudentId: Record<string, ParentFocusSectionOption[]> = {};
  for (const row of enr ?? []) {
    const studentId = row.student_id as string;
    const sectionId = row.section_id as string;
    const meta = sectionMeta.get(sectionId);
    if (!meta) continue;
    const option: ParentFocusSectionOption = {
      sectionId,
      classLabel: classLabelFor(meta.name, meta.cohort),
    };
    const list = sectionsByStudentId[studentId] ?? [];
    if (!list.some((s) => s.sectionId === sectionId)) {
      list.push(option);
      sectionsByStudentId[studentId] = list;
    }
  }

  for (const studentId of Object.keys(sectionsByStudentId)) {
    sectionsByStudentId[studentId].sort((a, b) => {
      const byLabel = a.classLabel.localeCompare(b.classLabel, undefined, {
        sensitivity: "base",
      });
      return byLabel !== 0 ? byLabel : a.sectionId.localeCompare(b.sectionId);
    });
  }

  return { students, sectionsByStudentId };
}
