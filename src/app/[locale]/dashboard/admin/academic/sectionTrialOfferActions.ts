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
  offersTrial: z.union([z.null(), z.boolean()]),
  trialFeeAmount: z.union([z.null(), z.coerce.number().finite().min(0)]),
});

export type SetSectionTrialOfferCode = "PARSE" | "FORBIDDEN" | "SAVE";

const S = "setSectionTrialOfferAction" as const;

export async function setSectionTrialOfferAction(input: {
  locale: string;
  sectionId: string;
  offersTrial: boolean | null;
  trialFeeAmount: number | null;
}): Promise<{ ok: true } | { ok: false; code: SetSectionTrialOfferCode }> {
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
      .update({
        offers_trial: data.offersTrial,
        trial_fee_amount: data.trialFeeAmount,
      })
      .eq("id", data.sectionId);
    if (upErr) {
      logSupabaseClientError(`${S}:update`, upErr, { sectionId: data.sectionId });
      return { ok: false, code: "SAVE" };
    }

    void recordSystemAudit({
      action: "academic_section_trial_offer_updated",
      resourceType: "academic_section",
      resourceId: data.sectionId,
      payload: {
        cohort_id: cohortId,
        offers_trial: data.offersTrial,
        trial_fee_amount: data.trialFeeAmount,
      },
    });

    revalidateAcademicSurfaces(data.locale);
    revalidatePath(
      `/${data.locale}/dashboard/admin/academic/${cohortId}/${data.sectionId}`,
      "page",
    );
    return { ok: true };
  } catch (err) {
    logServerActionException(S, err, { sectionId: input.sectionId });
    return { ok: false, code: "SAVE" };
  }
}
