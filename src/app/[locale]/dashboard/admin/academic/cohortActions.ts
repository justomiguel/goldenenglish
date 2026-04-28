"use server";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { revalidateAcademicSurfaces } from "@/app/[locale]/dashboard/admin/academic/revalidatePaths";
import {
  logServerActionException,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";
import {
  searchAdminStudentsByPrefix,
  type AdminStudentSearchHit,
} from "@/lib/users/searchAdminStudentsByPrefix";
import { formatProfileSnakeSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

export type { AdminStudentSearchHit };

const S = {
  setCurrentCohort: "setCurrentCohortAction",
  createCohort: "createAcademicCohortAction",
  listActiveStudents: "listActiveStudentsInSectionForAdmin",
  searchStudents: "searchAdminStudentsAction",
} as const;


export async function setCurrentCohortAction(input: {
  cohortId: string;
  locale: string;
}): Promise<{ ok: true } | { ok: false }> {
  try {
    const { supabase } = await assertAdmin();
    const id = input.cohortId.trim();
    if (!id) return { ok: false };

    const { error: clearErr } = await supabase
      .from("academic_cohorts")
      .update({ is_current: false })
      .eq("is_current", true);
    if (clearErr) {
      logSupabaseClientError(S.setCurrentCohort, clearErr, { step: "clear_current" });
      return { ok: false };
    }

    const { error: setErr } = await supabase
      .from("academic_cohorts")
      .update({ is_current: true })
      .eq("id", id);
    if (setErr) {
      logSupabaseClientError(S.setCurrentCohort, setErr, { step: "set_current", cohortId: id });
      return { ok: false };
    }

    void recordSystemAudit({
      action: "academic_cohort_set_current",
      resourceType: "academic_cohort",
      resourceId: id,
      payload: {},
    });

    revalidateAcademicSurfaces(input.locale);
    return { ok: true };
  } catch (err) {
    logServerActionException(S.setCurrentCohort, err, { cohortId: input.cohortId.trim() || undefined });
    return { ok: false };
  }
}

export async function createAcademicCohortAction(input: {
  locale: string;
  name: string;
  slug?: string | null;
}): Promise<{ ok: true; id: string } | { ok: false }> {
  try {
    const { supabase } = await assertAdmin();
    const name = input.name.trim();
    if (name.length < 2) return { ok: false };

    const slug = input.slug?.trim() || null;
    const { data, error } = await supabase
      .from("academic_cohorts")
      .insert({
        name,
        slug: slug || null,
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      if (error) logSupabaseClientError(S.createCohort, error, { nameLen: name.length });
      return { ok: false };
    }

    void recordSystemAudit({
      action: "academic_cohort_created",
      resourceType: "academic_cohort",
      resourceId: data.id as string,
      payload: { name },
    });

    revalidateAcademicSurfaces(input.locale);
    return { ok: true, id: data.id as string };
  } catch (err) {
    logServerActionException(S.createCohort, err);
    return { ok: false };
  }
}

export type SectionStudentPick = {
  enrollmentId: string;
  studentId: string;
  label: string;
};

export async function listActiveStudentsInSectionForAdmin(
  sectionId: string,
): Promise<SectionStudentPick[]> {
  try {
    const { supabase } = await assertAdmin();
    const sid = sectionId.trim();
    if (!sid) return [];

    const { data, error } = await supabase
      .from("section_enrollments")
      .select("id, student_id, profiles!student_id(first_name,last_name)")
      .eq("section_id", sid)
      .eq("status", "active");

    if (error || !data) {
      if (error) logSupabaseClientError(S.listActiveStudents, error, { sectionId: sid });
      return [];
    }

    return data.map((row) => {
      const r = row as {
        id: string;
        student_id: string;
        profiles: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null;
      };
      const pRaw = r.profiles;
      const p = Array.isArray(pRaw) ? (pRaw[0] ?? null) : pRaw;
      const label = p ? formatProfileSnakeSurnameFirst(p, r.student_id) : r.student_id;
      return { enrollmentId: r.id, studentId: r.student_id, label };
    });
  } catch (err) {
    logServerActionException(S.listActiveStudents, err, { sectionId: sectionId.trim() || undefined });
    return [];
  }
}

export async function searchAdminStudentsAction(query: string): Promise<AdminStudentSearchHit[]> {
  try {
    const { supabase } = await assertAdmin();
    return await searchAdminStudentsByPrefix(supabase, query);
  } catch (err) {
    logServerActionException(S.searchStudents, err, { queryLen: query.trim().length });
    return [];
  }
}
