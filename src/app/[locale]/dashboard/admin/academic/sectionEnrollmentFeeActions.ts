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

const inputSchema = z.object({
  locale: z.string().min(1),
  sectionId: uuid,
  /**
   * Monto de matrícula >= 0. La moneda se reusa del plan vigente, por lo que
   * no se almacena aquí (ver ADR `2026-04-section-enrollment-fee.md`).
   */
  enrollmentFeeAmount: z.coerce.number().finite().min(0),
});

export type SetSectionEnrollmentFeeCode = "PARSE" | "FORBIDDEN" | "SAVE";

const S = "setSectionEnrollmentFeeAmountAction" as const;

export async function setSectionEnrollmentFeeAmountAction(input: {
  locale: string;
  sectionId: string;
  enrollmentFeeAmount: number;
}): Promise<{ ok: true } | { ok: false; code: SetSectionEnrollmentFeeCode }> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "PARSE" };
  const data = parsed.data;

  try {
    const { supabase } = await assertAdmin();

    const { data: sec, error: secErr } = await supabase
      .from("academic_sections")
      .select("id, cohort_id")
      .eq("id", data.sectionId)
      .maybeSingle();
    if (secErr || !sec) {
      if (secErr) logSupabaseClientError(`${S}:section`, secErr, { sectionId: data.sectionId });
      return { ok: false, code: "SAVE" };
    }
    const cohortId = (sec as { cohort_id: string }).cohort_id;

    const { error: upErr } = await supabase
      .from("academic_sections")
      .update({ enrollment_fee_amount: data.enrollmentFeeAmount })
      .eq("id", data.sectionId);
    if (upErr) {
      logSupabaseClientError(`${S}:update`, upErr, { sectionId: data.sectionId });
      return { ok: false, code: "SAVE" };
    }

    void recordSystemAudit({
      action: "academic_section_enrollment_fee_updated",
      resourceType: "academic_section",
      resourceId: data.sectionId,
      payload: {
        cohort_id: cohortId,
        enrollment_fee_amount: data.enrollmentFeeAmount,
      },
    });

    revalidateAcademicSurfaces(data.locale);
    revalidatePath(
      `/${data.locale}/dashboard/admin/academic/${cohortId}/${data.sectionId}`,
      "page",
    );
    revalidatePath(`/${data.locale}/dashboard/student/payments`, "page");
    return { ok: true };
  } catch (err) {
    logServerActionException(S, err, { sectionId: input.sectionId });
    return { ok: false, code: "SAVE" };
  }
}
