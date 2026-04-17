"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { revalidateAcademicSurfaces } from "@/app/[locale]/dashboard/admin/academic/revalidatePaths";
import { validateSectionPeriodAgainstCohort } from "@/lib/academics/validateSectionPeriodAgainstCohort";
import {
  logServerActionException,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";
import { cancelReminderJobsForSectionId } from "@/lib/notifications/cancelReminderJobsAdmin";

const uuid = z.string().uuid();

const S = "updateAcademicSectionPeriodAction" as const;

export type UpdateSectionPeriodCode = "PARSE" | "ORDER" | "SAVE";

export async function updateAcademicSectionPeriodAction(input: {
  locale: string;
  sectionId: string;
  startsOn: string;
  endsOn: string;
}): Promise<{ ok: true } | { ok: false; code: UpdateSectionPeriodCode }> {
  const sectionId = uuid.safeParse(input.sectionId.trim());
  if (!sectionId.success) return { ok: false, code: "PARSE" };

  try {
    const { supabase } = await assertAdmin();

    const { data: sec, error: secErr } = await supabase
      .from("academic_sections")
      .select("id, cohort_id")
      .eq("id", sectionId.data)
      .maybeSingle();

    if (secErr || !sec) {
      if (secErr) logSupabaseClientError(`${S}:select`, secErr, { sectionId: sectionId.data });
      return { ok: false, code: "SAVE" };
    }

    const row = sec as { cohort_id: string };

    const v = validateSectionPeriodAgainstCohort({
      sectionStartsOn: input.startsOn,
      sectionEndsOn: input.endsOn,
    });
    if (!v.ok) return { ok: false, code: v.code };

    const { error: upErr } = await supabase
      .from("academic_sections")
      .update({
        starts_on: input.startsOn.trim(),
        ends_on: input.endsOn.trim(),
      })
      .eq("id", sectionId.data);

    if (upErr) {
      logSupabaseClientError(`${S}:update`, upErr, { sectionId: sectionId.data });
      return { ok: false, code: "SAVE" };
    }

    await cancelReminderJobsForSectionId(sectionId.data, S);

    void recordSystemAudit({
      action: "academic_section_period_updated",
      resourceType: "academic_section",
      resourceId: sectionId.data,
      payload: {
        cohort_id: row.cohort_id,
        starts_on: input.startsOn.trim(),
        ends_on: input.endsOn.trim(),
      },
    });

    revalidateAcademicSurfaces(input.locale);
    revalidatePath(`/${input.locale}/dashboard/admin/academic/${row.cohort_id}`, "page");
    revalidatePath(`/${input.locale}/dashboard/admin/academic/${row.cohort_id}/${sectionId.data}`, "page");
    return { ok: true };
  } catch (err) {
    logServerActionException(S, err, { sectionId: input.sectionId.trim() });
    return { ok: false, code: "SAVE" };
  }
}
