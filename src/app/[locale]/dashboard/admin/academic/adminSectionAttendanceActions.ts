"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";

const uuid = z.string().uuid();
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const payloadSchema = z.object({
  locale: z.string().min(1),
  cohortId: uuid,
  sectionId: uuid,
  enrollmentId: uuid,
  attendedOn: dateStr,
  status: z.enum(["present", "absent", "late", "excused"]),
});

export type AdminAttendanceCellState = { ok: true } | { ok: false; code: "auth" | "validation" | "forbidden" | "save" };

export async function adminUpsertSectionAttendanceCellAction(
  _prev: AdminAttendanceCellState | null,
  formData: FormData,
): Promise<AdminAttendanceCellState> {
  try {
    const { supabase, user } = await assertAdmin();
    const raw = formData.get("payload");
    const parsed = payloadSchema.safeParse(JSON.parse(typeof raw === "string" ? raw : "{}"));
    if (!parsed.success) return { ok: false, code: "validation" };

    const p = parsed.data;
    const { data: enr } = await supabase
      .from("section_enrollments")
      .select("id, section_id")
      .eq("id", p.enrollmentId)
      .maybeSingle();
    if (!enr || (enr.section_id as string) !== p.sectionId) return { ok: false, code: "forbidden" };

    const { data: sec } = await supabase
      .from("academic_sections")
      .select("id, cohort_id")
      .eq("id", p.sectionId)
      .maybeSingle();
    if (!sec || (sec.cohort_id as string) !== p.cohortId) return { ok: false, code: "forbidden" };

    const { error } = await supabase.from("section_attendance").upsert(
      {
        enrollment_id: p.enrollmentId,
        attended_on: p.attendedOn,
        status: p.status,
        notes: null,
        recorded_by: user.id,
      },
      { onConflict: "enrollment_id,attended_on" },
    );
    if (error) return { ok: false, code: "save" };

    revalidatePath(
      `/${p.locale}/dashboard/admin/academic/${p.cohortId}/${p.sectionId}/attendance`,
    );
    revalidatePath(`/${p.locale}/dashboard/admin/academic/${p.cohortId}/${p.sectionId}`);
    revalidatePath(`/${p.locale}/dashboard/student`);
    revalidatePath(`/${p.locale}/dashboard/parent`);
    return { ok: true };
  } catch {
    return { ok: false, code: "auth" };
  }
}
