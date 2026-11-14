"use server";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { revalidateAcademicSurfaces } from "@/app/[locale]/dashboard/admin/academic/revalidatePaths";
import {
  logServerActionException,
  logServerWarn,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";
import {
  searchAdminStudentsByPrefix,
  type AdminStudentSearchHit,
} from "@/lib/users/searchAdminStudentsByPrefix";
import { formatProfileSnakeSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { parseNewCohortDraft } from "@/lib/academics/parseNewCohortDraft";
import { copyCohortSectionStructureAction } from "@/app/[locale]/dashboard/admin/academic/copyCohortSectionsActions";
import type { SupabaseClient } from "@supabase/supabase-js";

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

async function nextFreeCohortSlug(
  supabase: SupabaseClient,
  base: string,
): Promise<string | null> {
  for (let i = 0; i < 20; i += 1) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const { data, error } = await supabase
      .from("academic_cohorts")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (error) return null;
    if (!data) return candidate;
  }
  return null;
}

export async function createAcademicCohortAction(input: {
  locale: string;
  name: string;
  chargesEnrollmentFee: boolean;
  enrollmentFeeAmount: string;
  chargesMonthlyFee: boolean;
  monthlyFeeAmount: string;
  copySections: boolean;
  sourceCohortId: string;
  copyStudents: boolean;
}): Promise<{ ok: true; id: string } | { ok: false; code: string; cohortId?: string }> {
  const draft = parseNewCohortDraft(input);
  if (!draft.ok) return { ok: false, code: draft.code };

  try {
    const { supabase } = await assertAdmin();
    const slug = await nextFreeCohortSlug(supabase, draft.slugBase);
    if (!slug) {
      logServerWarn(S.createCohort, { code: "save", reason: "slug_unavailable" });
      return { ok: false, code: "save" };
    }

    const { data, error } = await supabase
      .from("academic_cohorts")
      .insert({
        name: draft.name,
        slug,
        default_enrollment_fee_amount: draft.enrollmentFeeAmount,
        default_monthly_fee: draft.monthlyFeeAmount,
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      if (error) logSupabaseClientError(S.createCohort, error, { code: "save" });
      return { ok: false, code: "save" };
    }

    const cohortId = data.id as string;
    void recordSystemAudit({
      action: "academic_cohort_created",
      resourceType: "academic_cohort",
      resourceId: cohortId,
      payload: {
        name: draft.name,
        charges_enrollment_fee: draft.enrollmentFeeAmount != null,
        charges_monthly_fee: draft.monthlyFeeAmount != null,
        copied_from: draft.sourceCohortId,
        copy_students: draft.copyStudents,
      },
    });

    if (draft.sourceCohortId) {
      const copied = await copyCohortSectionStructureAction({
        locale: input.locale,
        sourceCohortId: draft.sourceCohortId,
        targetCohortId: cohortId,
        includeStudents: draft.copyStudents,
      });
      if (!copied.ok) {
        logServerWarn(S.createCohort, {
          code: "copy_failed",
          cohortId,
          copyCode: copied.code,
        });
        return { ok: false, code: "copy_failed", cohortId };
      }
    }

    revalidateAcademicSurfaces(input.locale);
    return { ok: true, id: cohortId };
  } catch (err) {
    logServerActionException(S.createCohort, err, { code: "save" });
    return { ok: false, code: "save" };
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
