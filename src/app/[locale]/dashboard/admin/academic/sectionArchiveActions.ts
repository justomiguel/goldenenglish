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
import { cancelReminderJobsForSectionId } from "@/lib/notifications/cancelReminderJobsAdmin";

const uuid = z.string().uuid();

const S = {
  archive: "archiveAcademicSectionAction",
  unarchive: "unarchiveAcademicSectionAction",
  deleteSection: "deleteAcademicSectionAction",
} as const;

export async function archiveAcademicSectionAction(input: {
  locale: string;
  sectionId: string;
}): Promise<{ ok: true } | { ok: false; code: "parse" | "active_enrollments" | "save" }> {
  const sectionId = uuid.safeParse(input.sectionId.trim());
  if (!sectionId.success) return { ok: false, code: "parse" };

  try {
    const { supabase } = await assertAdmin();

    const { count, error: cErr } = await supabase
      .from("section_enrollments")
      .select("id", { count: "exact", head: true })
      .eq("section_id", sectionId.data)
      .eq("status", "active");

    if (cErr) {
      logSupabaseClientError(S.archive, cErr, { sectionId: sectionId.data, step: "count_active" });
      return { ok: false, code: "save" };
    }
    if ((count ?? 0) > 0) return { ok: false, code: "active_enrollments" };

    const { data: row, error } = await supabase
      .from("academic_sections")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", sectionId.data)
      .is("archived_at", null)
      .select("id, cohort_id")
      .maybeSingle();

    const sec = row as { id: string; cohort_id: string } | null;
    if (error || !sec?.cohort_id) {
      if (error) logSupabaseClientError(S.archive, error, { sectionId: sectionId.data });
      return { ok: false, code: "save" };
    }

    await cancelReminderJobsForSectionId(sec.id, S.archive);

    void recordSystemAudit({
      action: "academic_section_archived",
      resourceType: "academic_section",
      resourceId: sec.id,
      payload: { cohort_id: sec.cohort_id },
    });

    revalidateAcademicSurfaces(input.locale);
    revalidatePath(`/${input.locale}/dashboard/admin/academic`, "page");
    revalidatePath(`/${input.locale}/dashboard/admin/academic/${sec.cohort_id}`, "page");
    revalidatePath(`/${input.locale}/dashboard/admin/academic/${sec.cohort_id}/${sec.id}`, "page");
    return { ok: true };
  } catch (err) {
    logServerActionException(S.archive, err, { sectionId: input.sectionId.trim() || undefined });
    return { ok: false, code: "save" };
  }
}

export async function unarchiveAcademicSectionAction(input: {
  locale: string;
  sectionId: string;
}): Promise<{ ok: true } | { ok: false; code: "parse" | "cohort_archived" | "save" }> {
  const sectionId = uuid.safeParse(input.sectionId.trim());
  if (!sectionId.success) return { ok: false, code: "parse" };

  try {
    const { supabase } = await assertAdmin();

    const { data: sec, error: sErr } = await supabase
      .from("academic_sections")
      .select("id, cohort_id, academic_cohorts(archived_at)")
      .eq("id", sectionId.data)
      .maybeSingle();

    if (sErr || !sec) {
      if (sErr) logSupabaseClientError(S.unarchive, sErr, { sectionId: sectionId.data, step: "load" });
      return { ok: false, code: "save" };
    }

    const cohortRel = (sec as { academic_cohorts: { archived_at: string | null } | { archived_at: string | null }[] | null })
      .academic_cohorts;
    const cohortArchivedAt = Array.isArray(cohortRel)
      ? (cohortRel[0]?.archived_at ?? null)
      : (cohortRel?.archived_at ?? null);
    if (cohortArchivedAt != null) return { ok: false, code: "cohort_archived" };

    const { data: row, error } = await supabase
      .from("academic_sections")
      .update({ archived_at: null })
      .eq("id", sectionId.data)
      .select("id, cohort_id")
      .maybeSingle();

    const updated = row as { id: string; cohort_id: string } | null;
    if (error || !updated?.cohort_id) {
      if (error) logSupabaseClientError(S.unarchive, error, { sectionId: sectionId.data });
      return { ok: false, code: "save" };
    }

    void recordSystemAudit({
      action: "academic_section_unarchived",
      resourceType: "academic_section",
      resourceId: updated.id,
      payload: { cohort_id: updated.cohort_id },
    });

    revalidateAcademicSurfaces(input.locale);
    revalidatePath(`/${input.locale}/dashboard/admin/academic`, "page");
    revalidatePath(`/${input.locale}/dashboard/admin/academic/${updated.cohort_id}`, "page");
    revalidatePath(`/${input.locale}/dashboard/admin/academic/${updated.cohort_id}/${updated.id}`, "page");
    return { ok: true };
  } catch (err) {
    logServerActionException(S.unarchive, err, { sectionId: input.sectionId.trim() || undefined });
    return { ok: false, code: "save" };
  }
}

export async function deleteAcademicSectionAction(input: {
  locale: string;
  sectionId: string;
}): Promise<
  { ok: true; cohortId: string } | { ok: false; code: "parse" | "enrollments_exist" | "save" }
> {
  const sectionId = uuid.safeParse(input.sectionId.trim());
  if (!sectionId.success) return { ok: false, code: "parse" };

  try {
    const { supabase } = await assertAdmin();

    const { data: head, error: hErr } = await supabase
      .from("academic_sections")
      .select("id, cohort_id")
      .eq("id", sectionId.data)
      .maybeSingle();

    if (hErr || !head?.cohort_id) {
      if (hErr) logSupabaseClientError(S.deleteSection, hErr, { sectionId: sectionId.data, step: "load" });
      return { ok: false, code: "save" };
    }
    const cohortId = (head as { cohort_id: string }).cohort_id;

    const { count, error: cErr } = await supabase
      .from("section_enrollments")
      .select("id", { count: "exact", head: true })
      .eq("section_id", sectionId.data);

    if (cErr) {
      logSupabaseClientError(S.deleteSection, cErr, { sectionId: sectionId.data, step: "count_enrollments" });
      return { ok: false, code: "save" };
    }
    if ((count ?? 0) > 0) return { ok: false, code: "enrollments_exist" };

    const { error: dErr } = await supabase.from("academic_sections").delete().eq("id", sectionId.data);

    if (dErr) {
      logSupabaseClientError(S.deleteSection, dErr, { sectionId: sectionId.data });
      return { ok: false, code: "save" };
    }

    void recordSystemAudit({
      action: "academic_section_deleted",
      resourceType: "academic_section",
      resourceId: sectionId.data,
      payload: { cohort_id: cohortId },
    });

    revalidateAcademicSurfaces(input.locale);
    revalidatePath(`/${input.locale}/dashboard/admin/academic`, "page");
    revalidatePath(`/${input.locale}/dashboard/admin/academic/${cohortId}`, "page");
    revalidatePath(`/${input.locale}/dashboard/admin/academic/${cohortId}/${sectionId.data}`, "page");
    return { ok: true, cohortId };
  } catch (err) {
    logServerActionException(S.deleteSection, err, { sectionId: input.sectionId.trim() || undefined });
    return { ok: false, code: "save" };
  }
}
