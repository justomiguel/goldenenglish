"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertTeacher } from "@/lib/dashboard/assertTeacher";
import { enrollmentEligibleForAttendanceOnDate } from "@/lib/academics/sectionEnrollmentEligibleOnDate";
import { isTeacherAttendanceDateAllowed } from "@/lib/academics/sectionAttendanceDateWindow";

const uuid = z.string().uuid();
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const rowSchema = z.object({
  enrollmentId: uuid,
  status: z.enum(["present", "absent", "late", "excused"]),
  notes: z.string().max(2000).optional().nullable(),
});

const payloadSchema = z.object({
  locale: z.string().min(1),
  sectionId: uuid,
  attendedOn: dateStr,
  rows: z.array(rowSchema).min(1),
});

export type UpsertAttendanceActionState =
  | { ok: true }
  | {
      ok: false;
      code: "auth" | "validation" | "forbidden" | "save" | "outside_window" | "ineligible_enrollment";
    };

async function verifyTeacherSection(
  supabase: Awaited<ReturnType<typeof assertTeacher>>["supabase"],
  teacherId: string,
  sectionId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("academic_sections")
    .select("id")
    .eq("id", sectionId)
    .eq("teacher_id", teacherId)
    .maybeSingle();
  return Boolean(data);
}

async function verifyEnrollmentsEligibleForDate(
  supabase: Awaited<ReturnType<typeof assertTeacher>>["supabase"],
  sectionId: string,
  attendedOn: string,
  enrollmentIds: string[],
): Promise<boolean> {
  const { data, error } = await supabase
    .from("section_enrollments")
    .select("id, status, created_at, updated_at")
    .eq("section_id", sectionId)
    .in("id", enrollmentIds);
  if (error || !data || data.length !== enrollmentIds.length) return false;
  return data.every((row) =>
    enrollmentEligibleForAttendanceOnDate(
      attendedOn,
      String(row.created_at ?? ""),
      String(row.status ?? ""),
      String(row.updated_at ?? ""),
    ),
  );
}

export async function upsertAttendanceAction(
  _prev: UpsertAttendanceActionState | null,
  formData: FormData,
): Promise<UpsertAttendanceActionState> {
  try {
    const { supabase, profileId } = await assertTeacher();
    const raw = formData.get("payload");
    const parsed = payloadSchema.safeParse(JSON.parse(typeof raw === "string" ? raw : "{}"));
    if (!parsed.success) return { ok: false, code: "validation" };

    const { locale, sectionId, attendedOn, rows } = parsed.data;
    if (!isTeacherAttendanceDateAllowed(attendedOn)) {
      return { ok: false, code: "outside_window" };
    }

    const okSec = await verifyTeacherSection(supabase, profileId, sectionId);
    if (!okSec) return { ok: false, code: "forbidden" };

    const ids = [...new Set(rows.map((r) => r.enrollmentId))];
    const okEnr = await verifyEnrollmentsEligibleForDate(supabase, sectionId, attendedOn, ids);
    if (!okEnr) return { ok: false, code: "ineligible_enrollment" };

    const upsertRows = rows.map((r) => ({
      enrollment_id: r.enrollmentId,
      attended_on: attendedOn,
      status: r.status,
      notes: r.notes?.trim() ? r.notes.trim() : null,
      recorded_by: profileId,
    }));

    const { error } = await supabase.from("section_attendance").upsert(upsertRows, {
      onConflict: "enrollment_id,attended_on",
    });
    if (error) return { ok: false, code: "save" };

    revalidatePath(`/${locale}/dashboard/teacher/sections/${sectionId}/attendance`);
    revalidatePath(`/${locale}/dashboard/teacher/sections/${sectionId}`);
    revalidatePath(`/${locale}/dashboard/admin/academic`);
    revalidatePath(`/${locale}/dashboard/student`);
    revalidatePath(`/${locale}/dashboard/parent`);
    return { ok: true };
  } catch {
    return { ok: false, code: "auth" };
  }
}
