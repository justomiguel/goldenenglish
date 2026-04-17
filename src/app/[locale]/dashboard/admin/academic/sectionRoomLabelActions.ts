"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { revalidateAcademicSurfaces } from "@/app/[locale]/dashboard/admin/academic/revalidatePaths";
import { logServerActionException, logSupabaseClientError } from "@/lib/logging/serverActionLog";

const uuid = z.string().uuid();
const roomZ = z
  .string()
  .max(120)
  .transform((s) => (s.trim() === "" ? null : s.trim()));

const S = "updateAcademicSectionRoomLabelAction" as const;

export async function updateAcademicSectionRoomLabelAction(input: {
  locale: string;
  sectionId: string;
  roomLabel: string;
}): Promise<{ ok: true } | { ok: false; code: "PARSE" | "SAVE" }> {
  const sectionId = uuid.safeParse(input.sectionId.trim());
  const label = roomZ.safeParse(input.roomLabel);
  if (!sectionId.success || !label.success) return { ok: false, code: "PARSE" };

  try {
    const { supabase } = await assertAdmin();
    const { data: row, error: upErr } = await supabase
      .from("academic_sections")
      .update({ room_label: label.data })
      .eq("id", sectionId.data)
      .select("id, cohort_id, room_label")
      .maybeSingle();

    const section = row as { id: string; cohort_id: string; room_label: string | null } | null;
    if (upErr || !section?.id) {
      if (upErr) logSupabaseClientError(`${S}:update`, upErr, { sectionId: sectionId.data });
      return { ok: false, code: "SAVE" };
    }

    void recordSystemAudit({
      action: "academic_section_room_label_updated",
      resourceType: "academic_section",
      resourceId: section.id,
      payload: { cohort_id: section.cohort_id, room_label: section.room_label },
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
