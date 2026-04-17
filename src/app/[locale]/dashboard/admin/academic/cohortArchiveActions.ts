"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { revalidateAcademicSurfaces } from "@/app/[locale]/dashboard/admin/academic/revalidatePaths";
import {
  logServerActionException,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";

const uuid = z.string().uuid();

const S = {
  archive: "archiveAcademicCohortAction",
  unarchive: "unarchiveAcademicCohortAction",
  deleteCohort: "deleteAcademicCohortAction",
} as const;

export async function archiveAcademicCohortAction(input: {
  locale: string;
  cohortId: string;
}): Promise<
  { ok: true } | { ok: false; code: "parse" | "is_current" | "open_sections" | "save" }
> {
  const cohortId = uuid.safeParse(input.cohortId.trim());
  if (!cohortId.success) return { ok: false, code: "parse" };

  try {
    const { supabase } = await assertAdmin();

    const { data: cohort, error: cErr } = await supabase
      .from("academic_cohorts")
      .select("id, is_current")
      .eq("id", cohortId.data)
      .maybeSingle();

    if (cErr || !cohort?.id) {
      if (cErr) logSupabaseClientError(S.archive, cErr, { cohortId: cohortId.data, step: "load" });
      return { ok: false, code: "save" };
    }
    if (Boolean((cohort as { is_current?: boolean }).is_current)) {
      return { ok: false, code: "is_current" };
    }

    const { count, error: oErr } = await supabase
      .from("academic_sections")
      .select("id", { count: "exact", head: true })
      .eq("cohort_id", cohortId.data)
      .is("archived_at", null);

    if (oErr) {
      logSupabaseClientError(S.archive, oErr, { cohortId: cohortId.data, step: "count_open_sections" });
      return { ok: false, code: "save" };
    }
    if ((count ?? 0) > 0) return { ok: false, code: "open_sections" };

    const { error } = await supabase
      .from("academic_cohorts")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", cohortId.data)
      .is("archived_at", null);

    if (error) {
      logSupabaseClientError(S.archive, error, { cohortId: cohortId.data });
      return { ok: false, code: "save" };
    }

    void recordSystemAudit({
      action: "academic_cohort_archived",
      resourceType: "academic_cohort",
      resourceId: cohortId.data,
      payload: {},
    });

    revalidateAcademicSurfaces(input.locale);
    revalidatePath(`/${input.locale}/dashboard/admin/academic`, "page");
    revalidatePath(`/${input.locale}/dashboard/admin/academic/${cohortId.data}`, "page");
    return { ok: true };
  } catch (err) {
    logServerActionException(S.archive, err, { cohortId: input.cohortId.trim() || undefined });
    return { ok: false, code: "save" };
  }
}

export async function unarchiveAcademicCohortAction(input: {
  locale: string;
  cohortId: string;
}): Promise<{ ok: true } | { ok: false; code: "parse" | "save" }> {
  const cohortId = uuid.safeParse(input.cohortId.trim());
  if (!cohortId.success) return { ok: false, code: "parse" };

  try {
    const { supabase } = await assertAdmin();

    const { error } = await supabase
      .from("academic_cohorts")
      .update({ archived_at: null })
      .eq("id", cohortId.data);

    if (error) {
      logSupabaseClientError(S.unarchive, error, { cohortId: cohortId.data });
      return { ok: false, code: "save" };
    }

    void recordSystemAudit({
      action: "academic_cohort_unarchived",
      resourceType: "academic_cohort",
      resourceId: cohortId.data,
      payload: {},
    });

    revalidateAcademicSurfaces(input.locale);
    revalidatePath(`/${input.locale}/dashboard/admin/academic`, "page");
    revalidatePath(`/${input.locale}/dashboard/admin/academic/${cohortId.data}`, "page");
    return { ok: true };
  } catch (err) {
    logServerActionException(S.unarchive, err, { cohortId: input.cohortId.trim() || undefined });
    return { ok: false, code: "save" };
  }
}

export async function deleteAcademicCohortAction(input: {
  locale: string;
  cohortId: string;
}): Promise<
  { ok: true } | { ok: false; code: "parse" | "is_current" | "enrollments_exist" | "save" }
> {
  const cohortId = uuid.safeParse(input.cohortId.trim());
  if (!cohortId.success) return { ok: false, code: "parse" };

  try {
    const { supabase } = await assertAdmin();

    const { data: cohort, error: cErr } = await supabase
      .from("academic_cohorts")
      .select("id, is_current")
      .eq("id", cohortId.data)
      .maybeSingle();

    if (cErr || !cohort?.id) {
      if (cErr) logSupabaseClientError(S.deleteCohort, cErr, { cohortId: cohortId.data, step: "load" });
      return { ok: false, code: "save" };
    }
    if (Boolean((cohort as { is_current?: boolean }).is_current)) {
      return { ok: false, code: "is_current" };
    }

    const { data: sectionRows, error: sErr } = await supabase
      .from("academic_sections")
      .select("id")
      .eq("cohort_id", cohortId.data);

    if (sErr) {
      logSupabaseClientError(S.deleteCohort, sErr, { cohortId: cohortId.data, step: "list_sections" });
      return { ok: false, code: "save" };
    }

    const sectionIds = (sectionRows ?? []).map((r) => (r as { id: string }).id);
    if (sectionIds.length > 0) {
      const chunk = 200;
      let enrollmentTotal = 0;
      for (let i = 0; i < sectionIds.length; i += chunk) {
        const batch = sectionIds.slice(i, i + chunk);
        const { count, error: eErr } = await supabase
          .from("section_enrollments")
          .select("id", { count: "exact", head: true })
          .in("section_id", batch);

        if (eErr) {
          logSupabaseClientError(S.deleteCohort, eErr, { cohortId: cohortId.data, step: "count_enrollments" });
          return { ok: false, code: "save" };
        }
        enrollmentTotal += count ?? 0;
      }
      if (enrollmentTotal > 0) return { ok: false, code: "enrollments_exist" };
    }

    const { error: dErr } = await supabase.from("academic_cohorts").delete().eq("id", cohortId.data);

    if (dErr) {
      logSupabaseClientError(S.deleteCohort, dErr, { cohortId: cohortId.data });
      return { ok: false, code: "save" };
    }

    void recordSystemAudit({
      action: "academic_cohort_deleted",
      resourceType: "academic_cohort",
      resourceId: cohortId.data,
      payload: {},
    });

    revalidateAcademicSurfaces(input.locale);
    revalidatePath(`/${input.locale}/dashboard/admin/academic`, "page");
    revalidatePath(`/${input.locale}/dashboard/admin/academic/${cohortId.data}`, "page");
    return { ok: true };
  } catch (err) {
    logServerActionException(S.deleteCohort, err, { cohortId: input.cohortId.trim() || undefined });
    return { ok: false, code: "save" };
  }
}
