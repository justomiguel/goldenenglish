"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { revalidateAcademicSurfaces } from "@/app/[locale]/dashboard/admin/academic/revalidatePaths";
import { logServerActionException, logSupabaseClientError } from "@/lib/logging/serverActionLog";

const uuid = z.string().uuid();
const nameZ = z
  .string()
  .transform((s) => s.trim())
  .pipe(z.string().min(2).max(120));

const S = "updateAcademicSectionNameAction" as const;

export async function updateAcademicSectionNameAction(input: {
  locale: string;
  sectionId: string;
  name: string;
}): Promise<{ ok: true } | { ok: false; code: "PARSE" | "DUPLICATE" | "SAVE" }> {
  const sectionId = uuid.safeParse(input.sectionId.trim());
  const name = nameZ.safeParse(input.name);
  if (!sectionId.success || !name.success) return { ok: false, code: "PARSE" };

  try {
    const { supabase } = await assertAdmin();

    const { data: currentRow, error: loadErr } = await supabase
      .from("academic_sections")
      .select("id, cohort_id, name")
      .eq("id", sectionId.data)
      .maybeSingle();

    const current = currentRow as { id: string; cohort_id: string; name: string } | null;
    if (loadErr || !current?.id) {
      if (loadErr) logSupabaseClientError(`${S}:load`, loadErr, { sectionId: sectionId.data });
      return { ok: false, code: "SAVE" };
    }

    if (current.name.trim() === name.data) return { ok: true };

    const { data: siblings, error: sibErr } = await supabase
      .from("academic_sections")
      .select("id, name")
      .eq("cohort_id", current.cohort_id)
      .neq("id", sectionId.data);

    if (sibErr) {
      logSupabaseClientError(`${S}:siblings`, sibErr, { sectionId: sectionId.data });
      return { ok: false, code: "SAVE" };
    }

    const needle = name.data.toLowerCase();
    const clash = ((siblings ?? []) as { id: string; name: string }[]).some(
      (row) => row.name.trim().toLowerCase() === needle,
    );
    if (clash) return { ok: false, code: "DUPLICATE" };

    const { data: row, error: upErr } = await supabase
      .from("academic_sections")
      .update({ name: name.data })
      .eq("id", sectionId.data)
      .select("id, cohort_id, name")
      .maybeSingle();

    const section = row as { id: string; cohort_id: string; name: string } | null;
    if (upErr || !section?.id) {
      if (upErr) logSupabaseClientError(`${S}:update`, upErr, { sectionId: sectionId.data });
      return { ok: false, code: "SAVE" };
    }

    void recordSystemAudit({
      action: "academic_section_name_updated",
      resourceType: "academic_section",
      resourceId: section.id,
      payload: { cohort_id: section.cohort_id, name: section.name },
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
