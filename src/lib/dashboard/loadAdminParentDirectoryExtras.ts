import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminStudentDirectoryParent, AdminStudentDirectorySection } from "@/lib/dashboard/loadAdminStudentDirectoryExtras";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export type AdminParentDirectoryExtras = {
  childrenByParent: Map<string, AdminStudentDirectoryParent[]>;
  sectionsByParent: Map<string, AdminStudentDirectorySection[]>;
};

type RelRow = { tutor_id: string; student_id: string };
type ProfileRow = { id: string; first_name: string | null; last_name: string | null };
type SectionJoin = { name: string | null; cohort_id: string | null };
type EnrollmentRow = {
  student_id: string;
  section_id: string;
  academic_sections: SectionJoin | SectionJoin[] | null;
};

export function emptyAdminParentDirectoryExtras(): AdminParentDirectoryExtras {
  return { childrenByParent: new Map(), sectionsByParent: new Map() };
}

export async function loadAdminParentDirectoryExtras(
  admin: SupabaseClient,
  parentIds: string[],
): Promise<AdminParentDirectoryExtras> {
  const ids = parentIds.filter((id) => id.trim().length > 0);
  if (ids.length === 0) return emptyAdminParentDirectoryExtras();

  const relResult = await admin
    .from("tutor_student_rel")
    .select("tutor_id, student_id")
    .in("tutor_id", ids);
  if (relResult.error) {
    logSupabaseClientError("loadAdminParentDirectoryExtras:tutor_student_rel", relResult.error, {
      parentCount: ids.length,
    });
  }

  const rels = (relResult.data ?? []) as RelRow[];
  const studentIds = [...new Set(rels.map((r) => String(r.student_id)).filter(Boolean))];
  const childrenByParent = new Map<string, AdminStudentDirectoryParent[]>();
  const sectionsByParent = new Map<string, AdminStudentDirectorySection[]>();

  if (studentIds.length === 0) return { childrenByParent, sectionsByParent };

  const [profileResult, enrollResult] = await Promise.all([
    admin.from("profiles").select("id, first_name, last_name").in("id", studentIds),
    admin
      .from("section_enrollments")
      .select("student_id, section_id, academic_sections(name, cohort_id)")
      .in("student_id", studentIds)
      .eq("status", "active"),
  ]);
  if (profileResult.error) {
    logSupabaseClientError("loadAdminParentDirectoryExtras:student_profiles", profileResult.error, {
      studentCount: studentIds.length,
    });
  }
  if (enrollResult.error) {
    logSupabaseClientError("loadAdminParentDirectoryExtras:section_enrollments", enrollResult.error, {
      studentCount: studentIds.length,
    });
  }

  const profileById = new Map<string, ProfileRow>();
  for (const p of (profileResult.data ?? []) as ProfileRow[]) {
    profileById.set(String(p.id), p);
  }

  for (const rel of rels) {
    const parentId = String(rel.tutor_id);
    const studentId = String(rel.student_id);
    const profile = profileById.get(studentId);
    const list = childrenByParent.get(parentId) ?? [];
    if (!list.some((c) => c.id === studentId)) {
      list.push({
        id: studentId,
        firstName: profile?.first_name?.trim() ?? "",
        lastName: profile?.last_name?.trim() ?? "",
      });
    }
    childrenByParent.set(parentId, list);
  }

  const sectionsByStudent = new Map<string, AdminStudentDirectorySection[]>();
  for (const raw of (enrollResult.data ?? []) as EnrollmentRow[]) {
    const studentId = String(raw.student_id);
    const sectionId = String(raw.section_id);
    const rawSec = raw.academic_sections;
    const sec = Array.isArray(rawSec) ? rawSec[0] : rawSec;
    const name = sec?.name?.trim() || sectionId;
    const list = sectionsByStudent.get(studentId) ?? [];
    if (!list.some((s) => s.id === sectionId)) {
      list.push({
        id: sectionId,
        name,
        cohortId: sec?.cohort_id?.trim() || null,
        discountPercent: null,
      });
    }
    sectionsByStudent.set(studentId, list);
  }

  for (const [parentId, children] of childrenByParent) {
    const seen = new Set<string>();
    const sections: AdminStudentDirectorySection[] = [];
    for (const child of children) {
      for (const section of sectionsByStudent.get(child.id) ?? []) {
        if (seen.has(section.id)) continue;
        seen.add(section.id);
        sections.push(section);
      }
    }
    sectionsByParent.set(parentId, sections);
  }

  return { childrenByParent, sectionsByParent };
}
