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
const maxStudentsSchema = z.number().int().min(1).max(999);

const S = "updateAcademicSectionMaxStudentsAction" as const;

export type UpdateSectionMaxStudentsCode = "PARSE" | "BELOW_ACTIVE" | "SAVE";

export async function updateAcademicSectionMaxStudentsAction(input: {
  locale: string;
  sectionId: string;
  maxStudents: number;
}): Promise<{ ok: true } | { ok: false; code: UpdateSectionMaxStudentsCode }> {
  const sectionId = uuid.safeParse(input.sectionId.trim());
  const maxParsed = maxStudentsSchema.safeParse(input.maxStudents);
  if (!sectionId.success || !maxParsed.success) return { ok: false, code: "PARSE" };

  try {
    const { supabase } = await assertAdmin();

    const { count, error: cntErr } = await supabase
      .from("section_enrollments")
      .select("id", { count: "exact", head: true })
      .eq("section_id", sectionId.data)
      .eq("status", "active");

    if (cntErr) {
      logSupabaseClientError(`${S}:count`, cntErr, { sectionId: sectionId.data });
      return { ok: false, code: "SAVE" };
    }
    const active = count ?? 0;
    if (maxParsed.data < active) return { ok: false, code: "BELOW_ACTIVE" };

    const { data: row, error: upErr } = await supabase
      .from("academic_sections")
      .update({ max_students: maxParsed.data })
      .eq("id", sectionId.data)
      .select("id, cohort_id")
      .maybeSingle();

    const section = row as { id: string; cohort_id: string } | null;
    if (upErr || !section?.id) {
      if (upErr) logSupabaseClientError(`${S}:update`, upErr, { sectionId: sectionId.data });
      return { ok: false, code: "SAVE" };
    }

    void recordSystemAudit({
      action: "academic_section_max_students_updated",
      resourceType: "academic_section",
      resourceId: section.id,
      payload: {
        cohort_id: section.cohort_id,
        max_students: maxParsed.data,
        active_enrollments: active,
      },
    });

    revalidateAcademicSurfaces(input.locale);
    revalidatePath(`/${input.locale}/dashboard/admin/academic/${section.cohort_id}`, "page");
    revalidatePath(`/${input.locale}/dashboard/admin/academic/${section.cohort_id}/${section.id}`, "page");
    return { ok: true };
  } catch (err) {
    logServerActionException(S, err, { sectionId: input.sectionId.trim() });
    return { ok: false, code: "SAVE" };
  }
}
