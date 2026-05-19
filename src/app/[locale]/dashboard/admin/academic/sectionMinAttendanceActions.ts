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
const minSchema = z.number().int().min(0).max(100).nullable();

const S = "updateAcademicSectionMinAttendanceAction" as const;

export type UpdateSectionMinAttendanceCode = "PARSE" | "SAVE";

export async function updateAcademicSectionMinAttendanceAction(input: {
  locale: string;
  sectionId: string;
  minAttendancePercent: number | null;
}): Promise<{ ok: true } | { ok: false; code: UpdateSectionMinAttendanceCode }> {
  const sectionId = uuid.safeParse(input.sectionId.trim());
  const minParsed = minSchema.safeParse(input.minAttendancePercent);
  if (!sectionId.success || !minParsed.success) return { ok: false, code: "PARSE" };

  try {
    const { supabase } = await assertAdmin();

    const { data: row, error: upErr } = await supabase
      .from("academic_sections")
      .update({ min_attendance_percent: minParsed.data })
      .eq("id", sectionId.data)
      .select("id, cohort_id")
      .maybeSingle();

    const section = row as { id: string; cohort_id: string } | null;
    if (upErr || !section?.id) {
      if (upErr) logSupabaseClientError(`${S}:update`, upErr, { sectionId: sectionId.data });
      return { ok: false, code: "SAVE" };
    }

    void recordSystemAudit({
      action: "academic_section_min_attendance_updated",
      resourceType: "academic_section",
      resourceId: section.id,
      payload: {
        cohort_id: section.cohort_id,
        min_attendance_percent: minParsed.data,
      },
    });

    revalidateAcademicSurfaces(input.locale);
    revalidatePath(`/${input.locale}/dashboard/admin/academic/${section.cohort_id}`, "page");
    revalidatePath(
      `/${input.locale}/dashboard/admin/academic/${section.cohort_id}/${section.id}`,
      "page",
    );
    revalidatePath(`/${input.locale}/dashboard/parent`, "page");
    revalidatePath(`/${input.locale}/dashboard/parent/calendar`, "page");
    return { ok: true };
  } catch (err) {
    logServerActionException(S, err, { sectionId: input.sectionId.trim() });
    return { ok: false, code: "SAVE" };
  }
}
