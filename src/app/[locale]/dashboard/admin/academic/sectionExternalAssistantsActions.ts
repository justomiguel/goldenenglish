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
const MAX_EXTERNAL = 30;
const S = "replaceAcademicSectionExternalAssistantsAction" as const;

export async function replaceAcademicSectionExternalAssistantsAction(input: {
  locale: string;
  sectionId: string;
  displayNames: string[];
}): Promise<{ ok: true } | { ok: false }> {
  const sectionId = uuid.safeParse(input.sectionId.trim());
  if (!sectionId.success) return { ok: false };

  const names = [...new Set(input.displayNames.map((s) => s.trim()).filter(Boolean))]
    .slice(0, MAX_EXTERNAL)
    .map((s) => s.slice(0, 200));

  try {
    const { supabase } = await assertAdmin();

    const { data: sec, error: sErr } = await supabase
      .from("academic_sections")
      .select("id, cohort_id")
      .eq("id", sectionId.data)
      .maybeSingle();
    if (sErr || !sec) {
      if (sErr) logSupabaseClientError(`${S}:section`, sErr, { sectionId: sectionId.data });
      return { ok: false };
    }

    const { error: delErr } = await supabase
      .from("academic_section_external_assistants")
      .delete()
      .eq("section_id", sectionId.data);
    if (delErr) {
      logSupabaseClientError(`${S}:delete`, delErr, { sectionId: sectionId.data });
      return { ok: false };
    }

    if (names.length) {
      const { error: insErr } = await supabase.from("academic_section_external_assistants").insert(
        names.map((display_name) => ({
          section_id: sectionId.data,
          display_name,
        })),
      );
      if (insErr) {
        logSupabaseClientError(`${S}:insert`, insErr, { sectionId: sectionId.data, n: names.length });
        return { ok: false };
      }
    }

    void recordSystemAudit({
      action: "academic_section_external_assistants_replaced",
      resourceType: "academic_section",
      resourceId: sectionId.data,
      payload: {
        cohort_id: (sec as { cohort_id: string }).cohort_id,
        display_names: names,
      },
    });

    revalidateAcademicSurfaces(input.locale);
    const cohortId = (sec as { cohort_id: string }).cohort_id;
    revalidatePath(`/${input.locale}/dashboard/admin/academic/${cohortId}`, "page");
    revalidatePath(`/${input.locale}/dashboard/admin/academic/${cohortId}/${sectionId.data}`, "page");
    return { ok: true };
  } catch (err) {
    logServerActionException(S, err, { sectionId: input.sectionId.trim() });
    return { ok: false };
  }
}
